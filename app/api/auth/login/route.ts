import { NextResponse } from "next/server";
import { createSession, loginWithEmail } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await loginWithEmail(String(body.email || ""), String(body.password || ""));

  if (!user) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ user });
}
