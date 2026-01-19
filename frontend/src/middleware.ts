import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// 1️⃣ Create next-intl middleware instance
const intlMiddleware = createMiddleware(routing);

// Public routes (no auth required)
const publicRoutes = ["/", "/login", "/feedback", "/complaint"];

// Auth routes (redirect if already logged in)
const authRoutes = ["/login"];

// 2️⃣ SINGLE default export
export default async function middleware(req: NextRequest) {
  // Run next-intl first
  const intlResponse = intlMiddleware(req);
  if (intlResponse) return intlResponse;

  // Run auth logic
  const session = await auth();
  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // Logged-in user visiting login → redirect
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Not logged in & protected route → redirect to login
  if (!isPublicRoute && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 3️⃣ Config stays the same
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\..*$).*)",
  ],
};
