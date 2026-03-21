// Supabase Edge Function: task-due-reminders
//
// CRON trigger for daily task due/overdue notification creation.
// Calls the Next.js app's /api/cron/task-due-reminders endpoint
// which creates notifications for tasks due tomorrow and overdue tasks.
//
// Schedule: Once daily at 12:00 UTC (8:00 AM ET) via pg_cron.

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
      Deno.env.get("APP_URL") || "https://app.requitygroup.com";

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(
      `${appUrl}/api/cron/task-due-reminders`,
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
      "[task-due-reminders] Result:",
      JSON.stringify(result)
    );

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[task-due-reminders] Error:", err);
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
