import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Role-based route prefixes
const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin",
  borrower: "/borrower",
  investor: "/investor",
};

// Default dashboards for each role
const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/admin/dashboard",
  borrower: "/borrower/dashboard",
  investor: "/investor/dashboard",
};

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/confirm"];

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // If Supabase is not configured, let requests through
  if (!supabase) {
    return supabaseResponse;
  }

  // -----------------------------------------------------------------------
  // Check if the current route is public
  // -----------------------------------------------------------------------
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

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
      .select("role, allowed_roles")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      // Use the active_role cookie if it's valid, otherwise use the default role
      const activeRoleCookie = request.cookies.get("active_role")?.value;
      const allowedRoles: string[] = profile.allowed_roles || [profile.role];
      const effectiveRole =
        activeRoleCookie && allowedRoles.includes(activeRoleCookie)
          ? activeRoleCookie
          : profile.role;

      const dashboardPath =
        ROLE_DASHBOARDS[effectiveRole] || "/borrower/dashboard";
      const url = request.nextUrl.clone();
      url.pathname = dashboardPath;
      return NextResponse.redirect(url);
    }
  }

  // -----------------------------------------------------------------------
  // Authenticated user accessing a role-restricted route
  // Validate against allowed_roles (supports role switching)
  // -----------------------------------------------------------------------
  if (user) {
    const isRoleRoute = Object.values(ROLE_ROUTES).some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (isRoleRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, allowed_roles")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        const allowedRoles: string[] = profile.allowed_roles || [profile.role];

        // Determine which role prefix the user is trying to access
        const targetRoleEntry = Object.entries(ROLE_ROUTES).find(([, prefix]) =>
          pathname.startsWith(prefix)
        );

        if (targetRoleEntry) {
          const targetRole = targetRoleEntry[0];

          // Allow if the target role is in the user's allowed_roles
          if (allowedRoles.includes(targetRole)) {
            return supabaseResponse;
          }

          // Otherwise redirect to the effective role's dashboard
          const activeRoleCookie = request.cookies.get("active_role")?.value;
          const effectiveRole =
            activeRoleCookie && allowedRoles.includes(activeRoleCookie)
              ? activeRoleCookie
              : profile.role;

          const url = request.nextUrl.clone();
          url.pathname =
            ROLE_DASHBOARDS[effectiveRole] || "/borrower/dashboard";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, svgs, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
