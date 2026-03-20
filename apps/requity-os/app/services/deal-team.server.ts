import type { DealTeamContact } from "@/app/types/deal-team";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

const DEAL_TEAM_SELECT = `
  *,
  contact:crm_contacts(id, first_name, last_name, email, phone, company_name)
`;

export async function getDealTeamContacts(
  supabase: AdminClient,
  dealId: string
): Promise<DealTeamContact[]> {
  const { data, error } = await supabase
    .from("deal_team_contacts" as never)
    .select(DEAL_TEAM_SELECT)
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DealTeamContact[];
}

export async function addDealTeamContact(
  supabase: AdminClient,
  entry: {
    deal_id: string;
    role: string;
    contact_id?: string | null;
    manual_name?: string;
    manual_company?: string;
    manual_phone?: string;
    manual_email?: string;
    notes?: string;
    sort_order?: number;
  }
): Promise<DealTeamContact> {
  const { data, error } = await supabase
    .from("deal_team_contacts" as never)
    .insert(entry as never)
    .select(DEAL_TEAM_SELECT)
    .single();
  if (error) throw error;
  return data as DealTeamContact;
}

export async function updateDealTeamContact(
  supabase: AdminClient,
  id: string,
  updates: Partial<
    Pick<
      DealTeamContact,
      | "role"
      | "contact_id"
      | "manual_name"
      | "manual_company"
      | "manual_phone"
      | "manual_email"
      | "notes"
      | "sort_order"
    >
  >
): Promise<DealTeamContact> {
  const { data, error } = await supabase
    .from("deal_team_contacts" as never)
    .update(updates as never)
    .eq("id", id)
    .select(DEAL_TEAM_SELECT)
    .single();
  if (error) throw error;
  return data as DealTeamContact;
}

export async function removeDealTeamContact(
  supabase: AdminClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("deal_team_contacts" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
}
