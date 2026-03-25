"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Shared types ───

export interface ContactSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
}

export interface CompanySearchResult {
  id: string;
  name: string;
  company_type: string | null;
}

// ─── Contact search ───

/**
 * Universal contact search. Replaces searchContactsForDeal,
 * searchContactsForBorrower, searchContactsForDealLink, etc.
 */
export async function searchContacts(
  query: string,
  options?: { excludeIds?: string[]; limit?: number }
): Promise<{ contacts: ContactSearchResult[]; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", contacts: [] };

    if (!query || query.trim().length < 2) return { contacts: [] };

    const admin = createAdminClient();
    const term = `%${query.trim()}%`;
    const limit = options?.limit ?? 10;

    const { data, error } = await admin
      .from("crm_contacts")
      .select("id, first_name, last_name, email, phone, company_name")
      .or(
        `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},name.ilike.${term}`
      )
      .order("last_name" as never, { ascending: true })
      .limit(limit + (options?.excludeIds?.length ?? 0));

    if (error) return { error: error.message, contacts: [] };

    let results = (data ?? []) as ContactSearchResult[];

    if (options?.excludeIds?.length) {
      const excludeSet = new Set(options.excludeIds);
      results = results.filter((c) => !excludeSet.has(c.id));
    }

    return { contacts: results.slice(0, limit) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Search failed",
      contacts: [],
    };
  }
}

// ─── Company search ───

/**
 * Universal company search.
 */
export async function searchCompanies(
  query: string,
  options?: { excludeIds?: string[]; limit?: number }
): Promise<{ companies: CompanySearchResult[]; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", companies: [] };

    const admin = createAdminClient();
    const limit = options?.limit ?? 10;

    let q = admin
      .from("companies")
      .select("id, name, company_type")
      .eq("is_active", true)
      .order("name")
      .limit(limit + (options?.excludeIds?.length ?? 0));

    if (query && query.trim().length >= 1) {
      q = q.ilike("name", `%${query.trim()}%`);
    }

    const { data, error } = await q;
    if (error) return { error: error.message, companies: [] };

    let results = (data ?? []) as CompanySearchResult[];

    if (options?.excludeIds?.length) {
      const excludeSet = new Set(options.excludeIds);
      results = results.filter((c) => !excludeSet.has(c.id));
    }

    return { companies: results.slice(0, limit) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Search failed",
      companies: [],
    };
  }
}

// ─── Quick-create contact ───

/**
 * Create a new CRM contact with minimal fields. Returns the new contact.
 */
export async function quickCreateContact(data: {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
}): Promise<{ contact: ContactSearchResult | null; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", contact: null };

    if (!data.first_name.trim()) return { error: "First name is required", contact: null };

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("crm_contacts")
      .insert({
        first_name: data.first_name.trim(),
        last_name: data.last_name?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        contact_type: "lead" as never,
      } as never)
      .select("id, first_name, last_name, email, phone, company_name")
      .single();

    if (error) return { error: error.message, contact: null };
    return { contact: row as unknown as ContactSearchResult };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create contact",
      contact: null,
    };
  }
}

// ─── Quick-create company ───

/**
 * Create a new company with minimal fields. Returns the new company.
 */
export async function quickCreateCompany(data: {
  name: string;
  company_type: string;
}): Promise<{ company: CompanySearchResult | null; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", company: null };

    if (!data.name.trim()) return { error: "Company name is required", company: null };
    if (!data.company_type) return { error: "Company type is required", company: null };

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("companies")
      .insert({
        company_number: "" as never, // trigger generates COM-xxxx
        name: data.name.trim(),
        company_type: data.company_type as never,
        company_types: [data.company_type] as never,
      } as never)
      .select("id, name, company_type")
      .single();

    if (error) return { error: error.message, company: null };
    return { company: row as unknown as CompanySearchResult };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create company",
      company: null,
    };
  }
}
