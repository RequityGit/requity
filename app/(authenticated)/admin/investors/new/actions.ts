"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

interface AddInvestorInput {
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
}

export async function addInvestorAction(input: AddInvestorInput) {
  // Verify the current user is an admin
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: "Missing Supabase configuration" };
  }

  // If service role key is available, use admin API (preferred)
  if (supabaseServiceRoleKey) {
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
        user_metadata: { role: "investor", full_name: input.full_name },
      });

    if (createError) {
      return { error: createError.message };
    }

    if (!newUser.user) {
      return { error: "Failed to create user" };
    }

    // Update the auto-created profile with additional details
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        full_name: input.full_name,
        company_name: input.company_name || null,
        phone: input.phone || null,
      })
      .eq("id", newUser.user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    // Send password reset so investor can set their own password
    await adminClient.auth.resetPasswordForEmail(input.email);

    return { success: true, investorId: newUser.user.id };
  }

  // Fallback: use signUp with anon key (no service role key needed)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tempPassword = crypto.randomBytes(24).toString("base64url");

  const { data: signUpData, error: signUpError } =
    await anonClient.auth.signUp({
      email: input.email,
      password: tempPassword,
      options: {
        data: { role: "investor", full_name: input.full_name },
      },
    });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!signUpData.user) {
    return { error: "Failed to create investor account" };
  }

  const newUserId = signUpData.user.id;

  // Update the auto-created profile with additional details (admin RLS allows this)
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      company_name: input.company_name || null,
      phone: input.phone || null,
    })
    .eq("id", newUserId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Send password reset email so investor can set their own password
  await anonClient.auth.resetPasswordForEmail(input.email);

  return { success: true, investorId: newUserId };
}
