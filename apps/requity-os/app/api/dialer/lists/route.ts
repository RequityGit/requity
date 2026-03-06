import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_DIALER_SETTINGS } from "@/lib/dialer/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("dialer_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Dialer] lists GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { name, description, assigned_to, settings, contactIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create the list
    const { data: list, error: listError } = await admin
      .from("dialer_lists")
      .insert({
        name,
        description: description || null,
        created_by: user.id,
        assigned_to: assigned_to || user.id,
        status: "draft",
        settings: { ...DEFAULT_DIALER_SETTINGS, ...settings },
        total_contacts: 0,
      })
      .select()
      .single();

    if (listError) throw listError;

    // If contacts provided, add them to the list
    if (contactIds && contactIds.length > 0) {
      // Fetch contacts to get phone numbers and check DNC
      const { data: contacts } = await admin
        .from("crm_contacts")
        .select("id, phone, first_name, last_name, dnc")
        .in("id", contactIds)
        .is("deleted_at", null);

      if (contacts) {
        let position = 0;
        const listContacts = [];
        let dncCount = 0;

        for (const contact of contacts) {
          if (contact.dnc) {
            dncCount++;
            continue;
          }
          if (!contact.phone) continue;

          position++;
          listContacts.push({
            list_id: list.id,
            contact_id: contact.id,
            position,
            phone_numbers: [
              {
                number: contact.phone,
                type: "primary",
                isPrimary: true,
              },
            ],
            current_number_index: 0,
            status: "pending",
          });
        }

        if (listContacts.length > 0) {
          await admin.from("dialer_list_contacts").insert(listContacts);
        }

        // Update total count
        await admin
          .from("dialer_lists")
          .update({ total_contacts: listContacts.length })
          .eq("id", list.id);
      }
    }

    return NextResponse.json({ data: list });
  } catch (error) {
    console.error("[Dialer] lists POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
