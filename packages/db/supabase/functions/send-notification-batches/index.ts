// Supabase Edge Function: send-notification-batches
//
// CRON trigger for the settling period notification system.
// Calls the Remix app's /api/cron/send-notification-batches endpoint
// which processes expired notification batches and sends consolidated digest emails.
//
// Schedule: Every 5 minutes via pg_cron.
//
// To set up the CRON schedule in Supabase Dashboard:
//   select cron.schedule(
//     'send-notification-batches',
//     '*/5 * * * *',
//     $$
//     select net.http_post(
//       url := 'https://edhlkknvlczhbowasjna.supabase.co/functions/v1/send-notification-batches',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );

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
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call the Remix app's CRON endpoint
    const response = await fetch(
      `${appUrl}/api/cron/send-notification-batches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const result = await response.json();

    console.log(
      "[send-notification-batches] Result:",
      JSON.stringify(result)
    );

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-notification-batches] Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
