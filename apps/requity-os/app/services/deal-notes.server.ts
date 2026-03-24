import type { SupabaseClient } from "@supabase/supabase-js";

export type DealNoteRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string | null;
  is_pinned: boolean | null;
  deal_id: string | null;
};

/**
 * Pin a note. Unpins any existing pinned note on the same deal first.
 */
export async function pinNote(
  supabase: SupabaseClient,
  noteId: string,
  dealId: string
): Promise<DealNoteRow> {
  await supabase
    .from("notes")
    .update({ is_pinned: false, pinned_by: null, pinned_at: null })
    .eq("deal_id", dealId)
    .eq("is_pinned", true);

  const { data, error } = await supabase
    .from("notes")
    .update({
      is_pinned: true,
      pinned_by: null,
      pinned_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .select()
    .single();

  if (error) throw error;
  return data as DealNoteRow;
}

export async function unpinNote(
  supabase: SupabaseClient,
  noteId: string
): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({
      is_pinned: false,
      pinned_by: null,
      pinned_at: null,
    })
    .eq("id", noteId);

  if (error) throw error;
}

/**
 * Get the pinned note for a deal, or null if none pinned.
 */
export async function getPinnedNote(
  supabase: SupabaseClient,
  dealId: string
): Promise<DealNoteRow | null> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, body, created_at, author_id, author_name, is_pinned, deal_id")
    .eq("deal_id", dealId)
    .eq("is_pinned", true)
    .is("deleted_at", null)
    .is("condition_id", null)
    .is("unified_condition_id", null)
    .maybeSingle();

  if (error) throw error;
  return data as DealNoteRow | null;
}

/**
 * Get the most recent (top-level) note for a deal. Fallback when nothing is pinned.
 */
export async function getMostRecentNote(
  supabase: SupabaseClient,
  dealId: string
): Promise<DealNoteRow | null> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, body, created_at, author_id, author_name, is_pinned, deal_id")
    .eq("deal_id", dealId)
    .is("deleted_at", null)
    .is("condition_id", null)
    .is("unified_condition_id", null)
    .is("parent_note_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as DealNoteRow | null;
}
