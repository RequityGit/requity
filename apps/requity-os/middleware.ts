import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_AUTH_COOKIE_NAME } from "@/lib/supabase/constants";
import { updateSession } from "@/lib/supabase/middleware";

// Role-based route prefixes (admin routes are now top-level, guarded by layout)
const ROLE_ROUTES: Record<string, string> = {
  borrower: "/b",
  investor: "/i",
};

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/pipeline",
  super_admin: "/pipeline",
  borrower: "/b/dashboard",
  investor: "/i/dashboard",
};

const PUBLIC_ROUTES = [
  "/login",
  "/auth/callback",
  "/auth/confirm",
];

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (proto === "http") {
      const httpsUrl = request.nextUrl.clone();
      httpsUrl.protocol = "https";
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  const { pathname } = request.nextUrl;

  // -----------------------------------------------------------------------
  // Legacy URL redirects: /admin/*, /borrower/*, /investor/*
  // -----------------------------------------------------------------------
  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    const newPath = pathname.replace(/^\/admin/, "") || "/pipeline";
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }
  if (pathname.startsWith("/borrower/") || pathname === "/borrower") {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/borrower/, "/b");
    return NextResponse.redirect(url, 301);
  }
  if (pathname.startsWith("/investor/") || pathname === "/investor") {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/investor/, "/i");
    return NextResponse.redirect(url, 301);
  }

  // -----------------------------------------------------------------------
  // Root path → redirect to /login
  // -----------------------------------------------------------------------
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Fast path: on public routes, skip Supabase entirely when there's no auth cookie.
  // This avoids a slow getUser() round-trip for every unauthenticated /login visit.
  if (isPublicRoute && !request.cookies.get(SUPABASE_AUTH_COOKIE_NAME)?.value) {
    return NextResponse.next();
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);

  // -----------------------------------------------------------------------
  // Unauthenticated user trying to access a protected route → /login
  // -----------------------------------------------------------------------
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // -----------------------------------------------------------------------
  // Authenticated user on a public route (e.g. /login) → redirect to dashboard
  // -----------------------------------------------------------------------
  if (user && isPublicRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, allowed_roles, activation_status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.activation_status === "unauthorized") {
      return supabaseResponse;
    }

    if (profile.role) {
      const activeRoleCookie = request.cookies.get("active_role")?.value;
      const allowedRoles: string[] = profile.allowed_roles || [profile.role];
      const effectiveRole =
        activeRoleCookie && allowedRoles.includes(activeRoleCookie)
          ? activeRoleCookie
          : profile.role;

      const dashboardPath =
        ROLE_DASHBOARDS[effectiveRole] || "/b/dashboard";
      const url = request.nextUrl.clone();
      url.pathname = dashboardPath;
      return NextResponse.redirect(url);
    }
  }

  // -----------------------------------------------------------------------
  // Authenticated user accessing /b/* or /i/* role-restricted routes
  // Admin routes are guarded by the (admin) layout, not middleware.
  // -----------------------------------------------------------------------
  if (user) {
    const isRoleRoute = Object.values(ROLE_ROUTES).some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (isRoleRoute) {
      const impersonateUserId = request.cookies.get("impersonate_user_id")?.value;
      const impersonateRole = request.cookies.get("impersonate_role")?.value;

      if (impersonateUserId && impersonateRole) {
        const targetRoleEntry = Object.entries(ROLE_ROUTES).find(([, prefix]) =>
          pathname.startsWith(prefix)
        );

        if (targetRoleEntry) {
          const targetRole = targetRoleEntry[0];
          if (targetRole === impersonateRole) {
            return supabaseResponse;
          }
          const url = request.nextUrl.clone();
          url.pathname = ROLE_DASHBOARDS[impersonateRole] || "/pipeline";
          return NextResponse.redirect(url);
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, allowed_roles, activation_status")
        .eq("id", user.id)
        .single();

      if (!profile || profile.activation_status === "unauthorized") {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "no_access");
        return NextResponse.redirect(url);
      }

      if (profile.role) {
        const allowedRoles: string[] = profile.allowed_roles || [profile.role];

        const targetRoleEntry = Object.entries(ROLE_ROUTES).find(([, prefix]) =>
          pathname.startsWith(prefix)
        );

        if (targetRoleEntry) {
          const targetRole = targetRoleEntry[0];

          if (allowedRoles.includes(targetRole)) {
            return supabaseResponse;
          }

          const activeRoleCookie = request.cookies.get("active_role")?.value;
          const effectiveRole =
            activeRoleCookie && allowedRoles.includes(activeRoleCookie)
              ? activeRoleCookie
              : profile.role;

          const url = request.nextUrl.clone();
          url.pathname =
            ROLE_DASHBOARDS[effectiveRole] || "/b/dashboard";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};
