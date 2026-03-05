import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const CALLER_ID = "+18135345997";
const TWILIO_FUNCTIONS_BASE = "https://requity-ivr-6327.twil.io";

/**
 * POST /api/dialer/call
 *
 * Initiates an outbound call via Twilio REST API with AMD enabled.
 * This is used by the power dialer instead of client-side device.connect()
 * when AMD (Answering Machine Detection) is needed.
 *
 * Body: { contactId, phone, listId, listContactId, amdEnabled }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check admin role
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { contactId, phone, listId, listContactId, amdEnabled } = body;

    if (!phone || !contactId) {
      return NextResponse.json(
        { error: "Missing required fields: phone, contactId" },
        { status: 400 }
      );
    }

    // Normalize phone
    const normalizedPhone = phone.startsWith("+")
      ? phone
      : `+1${phone.replace(/\D/g, "")}`;

    // If Twilio credentials are not configured, fall back to client-side dialing
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return NextResponse.json({
        fallback: true,
        message: "Twilio REST API not configured. Use client-side dialing.",
        phone: normalizedPhone,
      });
    }

    // Build Twilio REST API call
    const params = new URLSearchParams({
      To: normalizedPhone,
      From: CALLER_ID,
      Url: `${TWILIO_FUNCTIONS_BASE}/dialer-connect`,
      StatusCallback: `${TWILIO_FUNCTIONS_BASE}/dialer-status`,
      StatusCallbackMethod: "POST",
      StatusCallbackEvent: "initiated ringing answered completed",
      Record: "true",
    });

    if (amdEnabled) {
      params.append("MachineDetection", "DetectMessageEnd");
      params.append("AsyncAmd", "true");
      params.append(
        "AsyncAmdStatusCallback",
        `${TWILIO_FUNCTIONS_BASE}/amd-callback`
      );
      params.append("AsyncAmdStatusCallbackMethod", "POST");
    }

    // Add metadata for callbacks
    params.append(
      "StatusCallbackEvent",
      "initiated ringing answered completed"
    );

    const authHeader = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error("[Dialer API] Twilio call creation failed:", errorText);
      return NextResponse.json(
        { error: "Failed to initiate call", details: errorText },
        { status: 500 }
      );
    }

    const callData = await twilioResponse.json();

    return NextResponse.json({
      success: true,
      callSid: callData.sid,
      status: callData.status,
    });
  } catch (err) {
    console.error("[Dialer API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
