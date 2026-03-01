import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "@/components/control-center/users-client";

export default async function ControlCenterUsersPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profiles and user_roles separately since there's no direct FK
  // relationship between profiles and user_roles in PostgREST
  const [profilesResult, rolesResult, investorsResult, borrowersResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email, full_name, company_name, phone, activation_status")
        .order("name"),
      supabase
        .from("user_roles")
        .select("id, user_id, role, is_active, granted_by, granted_at, investor_id, borrower_id"),
      supabase
        .from("investors")
        .select("id, first_name, last_name, email")
        .order("first_name"),
      supabase
        .from("borrowers")
        .select("id, first_name, last_name, email")
        .order("first_name"),
    ]);

  const rawProfiles = profilesResult.data ?? [];
  const allRoles = rolesResult.data ?? [];

  // Group roles by user_id
  const rolesByUser = new Map<string, typeof allRoles>();
  for (const role of allRoles) {
    const existing = rolesByUser.get(role.user_id) ?? [];
    existing.push(role);
    rolesByUser.set(role.user_id, existing);
  }

  // Join profiles with their roles
  const profiles: ProfileWithRoles[] = rawProfiles.map((p) => ({
    ...p,
    user_roles: rolesByUser.get(p.id) ?? [],
  }));

  // Build a map of user_id -> profile name for "granted_by" display
  const grantedByMap: Record<string, string> = {};
  rawProfiles.forEach((p) => {
    grantedByMap[p.id] = p.full_name || p.name || p.email || "Unknown";
  });

  return (
    <UsersClient
      profiles={profiles}
      investors={investorsResult.data ?? []}
      borrowers={borrowersResult.data ?? []}
      grantedByMap={grantedByMap}
      currentUserId={user?.id ?? ""}
    />
  );
}

interface ProfileWithRoles {
  id: string;
  name: string | null;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  activation_status: string | null;
  user_roles: {
    id: string;
    user_id: string;
    role: string;
    is_active: boolean;
    granted_by: string | null;
    granted_at: string;
    investor_id: string | null;
    borrower_id: string | null;
  }[];
}
