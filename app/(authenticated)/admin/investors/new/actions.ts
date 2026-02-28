"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import {
  resilientProfileUpdate,
  resilientProfileUpsert,
} from "@/lib/supabase/resilient-profile-update";

interface AddInvestorInput {
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
}

export async function addInvestorAction(input: AddInvestorInput) {
  try {
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
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is required to add investors. Add it to your environment variables. You can find it in Supabase Dashboard → Settings → API → service_role key.",
      };
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if an investor profile with this email already exists
    let existingProfiles:
      | { id: string; email: string; role: string; full_name?: string }[]
      | null = null;

    const { data: profilesWithName, error: selectError } = await adminClient
      .from("profiles")
      .select("id, email, role, full_name")
      .eq("email", input.email);

    if (selectError && selectError.message.includes("full_name")) {
      // full_name column doesn't exist yet — query without it
      const { data: profilesBasic } = await adminClient
        .from("profiles")
        .select("id, email, role")
        .eq("email", input.email);
      existingProfiles = profilesBasic;
    } else {
      existingProfiles = profilesWithName;
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const existingInvestor = existingProfiles.find(
        (p: { id: string; role: string }) => p.role === "investor"
      );
      if (existingInvestor) {
        // An investor with this email already exists — update their profile
        const profileUpdate: Record<string, unknown> = {
          full_name: input.full_name,
          activation_status: "pending",
        };
        if (input.company_name) {
          profileUpdate.company_name = input.company_name;
        }
        if (input.phone) {
          profileUpdate.phone = input.phone;
        }

        const result = await resilientProfileUpdate(
          adminClient,
          existingInvestor.id,
          profileUpdate
        );
        if (result.error) return { error: result.error };

        return { success: true, investorId: existingInvestor.id };
      }
      // User exists with a different role — cannot create duplicate auth user
      return {
        error: `A user with email ${input.email} already exists with a different role.`,
      };
    }

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
        user_metadata: { role: "investor", full_name: input.full_name },
      });

    if (createError) {
      // If the auth user already exists but no profile was found (orphaned auth
      // user), look them up and try to fix the profile instead
      if (
        createError.message.includes("already been registered") ||
        createError.message.includes("already exists")
      ) {
        const { data: listData } =
          await adminClient.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find(
          (u: { id: string; email?: string }) => u.email === input.email
        );
        if (existingAuthUser) {
          const profileUpdate: Record<string, unknown> = {
            id: existingAuthUser.id,
            email: input.email,
            full_name: input.full_name,
            role: "investor",
            activation_status: "pending",
          };
          if (input.company_name) {
            profileUpdate.company_name = input.company_name;
          }
          if (input.phone) {
            profileUpdate.phone = input.phone;
          }

          const result = await resilientProfileUpsert(
            adminClient,
            profileUpdate
          );
          if (result.error) return { error: result.error };

          return { success: true, investorId: existingAuthUser.id };
        }
      }
      return { error: createError.message };
    }

    if (!newUser.user) {
      return { error: "Failed to create user" };
    }

    // Upsert the profile to ensure it exists with the correct role, even if
    // the handle_new_user trigger hasn't fired or set the wrong role.
    const profileData: Record<string, unknown> = {
      id: newUser.user.id,
      email: input.email,
      role: "investor",
      full_name: input.full_name,
      activation_status: "pending",
    };
    if (input.company_name) {
      profileData.company_name = input.company_name;
    }
    if (input.phone) {
      profileData.phone = input.phone;
    }

    const result = await resilientProfileUpsert(
      adminClient,
      profileData
    );
    if (result.error) {
      // Clean up: delete the auth user since we can't set up the profile
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return { error: result.error };
    }

    return { success: true, investorId: newUser.user.id };
  } catch (err: any) {
    console.error("addInvestorAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function sendActivationLinkAction(investorId: string) {
  try {
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
      .update({ activation_status: "link_sent" } as any)
      .eq("id", investorId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("sendActivationLinkAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}
