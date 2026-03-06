import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersClient } from "@/components/control-center/users-client";

export default async function ControlCenterUsersPage() {
  const supabase = createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profiles and user_roles separately, then merge.
  // The nested join profiles→user_roles fails because the FK
  // user_roles_user_id_fkey references auth.users, not profiles.
  const [profilesResult, rolesResult, investorsResult, borrowersResult, modulesResult, moduleAccessResult] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, full_name, company_name, phone, activation_status")
        .order("name"),
      admin
        .from("user_roles")
        .select("id, user_id, role, is_active, granted_by, granted_at, investor_id, borrower_id"),
      admin
        .from("investors")
        .select("id, crm_contacts(first_name, last_name, email)")
        .order("id"),
      admin
        .from("borrowers")
        .select("id, crm_contacts(first_name, last_name, email)")
        .order("id"),
      admin
        .from("modules")
        .select("id, name, label, icon, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order"),
      admin
        .from("user_module_access")
        .select("user_id, module_id"),
    ]);

  // Group roles by user_id
  const rolesByUser: Record<string, UserRole[]> = {};
  for (const r of rolesResult.data ?? []) {
    const uid = (r as { user_id: string }).user_id;
    if (!rolesByUser[uid]) rolesByUser[uid] = [];
    rolesByUser[uid].push({
      id: r.id,
      role: r.role,
      is_active: r.is_active,
      granted_by: r.granted_by,
      granted_at: r.granted_at,
      investor_id: r.investor_id,
      borrower_id: r.borrower_id,
    });
  }

  // Group module access by user_id
  const moduleAccessByUser: Record<string, string[]> = {};
  for (const ma of moduleAccessResult.data ?? []) {
    const uid = ma.user_id;
    if (!moduleAccessByUser[uid]) moduleAccessByUser[uid] = [];
    moduleAccessByUser[uid].push(ma.module_id);
  }

  // Merge profiles with their roles and module access
  const profiles: ProfileWithRoles[] = (profilesResult.data ?? []).map((p) => ({
    ...p,
    user_roles: rolesByUser[p.id] ?? [],
    module_ids: moduleAccessByUser[p.id] ?? [],
  }));

  // Build a map of user_id -> profile name for "granted_by" display
  const grantedByMap: Record<string, string> = {};
  (profilesResult.data ?? []).forEach((p) => {
    grantedByMap[p.id] = p.full_name || p.name || p.email || "Unknown";
  });

  const modules = (modulesResult.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    label: m.label,
    icon: m.icon,
    sort_order: m.sort_order ?? 0,
  }));

  return (
    <UsersClient
      profiles={profiles}
      investors={(investorsResult.data ?? []).map((inv) => {
        const c = inv.crm_contacts as { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
        return { id: inv.id, first_name: c?.first_name ?? null, last_name: c?.last_name ?? null, email: c?.email ?? null };
      })}
      borrowers={(borrowersResult.data ?? []).map((b) => {
        const c = b.crm_contacts as { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
        return { id: b.id, first_name: c?.first_name ?? null, last_name: c?.last_name ?? null, email: c?.email ?? null };
      })}
      grantedByMap={grantedByMap}
      currentUserId={user?.id ?? ""}
      modules={modules}
    />
  );
}

interface UserRole {
  id: string;
  role: string;
  is_active: boolean;
  granted_by: string | null;
  granted_at: string;
  investor_id: string | null;
  borrower_id: string | null;
}

interface ProfileWithRoles {
  id: string;
  name: string | null;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  activation_status: string | null;
  user_roles: UserRole[];
  module_ids: string[];
}
