import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID || "";
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET || "";
const FUNCTIONS_BASE = process.env.TWILIO_FUNCTIONS_BASE || "https://requity-ivr-6327.twil.io";

// Caller ID pool: comma-separated phone numbers in env, fallback to TWILIO_CALLER_ID
const CALLER_ID_POOL = (process.env.TWILIO_DIALER_CALLER_IDS || process.env.TWILIO_CALLER_ID || "")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

let poolIndex = 0;

function getNextCallerId(): string {
  const id = CALLER_ID_POOL[poolIndex % CALLER_ID_POOL.length];
  poolIndex++;
  return id;
}

async function twilioCreateCall(params: {
  to: string;
  from: string;
  url: string;
  statusCallback: string;
  asyncAmdStatusCallback?: string;
  machineDetection?: string;
  asyncAmd?: boolean;
  record?: boolean;
  timeout?: number;
}) {
  const body = new URLSearchParams();
  body.append("To", params.to);
  body.append("From", params.from);
  body.append("Url", params.url);
  body.append("StatusCallback", params.statusCallback);
  body.append("StatusCallbackMethod", "POST");
  body.append("StatusCallbackEvent", "initiated");
  body.append("StatusCallbackEvent", "ringing");
  body.append("StatusCallbackEvent", "answered");
  body.append("StatusCallbackEvent", "completed");
  if (params.machineDetection) {
    body.append("MachineDetection", params.machineDetection);
  }
  if (params.asyncAmd) {
    body.append("AsyncAmd", "true");
    if (params.asyncAmdStatusCallback) {
      body.append("AsyncAmdStatusCallback", params.asyncAmdStatusCallback);
      body.append("AsyncAmdStatusCallbackMethod", "POST");
    }
  }
  if (params.record) {
    body.append("Record", "true");
  }
  if (params.timeout) {
    body.append("Timeout", String(params.timeout));
  }

  const auth = Buffer.from(`${TWILIO_API_KEY_SID}:${TWILIO_API_KEY_SECRET}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio call creation failed: ${res.status} ${errText}`);
  }

  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contacts, listId, groupId } = await request.json();

    if (!contacts || !listId || !groupId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Create the call group record
    const callsData = contacts.map((c: { contactId: string; listContactId: string; phone: string }) => ({
      contactId: c.contactId,
      listContactId: c.listContactId,
      phone: c.phone,
      callSid: null,
      status: "initiating",
      amdResult: null,
    }));

    await admin.from("dialer_call_groups").insert({
      id: groupId,
      list_id: listId,
      calls: callsData,
      connected_contact_id: null,
      resolved: false,
    });

    // Fire all calls simultaneously
    const callResults = await Promise.allSettled(
      contacts.map(async (contact: { contactId: string; listContactId: string; phone: string }) => {
        const callerId = getNextCallerId();
        const call = await twilioCreateCall({
          to: contact.phone,
          from: callerId,
          url: `${FUNCTIONS_BASE}/dialer-connect?groupId=${groupId}&contactId=${contact.contactId}`,
          machineDetection: "DetectMessageEnd",
          asyncAmd: true,
          asyncAmdStatusCallback: `${FUNCTIONS_BASE}/amd-callback?groupId=${groupId}&contactId=${contact.contactId}`,
          statusCallback: `${FUNCTIONS_BASE}/dialer-status?groupId=${groupId}&contactId=${contact.contactId}&listContactId=${contact.listContactId}`,
          record: true,
          timeout: 25,
        });
        return { contactId: contact.contactId, callSid: call.sid };
      })
    );

    // Update call group with SIDs
    const updatedCalls = [...callsData];
    for (const result of callResults) {
      if (result.status === "fulfilled") {
        const { contactId, callSid } = result.value;
        const idx = updatedCalls.findIndex((c: { contactId: string }) => c.contactId === contactId);
        if (idx !== -1) {
          updatedCalls[idx].callSid = callSid;
          updatedCalls[idx].status = "ringing";
        }
      }
    }

    await admin.from("dialer_call_groups").update({ calls: updatedCalls }).eq("id", groupId);

    // Create dialer_calls records for each initiated call
    for (const result of callResults) {
      if (result.status === "fulfilled") {
        const { contactId, callSid } = result.value;
        const contact = contacts.find((c: { contactId: string }) => c.contactId === contactId);
        if (contact) {
          await admin.from("dialer_calls").insert({
            contact_id: contactId,
            twilio_call_sid: callSid,
            direction: "outbound",
            status: "initiated",
            performed_by: user.id,
          });
        }
      }
    }

    // Update last_attempted_at for each contact
    for (const contact of contacts) {
      await admin
        .from("dialer_list_contacts")
        .update({
          last_attempted_at: new Date().toISOString(),
          attempts: undefined, // incremented by status callback
        })
        .eq("id", contact.listContactId);
    }

    return NextResponse.json({
      success: true,
      groupId,
      calls: callResults.map((r) =>
        r.status === "fulfilled"
          ? { ...r.value, status: "initiated" }
          : { status: "failed", reason: String(r.reason) }
      ),
    });
  } catch (error) {
    console.error("[Dialer] call-group error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
