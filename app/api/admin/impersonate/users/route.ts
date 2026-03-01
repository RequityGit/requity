import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/impersonate/users
 * Returns a list of all users with their active roles for the impersonation search modal.
 * Only accessible by super_admins.
 */
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify super_admin
    const { data: superAdminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .eq("is_active", true)
      .maybeSingle();

    if (!superAdminRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all profiles with their active roles
    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select(
        `
        id, full_name, name, email,
        user_roles!user_roles_user_id_fkey (role, is_active)
      `
      )
      .order("full_name");

    type ProfileWithRoles = {
      id: string;
      full_name: string | null;
      name: string | null;
      email: string | null;
      user_roles: { role: string; is_active: boolean }[];
    };

    const users = ((profiles as unknown as ProfileWithRoles[]) ?? []).map(
      (p) => ({
        id: p.id,
        full_name: p.full_name,
        name: p.name,
        email: p.email,
        roles: p.user_roles
          .filter((r) => r.is_active)
          .map((r) => r.role),
      })
    );

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Fetch impersonation users error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
