import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const publicRoutes = ["/", "/login", "/feedback", "/complaint"];
const authRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 👇 run intl but DO NOT return yet
  const intlResponse = intlMiddleware(req);

  // Get locale from pathname
  const locale = routing.locales.find((l) =>
    pathname.startsWith(`/${l}`)
  ) ?? routing.defaultLocale;

  const pathnameWithoutLocale = pathname.replace(
    new RegExp(`^/${locale}`),
    ""
  ) || "/";

  const session = await auth();


  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale);
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale);

  // 🔐 Auth redirect
  if (isAuthRoute && session) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, req.url)
    );
  }

  if (!isPublicRoute && !session) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ return intl response if it exists
  return intlResponse ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
