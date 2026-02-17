import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const publicRoutes = [
  "/",
  "/login",
  "/feedback",
  "/complaint",
  "/track-complaint",
];
const authRoutes = ["/login"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Apply intl middleware first

  const intlResponse = intlMiddleware(req);

  // Get locale
  const locale =
    routing.locales.find((l) => pathname.startsWith(`/${l}`)) ??
    routing.defaultLocale;

  const pathnameWithoutLocale =
    pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  // 🔥 CRITICAL: Check ALL possible NextAuth session cookies
  const allCookies = req.cookies.getAll();
  const sessionCookies = [
    "next-auth.session-token", // Default in development
    "__Secure-next-auth.session-token", // Secure version
    "authjs.session-token", // NextAuth v5
    "__Secure-authjs.session-token", // Secure v5
  ];

  let hasSessionToken = false;

  // Check each cookie name
  for (const cookie of allCookies) {
    if (sessionCookies.includes(cookie.name) && cookie.value) {
      hasSessionToken = true;
      break;
    }
  }

  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale);
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale);

  console.log("🔐 MIDDLEWARE DEBUG:");
  console.log("  Path:", pathnameWithoutLocale);
  console.log(
    "  Found cookies:",
    allCookies.map((c) => c.name),
  );
  console.log("  Has session token:", hasSessionToken);
  console.log("  Is public route:", isPublicRoute);

  // 🔐 Rule 1: If logged in and trying to access login page, redirect to dashboard
  if (isAuthRoute && hasSessionToken) {
    console.log("  Redirecting authenticated user to dashboard");
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  // 🔒 Rule 2: If NOT logged in and trying to access protected route, redirect to login
  if (!isPublicRoute && !hasSessionToken) {
    console.log("  Redirecting unauthenticated user to login");
    const loginUrl = new URL(`/${locale}/login`, req.url);
    // Use the full pathname, not pathnameWithoutLocale
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Allow access
  return intlResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files, API routes, etc.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)",
  ],
};
