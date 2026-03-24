import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://edhlkknvlczhbowasjna.supabase.co";

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const SUBSCRIBE_NOTE = "Filled out Subscribe for more insights on our page.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email } = body ?? {};
    if (!email || typeof email !== "string") {
      return Response.json({ error: "Email required" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (admin) {
      const normalizedEmail = email.trim().toLowerCase();
      const fName = typeof firstName === "string" ? firstName.trim() : "";
      const lName = typeof lastName === "string" ? lastName.trim() : "";
      const timestamp = new Date().toISOString().slice(0, 10);

      const { data: existing } = await admin
        .from("crm_contacts")
        .select("id, first_name, last_name, name, notes")
        .ilike("email", normalizedEmail)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (existing) {
        const updates: Record<string, unknown> = {};
        if (fName && fName !== existing.first_name) updates.first_name = fName;
        if (lName && lName !== existing.last_name) updates.last_name = lName;
        if (fName || lName) {
          updates.name = `${fName || existing.first_name} ${lName || existing.last_name}`.trim();
        }
        const newNote = `[${timestamp}] ${SUBSCRIBE_NOTE}`;
        updates.notes = existing.notes
          ? `${existing.notes}\n${newNote}`
          : newNote;
        if (Object.keys(updates).length > 0) {
          await admin.from("crm_contacts").update(updates).eq("id", existing.id);
        }
      } else {
        await admin.from("crm_contacts").insert({
          first_name: fName || "Subscriber",
          last_name: lName || "—",
          name: [fName, lName].filter(Boolean).join(" ").trim() || "Subscriber",
          email: normalizedEmail,
          contact_type: "lead",
          contact_types: [],
          source: "website",
          notes: SUBSCRIBE_NOTE,
        } as never);
      }
    } else {
      console.error("[subscribe] SUPABASE_SERVICE_ROLE_KEY not set. Subscriber not persisted.");
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[subscribe] Error:", err);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
