import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_AUTH_COOKIE_NAME } from "@/lib/supabase/constants";
import { updateSession } from "@/lib/supabase/middleware";
import {
  AUTH_SNAPSHOT_COOKIE,
  AUTH_SNAPSHOT_HEADER,
  buildAuthSnapshot,
  decodeAuthSnapshot,
  encodeAuthSnapshot,
  isSnapshotFresh,
  toSnapshotPayload,
} from "@/lib/auth/auth-snapshot";

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
  "/upload",
  "/api/upload-link", // token-based upload (no auth required)
  "/api/deal-messages", // token-based borrower messaging (auth handled in route)
  "/api/gmail/auth/callback", // OAuth redirect - handles own auth via state param
];

// Routes accessible to BOTH authenticated and unauthenticated users.
// Unlike PUBLIC_ROUTES, authenticated users are NOT redirected to their dashboard.
const PASSTHROUGH_ROUTES = [
  "/invest", // public soft-commitment investment forms
  "/api/fundraise", // deal fundraise info (used by invest pages)
  "/api/forms", // form definitions, submissions, deal-token (used by form engine)
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

  // /settings → /{role}/account (preserves query params for Gmail OAuth callback)
  if (pathname === "/settings") {
    const cookieRole = request.cookies.get("active_role")?.value;
    const rolePrefix =
      cookieRole === "borrower" ? "/b" : cookieRole === "investor" ? "/i" : "";
    const url = request.nextUrl.clone();
    url.pathname = `${rolePrefix}/account`;
    return NextResponse.redirect(url);
  }

  // Passthrough routes are accessible regardless of auth state — no redirects.
  const isPassthrough = PASSTHROUGH_ROUTES.some((r) => pathname.startsWith(r));
  if (isPassthrough) return NextResponse.next();

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Fast path: on public routes, skip Supabase entirely when there's no auth cookie.
  // This avoids a slow getUser() round-trip for every unauthenticated /login visit.
  // Use prefix scan to handle chunked cookies (sb-...-auth-token.0, .1, etc.)
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith(SUPABASE_AUTH_COOKIE_NAME));

  if (isPublicRoute && !hasAuthCookie) {
    // Root path with no auth cookie → /login
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);

  let response = supabaseResponse;

  if (user) {
    const snapRaw = request.cookies.get(AUTH_SNAPSHOT_COOKIE)?.value;
    const parsed = snapRaw ? decodeAuthSnapshot(snapRaw) : null;
    const needsRefresh =
      !parsed || parsed.uid !== user.id || !isSnapshotFresh(parsed);

    if (needsRefresh) {
      const partial = await buildAuthSnapshot(supabase, user.id);
      const payload = toSnapshotPayload(partial);
      const encoded = encodeAuthSnapshot(payload);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(AUTH_SNAPSHOT_HEADER, encoded);
      const res = NextResponse.next({
        request: { headers: requestHeaders },
      });
      supabaseResponse.cookies.getAll().forEach((c) => {
        res.cookies.set(c.name, c.value, c);
      });
      res.cookies.set(AUTH_SNAPSHOT_COOKIE, encoded, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      response = res;
    }
  } else if (request.cookies.get(AUTH_SNAPSHOT_COOKIE)?.value) {
    const res = NextResponse.next();
    supabaseResponse.cookies.getAll().forEach((c) => {
      res.cookies.set(c.name, c.value, c);
    });
    res.cookies.set(AUTH_SNAPSHOT_COOKIE, "", { maxAge: 0, path: "/" });
    response = res;
  }

  // -----------------------------------------------------------------------
  // Root path → redirect based on auth state (after session refresh)
  // -----------------------------------------------------------------------
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/pipeline" : "/login";
    const redirectRes = NextResponse.redirect(url);
    if (user) {
      response.cookies.getAll().forEach((c) => {
        redirectRes.cookies.set(c.name, c.value, c);
      });
    }
    return redirectRes;
  }

  // -----------------------------------------------------------------------
  // Unauthenticated user trying to access a protected route → /login
  // -----------------------------------------------------------------------
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    const redirectRes = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value, c);
    });
    if (request.cookies.get(AUTH_SNAPSHOT_COOKIE)?.value) {
      redirectRes.cookies.set(AUTH_SNAPSHOT_COOKIE, "", { maxAge: 0, path: "/" });
    }
    return redirectRes;
  }

  // -----------------------------------------------------------------------
  // Authenticated user on a public route (e.g. /login) → redirect to dashboard
  // -----------------------------------------------------------------------
  if (user && isPublicRoute && !pathname.startsWith("/api/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, allowed_roles, activation_status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.activation_status === "unauthorized") {
      return response;
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
      const redirectRes = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => {
        redirectRes.cookies.set(c.name, c.value, c);
      });
      return redirectRes;
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
            return response;
          }
          const url = request.nextUrl.clone();
          url.pathname = ROLE_DASHBOARDS[impersonateRole] || "/pipeline";
          const redirectRes = NextResponse.redirect(url);
          response.cookies.getAll().forEach((c) => {
            redirectRes.cookies.set(c.name, c.value, c);
          });
          return redirectRes;
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
        const redirectRes = NextResponse.redirect(url);
        response.cookies.getAll().forEach((c) => {
          redirectRes.cookies.set(c.name, c.value, c);
        });
        return redirectRes;
      }

      if (profile.role) {
        const allowedRoles: string[] = profile.allowed_roles || [profile.role];

        const targetRoleEntry = Object.entries(ROLE_ROUTES).find(([, prefix]) =>
          pathname.startsWith(prefix)
        );

        if (targetRoleEntry) {
          const targetRole = targetRoleEntry[0];

          if (allowedRoles.includes(targetRole)) {
            return response;
          }

          const activeRoleCookie = request.cookies.get("active_role")?.value;
          const effectiveRole =
            activeRoleCookie && allowedRoles.includes(activeRoleCookie)
              ? activeRoleCookie
              : profile.role;

          const url = request.nextUrl.clone();
          url.pathname =
            ROLE_DASHBOARDS[effectiveRole] || "/b/dashboard";
          const redirectRes = NextResponse.redirect(url);
          response.cookies.getAll().forEach((c) => {
            redirectRes.cookies.set(c.name, c.value, c);
          });
          return redirectRes;
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};
