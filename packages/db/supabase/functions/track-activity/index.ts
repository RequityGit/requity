// Supabase Edge Function: track-activity
// Receives batched user activity events from the portal and inserts them
// into portal_activity_log. Uses the service-role client for the insert
// (user identity is verified beforehand via getUser()) so RLS timing
// issues do not cause spurious 400s.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_BATCH_SIZE = 100;

interface ActivityRow {
  user_id: string;
  action_type: string;
  page_path: string;
  component?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
  role?: string;
  department?: string;
  duration_ms?: number;
}

/**
 * Validate and normalise a single event from the request body.
 * Returns null if the event is invalid and should be skipped.
 */
function validateEvent(
  event: unknown,
  userId: string
): ActivityRow | null {
  if (!event || typeof event !== "object") return null;

  const e = event as Record<string, unknown>;

  // action_type is NOT NULL with no default — must be present
  if (!e.action_type || typeof e.action_type !== "string") {
    return null;
  }

  // Coerce duration_ms to number if it arrived as a string
  let durationMs: number | undefined;
  if (e.duration_ms !== null && e.duration_ms !== undefined) {
    const parsed =
      typeof e.duration_ms === "number"
        ? e.duration_ms
        : Number(e.duration_ms);
    durationMs = Number.isFinite(parsed) ? Math.round(parsed) : undefined;
  }

  return {
    user_id: userId,
    action_type: e.action_type as string,
    page_path:
      typeof e.page_path === "string" ? e.page_path : "unknown",
    component:
      typeof e.component === "string" ? e.component : undefined,
    metadata:
      e.metadata && typeof e.metadata === "object"
        ? (e.metadata as Record<string, unknown>)
        : undefined,
    session_id:
      typeof e.session_id === "string" ? e.session_id : undefined,
    role: typeof e.role === "string" ? e.role : undefined,
    department:
      typeof e.department === "string" ? e.department : undefined,
    duration_ms: durationMs,
  };
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // --- Auth: verify the caller's identity ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    )!;

    // Verify user JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // --- Parse and validate events ---
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Accept a single event or an array
    const rawEvents: unknown[] = Array.isArray(rawBody)
      ? rawBody
      : [rawBody];

    if (rawEvents.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({
          error: `Batch too large (max ${MAX_BATCH_SIZE})`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validRows: ActivityRow[] = [];
    let skipped = 0;

    for (const raw of rawEvents) {
      const row = validateEvent(raw, user.id);
      if (row) {
        validRows.push(row);
      } else {
        skipped++;
        console.warn("track-activity: skipping invalid event", {
          event: raw,
          userId: user.id,
        });
      }
    }

    if (validRows.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          inserted: 0,
          skipped,
          failed: 0,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // --- Insert using service role (bypasses RLS; user already verified) ---
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: batchError } = await adminClient
      .from("portal_activity_log")
      .insert(validRows);

    if (!batchError) {
      return new Response(
        JSON.stringify({
          success: true,
          inserted: validRows.length,
          skipped,
          failed: 0,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // --- Batch failed: fall back to individual inserts ---
    console.error("track-activity batch insert failed:", {
      error: batchError.message,
      code: batchError.code,
      details: batchError.details,
      hint: batchError.hint,
      eventCount: validRows.length,
      sampleEvent: {
        action_type: validRows[0].action_type,
        page_path: validRows[0].page_path,
        has_user_id: !!validRows[0].user_id,
      },
    });

    let inserted = 0;
    let failed = 0;

    for (const row of validRows) {
      const { error: singleError } = await adminClient
        .from("portal_activity_log")
        .insert(row);

      if (singleError) {
        failed++;
        console.error("track-activity single insert failed:", {
          action_type: row.action_type,
          page_path: row.page_path,
          error: singleError.message,
          code: singleError.code,
        });
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        success: inserted > 0,
        inserted,
        skipped,
        failed,
        partial: true,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: unknown) {
    console.error("track-activity error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
