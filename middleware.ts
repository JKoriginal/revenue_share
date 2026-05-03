import { NextRequest, NextResponse } from "next/server";
import { middlewareSession } from "@/lib/auth-edge";

const publicPaths = ["/login"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicPaths.some((publicPath) => path.startsWith(publicPath));
  const isApi = path.startsWith("/api");

  if (isApi) return NextResponse.next();

  const user = await middlewareSession(req);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
