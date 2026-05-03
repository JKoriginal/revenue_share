import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const cookieName = "employee-revenue-session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey());

  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export function clearSession() {
  cookies().delete(cookieName);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.SUPERADMIN) redirect("/dashboard");
  return user;
}

export async function requireApiUser() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return { user, response: null };
}

export async function requireApiSuperAdmin() {
  const auth = await requireApiUser();
  if (auth.response) return auth;
  if (auth.user?.role !== UserRole.SUPERADMIN) {
    return { user: auth.user, response: NextResponse.json({ message: "Super admin access required" }, { status: 403 }) };
  }
  return auth;
}

export async function loginWithEmail(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}
