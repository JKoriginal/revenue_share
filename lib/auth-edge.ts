import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

const cookieName = "employee-revenue-session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type EdgeSessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export async function middlewareSession(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as EdgeSessionUser;
  } catch {
    return null;
  }
}
