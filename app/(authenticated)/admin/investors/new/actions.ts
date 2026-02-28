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

  // If service role key is available, use admin API (preferred — no emails sent)
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

    // Update the auto-created profile with additional details + pending status
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        full_name: input.full_name,
        company_name: input.company_name || null,
        phone: input.phone || null,
        activation_status: "pending",
      })
      .eq("id", newUser.user.id);

    if (updateError) {
      return { error: updateError.message };
    }

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
    if (signUpError.message.includes("security purposes")) {
      return {
        error:
          "Supabase rate limit reached. Please wait a minute and try again, or configure SUPABASE_SERVICE_ROLE_KEY to avoid this limit.",
      };
    }
    return { error: signUpError.message };
  }

  if (!signUpData.user) {
    return { error: "Failed to create investor account" };
  }

  const newUserId = signUpData.user.id;

  // Update the auto-created profile with additional details + pending status
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      company_name: input.company_name || null,
      phone: input.phone || null,
      activation_status: "pending",
    })
    .eq("id", newUserId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, investorId: newUserId };
}

export async function sendActivationLinkAction(investorId: string) {
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

  // Get the investor's email
  const { data: investor } = await supabase
    .from("profiles")
    .select("email, activation_status")
    .eq("id", investorId)
    .eq("role", "investor")
    .single();

  if (!investor) {
    return { error: "Investor not found" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    return { error: "Missing Supabase configuration" };
  }

  // Send a magic link (OTP) so the investor can sign in and activate
  if (supabaseServiceRoleKey) {
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: investor.email,
      });

    if (linkError) {
      return { error: linkError.message };
    }
  } else if (supabaseAnonKey) {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: otpError } = await anonClient.auth.signInWithOtp({
      email: investor.email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      return { error: otpError.message };
    }
  } else {
    return { error: "Missing Supabase configuration" };
  }

  // Mark as link_sent
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ activation_status: "link_sent" })
    .eq("id", investorId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
