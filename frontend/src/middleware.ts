import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Define which routes are public (don't need authentication)
const publicRoutes = ["/", "/login"];

// Define which routes are auth routes (redirect to dashboard if logged in)
const authRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  console.log(session, "session");
  // If user is logged in and trying to access auth routes (login), redirect to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If user is NOT logged in and trying to access protected routes, redirect to login
  if (!isPublicRoute && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname); // Remember where they wanted to go
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\..*$).*)",
  ],
};