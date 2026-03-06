import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 4, // 4 hours max impersonation
};

/**
 * POST /api/admin/impersonate
 * Start impersonating a specific user. Only super_admins can use this.
 */
export async function POST(request: NextRequest) {
  try {
    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID required" },
        { status: 400 }
      );
    }

    // Verify the requesting user is authenticated and is super_admin
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Fetch the target user's profile and roles
    const admin = createAdminClient();
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("id, full_name, name, email, role, allowed_roles")
      .eq("id", targetUserId)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Get the target user's active roles from user_roles table
    const { data: targetRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .eq("is_active", true);

    // Determine the best role to impersonate
    const activeRoleNames = (targetRoles ?? []).map((r) => r.role);
    const allowedRoles = targetProfile.allowed_roles ?? [targetProfile.role];

    // Prefer: borrower > investor > admin (to show the most interesting view)
    let effectiveRole = targetProfile.role ?? "borrower";
    if (activeRoleNames.includes("borrower") || allowedRoles.includes("borrower")) {
      effectiveRole = "borrower";
    } else if (activeRoleNames.includes("investor") || allowedRoles.includes("investor")) {
      effectiveRole = "investor";
    } else if (activeRoleNames.includes("admin") || allowedRoles.includes("admin")) {
      effectiveRole = "admin";
    }

    const displayName =
      targetProfile.full_name || targetProfile.name || targetProfile.email || "Unknown";

    // Log the impersonation event (table created via migration, cast for type safety)
    await (admin as any).from("admin_audit_log").insert({
      super_admin_user_id: user.id,
      impersonated_user_id: targetUserId,
    });

    // Set impersonation cookies
    const response = NextResponse.json({
      success: true,
      role: effectiveRole,
      userName: displayName,
      userEmail: targetProfile.email,
    });

    response.cookies.set("impersonate_user_id", targetUserId, COOKIE_OPTIONS);
    response.cookies.set("impersonate_role", effectiveRole, COOKIE_OPTIONS);
    response.cookies.set("impersonate_user_name", displayName, COOKIE_OPTIONS);
    response.cookies.set(
      "impersonate_user_email",
      targetProfile.email ?? "",
      COOKIE_OPTIONS
    );

    return response;
  } catch (err) {
    console.error("Impersonation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/impersonate
 * Stop impersonating and return to normal super admin view.
 */
export async function DELETE() {
  try {
    // Verify the requesting user is authenticated
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the audit log to set ended_at for the most recent impersonation
    const admin = createAdminClient();
    const adminAny = admin as any;
    const { data: latestLog } = await adminAny
      .from("admin_audit_log")
      .select("id")
      .eq("super_admin_user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestLog) {
      await adminAny
        .from("admin_audit_log")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", latestLog.id);
    }

    // Clear impersonation cookies
    const response = NextResponse.json({ success: true });

    const clearOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    };

    response.cookies.set("impersonate_user_id", "", clearOptions);
    response.cookies.set("impersonate_role", "", clearOptions);
    response.cookies.set("impersonate_user_name", "", clearOptions);
    response.cookies.set("impersonate_user_email", "", clearOptions);

    return response;
  } catch (err) {
    console.error("Stop impersonation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
