import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type Client = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// resolveProfileNames — batch-load user IDs → display names
// ---------------------------------------------------------------------------

export async function resolveProfileNames(
  client: Client,
  ids: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return {};

  const { data } = await client
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  const map: Record<string, string> = {};
  (data ?? []).forEach((p) => {
    map[p.id] = p.full_name ?? "Unknown";
  });
  return map;
}

// ---------------------------------------------------------------------------
// resolveTeamProfiles — load admin team members for originator/processor/etc.
// Returns a lookup from profile id → full_name.
// ---------------------------------------------------------------------------

export async function resolveTeamProfiles(
  client: Client
): Promise<Record<string, string>> {
  const { data } = await client
    .from("profiles")
    .select("id, full_name")
    .eq("role", "admin")
    .order("full_name");

  const map: Record<string, string> = {};
  (data ?? []).forEach((t) => {
    map[t.id] = t.full_name ?? "Unknown";
  });
  return map;
}

// ---------------------------------------------------------------------------
// resolveCrmContactName — derive display name from a CRM contact object
// Priority: name → first_name + last_name → fallback
// ---------------------------------------------------------------------------

export function resolveCrmContactName(
  contact: {
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null,
  fallback = "Unknown"
): string {
  if (!contact) return fallback;
  if (contact.name) return contact.name;
  const full =
    `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
  return full || fallback;
}

// ---------------------------------------------------------------------------
// getInvestorDisplayName — resolve an investor row with CRM contact fallback
// Expects the row shape from a query like:
//   investors(user_id, crm_contacts(name, first_name, last_name))
// ---------------------------------------------------------------------------

export function getInvestorDisplayName(
  investorRelation: Record<string, unknown> | null,
  profileNames?: Map<string, string> | Record<string, string>
): string {
  if (!investorRelation) return "Unknown";

  const crm = investorRelation.crm_contacts as Record<
    string,
    unknown
  > | null;
  if (crm) {
    const name = resolveCrmContactName(
      crm as { name?: string | null; first_name?: string | null; last_name?: string | null }
    );
    if (name !== "Unknown") return name;
  }

  const userId = investorRelation.user_id as string | null;
  if (userId && profileNames) {
    if (profileNames instanceof Map) {
      return profileNames.get(userId) ?? "Unknown";
    }
    return profileNames[userId] ?? "Unknown";
  }

  return "Unknown";
}

// ---------------------------------------------------------------------------
// resolveBorrowerName — resolve borrower name with CRM contact priority
// ---------------------------------------------------------------------------

export async function resolveBorrowerName(
  client: Client,
  borrowerId: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: borrower } = await (client as any)
    .from("borrowers")
    .select("crm_contact_id, first_name, last_name")
    .eq("id", borrowerId)
    .maybeSingle();

  if (!borrower) return "Unknown";

  // Try CRM contact first
  if (borrower.crm_contact_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contact } = await (client as any)
      .from("crm_contacts")
      .select("first_name, last_name")
      .eq("id", borrower.crm_contact_id)
      .maybeSingle();

    if (contact) {
      const name =
        `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
      if (name) return name;
    }
  }

  // Fall back to borrower's own name
  const name =
    `${borrower.first_name ?? ""} ${borrower.last_name ?? ""}`.trim();
  return name || "Unknown";
}

// ---------------------------------------------------------------------------
// buildBorrowerNameMap — bulk build borrower id → name map with CRM fallback
// ---------------------------------------------------------------------------

export async function buildBorrowerNameMap(
  client: Client
): Promise<Map<string, string>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: borrowers } = await (client as any)
    .from("borrowers")
    .select("id, crm_contact_id, first_name, last_name, crm_contacts(name, first_name, last_name)")
    .order("last_name");

  const map = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (borrowers ?? []) as any[]) {
    const crmName = resolveCrmContactName(b.crm_contacts);
    if (crmName !== "Unknown") {
      map.set(b.id, crmName);
    } else {
      const name =
        `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || "Unknown";
      map.set(b.id, name);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// buildInvestorNameMap — bulk build investor id → name map with CRM fallback
// ---------------------------------------------------------------------------

export async function buildInvestorNameMap(
  client: Client,
  profileNamesFallback?: boolean
): Promise<Map<string, string>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: investors } = await (client as any)
    .from("investors")
    .select("id, user_id, crm_contact_id, crm_contacts(name, first_name, last_name)")
    .order("id");

  const map = new Map<string, string>();
  const userIdsNeedingLookup = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const inv of (investors ?? []) as any[]) {
    const crmName = resolveCrmContactName(inv.crm_contacts);
    if (crmName !== "Unknown") {
      map.set(inv.id, crmName);
    } else if (inv.user_id) {
      userIdsNeedingLookup.add(inv.user_id);
    }
  }

  // Batch-resolve profile names for investors without CRM contacts
  if (profileNamesFallback && userIdsNeedingLookup.size > 0) {
    const profileNames = await resolveProfileNames(
      client,
      Array.from(userIdsNeedingLookup)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const inv of (investors ?? []) as any[]) {
      if (!map.has(inv.id) && inv.user_id && profileNames[inv.user_id]) {
        map.set(inv.id, profileNames[inv.user_id]);
      }
    }
  }

  // Fill remaining with "Unknown"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const inv of (investors ?? []) as any[]) {
    if (!map.has(inv.id)) {
      map.set(inv.id, "Unknown");
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// getInitials — derive initials from a full name string
// ---------------------------------------------------------------------------

export function getInitials(fullName: string | null): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
