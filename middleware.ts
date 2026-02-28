import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/confirm"];

const ROLE_ROUTE_ACCESS: Record<string, string[]> = {
  "/admin": ["super_admin", "admin"],
  "/borrower": ["borrower"],
  "/investor": ["investor"],
};

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!supabase) {
    return supabaseResponse;
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Unauthenticated → login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated on public route → portal hub
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Authenticated on role-restricted route — check user_roles
  if (user) {
    const matchedPrefix = Object.keys(ROLE_ROUTE_ACCESS).find((prefix) =>
      pathname.startsWith(prefix)
    );

    if (matchedPrefix) {
      const allowedRoles = ROLE_ROUTE_ACCESS[matchedPrefix];

      const { data: userRoles } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const roles = (userRoles || []).map((r: { role: string }) => r.role);
      const hasAccess = roles.some((role: string) => allowedRoles.includes(role));

      if (!hasAccess) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
