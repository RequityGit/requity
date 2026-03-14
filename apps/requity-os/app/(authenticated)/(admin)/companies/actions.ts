"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

export interface AddCompanyInput {
  name: string;
  company_type: string;
  company_types?: string[];
  company_subtype?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  primary_contact_id?: string | null;
  notes?: string | null;
  source?: string | null;
  asset_types?: string[];
  company_capabilities?: string[];
  lender_programs?: string[];
  geographies?: string[];
  initial_note?: string | null;
}

export async function addCompanyAction(input: AddCompanyInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("companies")
      .insert({
        name: input.name.trim(),
        company_type: input.company_type as never,
        company_types: input.company_types?.length ? input.company_types : [input.company_type],
        company_subtype: (input.company_subtype as never) || null,
        phone: input.phone || null,
        email: input.email || null,
        website: input.website || null,
        address_line1: input.address_line1 || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        primary_contact_id: input.primary_contact_id || null,
        notes: input.notes || null,
        source: input.source || null,
        asset_types: input.asset_types?.length ? input.asset_types : null,
        company_capabilities: input.company_capabilities?.length
          ? input.company_capabilities
          : null,
        lender_programs: input.lender_programs?.length
          ? input.lender_programs
          : null,
        geographies: input.geographies?.length ? input.geographies : null,
      })
      .select("id, company_number")
      .single();

    if (error) {
      console.error("addCompanyAction error:", error);
      return { error: error.message };
    }

    if (input.initial_note?.trim()) {
      const { error: noteError } = await admin.from("notes").insert({
        company_id: data.id,
        body: input.initial_note.trim(),
        author_id: auth.user.id,
      });
      if (noteError) {
        console.error("addCompanyAction note insert error:", noteError);
      }
    }

    return { success: true, id: data.id, company_number: data.company_number };
  } catch (err: unknown) {
    console.error("addCompanyAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export interface UpdateCompanyInput {
  id: string;
  name?: string;
  company_type?: string;
  company_types?: string[];
  company_subtype?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  primary_contact_id?: string | null;
  notes?: string | null;
  source?: string | null;
  other_names?: string | null;
  title_company_verified?: boolean;
  is_active?: boolean;
  asset_types?: string[];
  company_capabilities?: string[];
  lender_programs?: string[];
  geographies?: string[];
}

export async function updateCompanyAction(input: UpdateCompanyInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.company_type !== undefined)
      updateData.company_type = input.company_type;
    if (input.company_types !== undefined)
      updateData.company_types = input.company_types;
    if (input.company_subtype !== undefined)
      updateData.company_subtype = input.company_subtype || null;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.website !== undefined) updateData.website = input.website || null;
    if (input.address_line1 !== undefined)
      updateData.address_line1 = input.address_line1 || null;
    if (input.address_line2 !== undefined)
      updateData.address_line2 = input.address_line2 || null;
    if (input.city !== undefined) updateData.city = input.city || null;
    if (input.state !== undefined) updateData.state = input.state || null;
    if (input.zip !== undefined) updateData.zip = input.zip || null;
    if (input.country !== undefined) updateData.country = input.country || null;
    if (input.primary_contact_id !== undefined)
      updateData.primary_contact_id = input.primary_contact_id || null;
    if (input.notes !== undefined) updateData.notes = input.notes || null;
    if (input.source !== undefined) updateData.source = input.source || null;
    if (input.other_names !== undefined)
      updateData.other_names = input.other_names || null;
    if (input.title_company_verified !== undefined)
      updateData.title_company_verified = input.title_company_verified;
    if (input.is_active !== undefined)
      updateData.is_active = input.is_active;
    if (input.asset_types !== undefined)
      updateData.asset_types = input.asset_types;
    if (input.company_capabilities !== undefined)
      updateData.company_capabilities = input.company_capabilities;
    if (input.lender_programs !== undefined)
      updateData.lender_programs = input.lender_programs;
    if (input.geographies !== undefined)
      updateData.geographies = input.geographies;

    const { error } = await admin
      .from("companies")
      .update(updateData as never)
      .eq("id", input.id);

    if (error) {
      console.error("updateCompanyAction error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updateCompanyAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function deleteCompanyAction(companyId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("companies")
      .update({ is_active: false })
      .eq("id", companyId);

    if (error) {
      console.error("deleteCompanyAction error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCompanyAction error:", err);
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function addCompanyFollowerAction(companyId: string, userId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("crm_followers")
      .insert({ company_id: companyId, user_id: userId })
      .select("id")
      .single();

    if (error) {
      console.error("addCompanyFollowerAction error:", error);
      return { error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err: unknown) {
    console.error("addCompanyFollowerAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function removeCompanyFollowerAction(followerId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("crm_followers")
      .delete()
      .eq("id", followerId);

    if (error) {
      console.error("removeCompanyFollowerAction error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("removeCompanyFollowerAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function deleteCompanyFileAction(fileId: string, storagePath: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error: storageError } = await admin.storage
      .from("company-files")
      .remove([storagePath]);

    if (storageError) {
      console.error("deleteCompanyFileAction storage error:", storageError);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("company_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      console.error("deleteCompanyFileAction error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCompanyFileAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
