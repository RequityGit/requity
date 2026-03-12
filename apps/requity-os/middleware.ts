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
const PUBLIC_ROUTES = [
  "/login",
  "/auth/callback",
  "/auth/confirm",
];

export async function middleware(request: NextRequest) {
  // -----------------------------------------------------------------------
  // Force HTTPS — redirect any plain-HTTP request to HTTPS.
  // Netlify edge redirects should catch this first, but this is defense-in-depth.
  // -----------------------------------------------------------------------
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto === "http") {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https";
    return NextResponse.redirect(httpsUrl, 301);
  }

  const { pathname } = request.nextUrl;

  // -----------------------------------------------------------------------
  // Root path → redirect to /login (marketing site lives on a separate domain)
  // -----------------------------------------------------------------------
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // -----------------------------------------------------------------------
  // Check if the current route is public
  // -----------------------------------------------------------------------
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

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

    // Don't redirect unauthorized users to dashboard — let them stay on login
    if (!profile || profile.activation_status === "unauthorized") {
      return supabaseResponse;
    }

    if (profile.role) {
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
      // Check if user is impersonating — super_admins impersonating can
      // access any role route matching the impersonated user's role
      const impersonateUserId = request.cookies.get("impersonate_user_id")?.value;
      const impersonateRole = request.cookies.get("impersonate_role")?.value;

      if (impersonateUserId && impersonateRole) {
        // The impersonating super_admin can access the impersonated user's role routes
        const targetRoleEntry = Object.entries(ROLE_ROUTES).find(([, prefix]) =>
          pathname.startsWith(prefix)
        );

        if (targetRoleEntry) {
          const targetRole = targetRoleEntry[0];
          // Allow access if the route matches the impersonated role
          if (targetRole === impersonateRole) {
            return supabaseResponse;
          }
          // Otherwise redirect to the impersonated role's dashboard
          const url = request.nextUrl.clone();
          url.pathname = ROLE_DASHBOARDS[impersonateRole] || "/admin/dashboard";
          return NextResponse.redirect(url);
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, allowed_roles, activation_status")
        .eq("id", user.id)
        .single();

      // Block unauthorized profiles from accessing any role routes
      if (!profile || profile.activation_status === "unauthorized") {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "no_access");
        return NextResponse.redirect(url);
      }

      if (profile.role) {
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
     * - sw.js, manifest.json, offline.html (PWA files served from public/)
     * - icons/ directory
     * - public folder assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};
