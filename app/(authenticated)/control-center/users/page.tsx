import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "@/components/control-center/users-client";

export default async function ControlCenterUsersPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profiles with their roles
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      `
      id, name, email, full_name, company_name, phone, activation_status,
      user_roles!user_roles_user_id_fkey (id, role, is_active, granted_by, granted_at, investor_id, borrower_id)
    `
    )
    .order("name");

  // Fetch investors and borrowers for role linking
  const [investorsResult, borrowersResult, grantedByResult] = await Promise.all([
    supabase
      .from("investors")
      .select("id, first_name, last_name, email")
      .order("first_name"),
    supabase
      .from("borrowers")
      .select("id, first_name, last_name, email")
      .order("first_name"),
    supabase.from("profiles").select("id, name, full_name, email"),
  ]);

  // Build a map of user_id -> profile name for "granted_by" display
  const grantedByMap: Record<string, string> = {};
  (grantedByResult.data ?? []).forEach((p) => {
    grantedByMap[p.id] = p.full_name || p.name || p.email || "Unknown";
  });

  return (
    <UsersClient
      profiles={(profiles as unknown as ProfileWithRoles[]) ?? []}
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
    role: string;
    is_active: boolean;
    granted_by: string | null;
    granted_at: string;
    investor_id: string | null;
    borrower_id: string | null;
  }[];
}
