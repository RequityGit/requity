// Supabase Edge Function: invite-user
// Invites a new user via Supabase Auth admin API, creates their profile,
// and grants them a role using the existing grant_role() DB function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  email: string;
  name: string;
  role: "admin" | "investor" | "borrower";
  investor_id?: string;
  borrower_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract and validate JWT from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create a client with the user's JWT to verify they are admin/super_admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callingUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role via user_roles table (not profiles.role)
    const { data: callerRoles } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id);

    const isAdmin = callerRoles?.some(
      (r) => r.role === "admin" || r.role === "super_admin"
    );

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: InvitePayload = await req.json();

    if (!body.email || !body.name || !body.role) {
      return new Response(
        JSON.stringify({ error: "email, name, and role are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["admin", "investor", "borrower"].includes(body.role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user already exists
    const { data: existingProfiles } = await adminClient
      .from("profiles")
      .select("id, email")
      .eq("email", body.email);

    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(
        JSON.stringify({
          error: `A user with email ${body.email} already exists`,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Invite the user via Supabase Auth admin API
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(body.email, {
        data: {
          full_name: body.name,
          role: body.role,
        },
      });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!inviteData.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUserId = inviteData.user.id;

    // Create/update the profile row
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: newUserId,
        email: body.email,
        full_name: body.name,
        role: body.role,
        allowed_roles: [body.role],
        activation_status: "link_sent",
      });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
    }

    // Grant role via the existing grant_role() DB function
    const { error: grantError } = await adminClient.rpc("grant_role", {
      _user_id: newUserId,
      _role: body.role,
      _investor_id: body.investor_id || null,
      _borrower_id: body.borrower_id || null,
    });

    if (grantError) {
      console.error("grant_role error:", grantError);
      // Non-fatal — profile was still created
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        message: `Invitation sent to ${body.email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("invite-user error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
