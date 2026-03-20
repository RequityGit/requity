// Supabase Edge Function: stale-condition-reminders
//
// CRON trigger for stale condition reminder emails.
// Calls the Remix app's /api/cron/stale-condition-reminders endpoint
// which handles the actual logic and email sending.
//
// Schedule: Run twice daily (9am and 3pm ET) via pg_cron or Supabase CRON.
//
// To set up the CRON schedule in Supabase Dashboard:
//   select cron.schedule(
//     'stale-condition-reminders',
//     '0 14,20 * * *',  -- 9am and 3pm ET (UTC-5)
//     $$
//     select net.http_post(
//       url := 'https://edhlkknvlczhbowasjna.supabase.co/functions/v1/stale-condition-reminders',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl =
      Deno.env.get("APP_URL") || "https://portal.requitygroup.com";

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the Remix app's CRON endpoint
    const response = await fetch(
      `${appUrl}/api/cron/stale-condition-reminders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const result = await response.json();

    console.log("[stale-condition-reminders] Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stale-condition-reminders] Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
