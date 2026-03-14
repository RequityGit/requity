"use server";

import type {
  DealBorrowingEntity,
  DealBorrowerMember,
  BorrowerProfile,
} from "@/app/types/borrower";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

// --- Borrowing Entity ---

export async function getBorrowingEntityByDealId(
  supabase: AdminClient,
  dealId: string
): Promise<DealBorrowingEntity | null> {
  const { data, error } = await supabase
    .from("deal_borrowing_entities" as never)
    .select("*")
    .eq("deal_id", dealId)
    .maybeSingle();
  if (error) throw error;
  return data as DealBorrowingEntity | null;
}

export async function upsertBorrowingEntity(
  supabase: AdminClient,
  entity: Partial<DealBorrowingEntity> & { deal_id: string }
): Promise<DealBorrowingEntity> {
  const { data, error } = await supabase
    .from("deal_borrowing_entities" as never)
    .upsert(entity as never, { onConflict: "deal_id" })
    .select()
    .single();
  if (error) throw error;
  return data as DealBorrowingEntity;
}

export async function deleteBorrowingEntity(
  supabase: AdminClient,
  entityId: string
): Promise<void> {
  const { error } = await supabase
    .from("deal_borrowing_entities" as never)
    .delete()
    .eq("id", entityId);
  if (error) throw error;
}

// --- Borrower Members ---

const MEMBER_SELECT =
  "*, contact:crm_contacts(id, first_name, last_name, email, phone)";

export async function getBorrowerMembersByDealId(
  supabase: AdminClient,
  dealId: string
): Promise<DealBorrowerMember[]> {
  const { data, error } = await supabase
    .from("deal_borrower_members" as never)
    .select(MEMBER_SELECT)
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DealBorrowerMember[];
}

export async function addBorrowerMember(
  supabase: AdminClient,
  member: {
    borrowing_entity_id: string;
    deal_id: string;
    contact_id: string;
    role?: string;
  }
): Promise<DealBorrowerMember> {
  const { data: profile } = await supabase
    .from("borrower_profiles" as never)
    .select("*")
    .eq("contact_id", member.contact_id)
    .maybeSingle();

  const profileData = profile as BorrowerProfile | null;

  const { count } = await supabase
    .from("deal_borrower_members" as never)
    .select("id", { count: "exact", head: true })
    .eq("borrowing_entity_id", member.borrowing_entity_id);

  const insertData = {
    ...member,
    role: member.role ?? "Member",
    credit_score: profileData?.default_credit_score ?? 0,
    liquidity: profileData?.default_liquidity ?? 0,
    net_worth: profileData?.default_net_worth ?? 0,
    experience: profileData?.default_experience ?? 0,
    sort_order: (count ?? 0) + 1,
  };

  const { data, error } = await supabase
    .from("deal_borrower_members" as never)
    .insert(insertData as never)
    .select(MEMBER_SELECT)
    .single();
  if (error) throw error;
  return data as DealBorrowerMember;
}

export async function updateBorrowerMember(
  supabase: AdminClient,
  memberId: string,
  updates: Partial<DealBorrowerMember>
): Promise<DealBorrowerMember> {
  const { data, error } = await supabase
    .from("deal_borrower_members" as never)
    .update(updates as never)
    .eq("id", memberId)
    .select(MEMBER_SELECT)
    .single();
  if (error) throw error;
  return data as DealBorrowerMember;
}

export async function removeBorrowerMember(
  supabase: AdminClient,
  memberId: string
): Promise<void> {
  const { error } = await supabase
    .from("deal_borrower_members" as never)
    .delete()
    .eq("id", memberId);
  if (error) throw error;
}

// --- Borrower Profiles ---

export async function upsertBorrowerProfile(
  supabase: AdminClient,
  contactId: string,
  profile: Partial<BorrowerProfile>
): Promise<BorrowerProfile> {
  const { data, error } = await supabase
    .from("borrower_profiles" as never)
    .upsert(
      { contact_id: contactId, ...profile } as never,
      { onConflict: "contact_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as BorrowerProfile;
}

// --- Contact Search ---

export async function searchContacts(
  supabase: AdminClient,
  query: string,
  excludeContactIds: string[] = []
): Promise<{ id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null }[]> {
  const term = `%${query.trim()}%`;
  const excludeSet = new Set(excludeContactIds);
  const { data, error } = await supabase
    .from("crm_contacts" as never)
    .select("id, first_name, last_name, email, phone")
    .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
    .limit(15);

  if (error) throw error;
  const list = (data ?? []) as { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null }[];
  if (excludeSet.size === 0) return list.slice(0, 10);
  return list.filter((c) => !excludeSet.has(c.id)).slice(0, 10);
}
