import { NextRequest, NextResponse } from "next/server";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "portfolio.local";
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || "http://backend:8000";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static files through
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // admin.{MAIN_DOMAIN} → rewrite to /admin paths
  if (hostname === `admin.${MAIN_DOMAIN}`) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/admin", request.url));
    }
    if (!pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
    return NextResponse.next();
  }

  // app.{MAIN_DOMAIN} → rewrite to dashboard/auth paths
  if (hostname === `app.${MAIN_DOMAIN}`) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/app-root", request.url));
    }
    // Allow login, register, dashboard paths through
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/dashboard")
    ) {
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // {slug}.public-resume.{MAIN_DOMAIN} → rewrite to /portfolio/{slug}
  const publicResumeSuffix = `.public-resume.${MAIN_DOMAIN}`;
  if (hostname.endsWith(publicResumeSuffix)) {
    const slug = hostname.slice(0, -publicResumeSuffix.length);
    if (slug && !slug.includes(".")) {
      return NextResponse.rewrite(new URL(`/portfolio/${slug}${pathname === "/" ? "" : pathname}`, request.url));
    }
  }

  // Unknown hostname — try resolving as custom domain
  try {
    const res = await fetch(`${API_INTERNAL_URL}/api/users/resolve-domain?domain=${hostname}`);
    if (res.ok) {
      const { slug } = await res.json();
      return NextResponse.rewrite(
        new URL(`/portfolio/${slug}${pathname === "/" ? "" : pathname}`, request.url)
      );
    }
  } catch {}

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
