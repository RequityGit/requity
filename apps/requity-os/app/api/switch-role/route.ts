import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_ROLES = ["admin", "borrower", "investor"] as const;

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/admin/dashboard",
  borrower: "/borrower/dashboard",
  investor: "/investor/dashboard",
};

export async function POST(request: NextRequest) {
  const { role } = await request.json();

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("allowed_roles")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const allowedRoles: string[] = profile.allowed_roles || [];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Role not permitted" },
      { status: 403 }
    );
  }

  const redirectUrl = ROLE_DASHBOARDS[role] || "/borrower/dashboard";
  const response = NextResponse.json({ success: true, redirect: redirectUrl });

  response.cookies.set("active_role", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
