import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SCOPES = new Set([
  "activities",
  "files",
  "tasks",
  "notes",
  "overview",
]);

async function assertCrmAccess(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null as null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: superAdmin } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();

  if (superAdmin) return { user, error: null as null };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const r = roleRow?.role;
  if (r !== "admin" && r !== "super_admin") {
    return { user: null as null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null as null };
}

/**
 * GET /api/crm/companies/[companyId]/tab-data?scope=activities|files|tasks|notes|overview
 * companyId is companies.id (uuid)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const supabase = await createClient();
  const { user, error } = await assertCrmAccess(supabase);
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { companyId } = await params;
  const scope = request.nextUrl.searchParams.get("scope") ?? "activities";
  if (!SCOPES.has(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: company } = await admin.from("companies").select("id").eq("id", companyId).single();
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profilesResult } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .order("full_name");

  const profileLookup: Record<string, string> = {};
  (profilesResult ?? []).forEach((t) => {
    profileLookup[t.id] = t.full_name || t.email || "Unknown";
  });

  try {
    if (scope === "activities") {
      const { data: rows } = await admin
        .from("crm_activities")
        .select(
          "id, activity_type, subject, description, direction, call_duration_seconds, performed_by, performed_by_name, created_at"
        )
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const activities = (rows ?? []).map((a) => ({
        id: a.id as string,
        activity_type: a.activity_type as string,
        subject: a.subject as string | null,
        description: a.description as string | null,
        direction: (a.direction as string | null) ?? null,
        call_duration_seconds: (a.call_duration_seconds as number | null) ?? null,
        performed_by_name: a.performed_by
          ? (a.performed_by_name as string | null) || profileLookup[a.performed_by as string] || null
          : null,
        created_at: a.created_at as string,
      }));

      return NextResponse.json({ activities });
    }

    if (scope === "files") {
      const { data: rows } = await admin
        .from("company_files")
        .select(
          "id, file_name, file_type, file_size, mime_type, storage_path, uploaded_by, uploaded_at, notes"
        )
        .eq("company_id", companyId)
        .order("uploaded_at", { ascending: false });

      const files = (rows ?? []).map((f) => ({
        id: f.id as string,
        file_name: f.file_name as string,
        file_type: f.file_type as string,
        file_size: f.file_size as number | null,
        mime_type: f.mime_type as string | null,
        storage_path: f.storage_path as string,
        uploaded_by_name: f.uploaded_by
          ? profileLookup[f.uploaded_by as string] || null
          : null,
        uploaded_at: f.uploaded_at as string | null,
        notes: f.notes as string | null,
      }));

      return NextResponse.json({ files });
    }

    if (scope === "tasks") {
      const { data: rows } = await admin
        .from("ops_tasks")
        .select(
          "id, title, description, category, priority, status, due_date, assigned_to, completed_at, created_at"
        )
        .eq("linked_entity_type", "company")
        .eq("linked_entity_id", companyId)
        .order("created_at", { ascending: false });

      const tasks = (rows ?? []).map((t) => ({
        id: t.id as string,
        subject: (t.title as string) || "",
        description: t.description as string | null,
        task_type: (t.category as string) || "other",
        priority: (t.priority as string) || "Medium",
        status: t.status === "Complete" ? "completed" : t.status === "In Progress" ? "in_progress" : "not_started",
        due_date: t.due_date as string | null,
        assigned_to: t.assigned_to as string | null,
        assigned_to_name: t.assigned_to
          ? profileLookup[t.assigned_to as string] || null
          : null,
        completed_at: t.completed_at as string | null,
      }));

      return NextResponse.json({ tasks });
    }

    if (scope === "notes") {
      const { data: rows } = await admin
        .from("notes" as never)
        .select("id, body, author_id, is_pinned, created_at" as never)
        .eq("company_id" as never, companyId as never)
        .is("deleted_at" as never, null)
        .order("is_pinned" as never, { ascending: false })
        .order("created_at" as never, { ascending: false });

      const notes = (rows ?? []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        body: (n.body as string) || "",
        author_name: n.author_id
          ? profileLookup[n.author_id as string] || null
          : null,
        author_id: n.author_id as string | null,
        is_pinned: (n.is_pinned as boolean) || false,
        created_at: n.created_at as string,
      }));

      return NextResponse.json({ notes });
    }

    if (scope === "overview") {
      const [wireResult, filesResult] = await Promise.all([
        admin
          .from("company_wire_instructions")
          .select(
            "id, bank_name, account_name, account_number, routing_number, wire_type, updated_at, updated_by"
          )
          .eq("company_id", companyId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("company_files")
          .select(
            "id, file_name, file_type, file_size, mime_type, storage_path, uploaded_by, uploaded_at, notes"
          )
          .eq("company_id", companyId)
          .order("uploaded_at", { ascending: false }),
      ]);

      const wireInstructions = wireResult.data
        ? {
            id: wireResult.data.id,
            bank_name: wireResult.data.bank_name,
            account_name: wireResult.data.account_name,
            account_number: wireResult.data.account_number,
            routing_number: wireResult.data.routing_number,
            wire_type: wireResult.data.wire_type,
            updated_at: wireResult.data.updated_at,
            updated_by: wireResult.data.updated_by,
          }
        : null;

      const files = (filesResult.data ?? []).map((f) => ({
        id: f.id as string,
        file_name: f.file_name as string,
        file_type: f.file_type as string,
        file_size: f.file_size as number | null,
        mime_type: f.mime_type as string | null,
        storage_path: f.storage_path as string,
        uploaded_by_name: f.uploaded_by
          ? profileLookup[f.uploaded_by as string] || null
          : null,
        uploaded_at: f.uploaded_at as string | null,
        notes: f.notes as string | null,
      }));

      return NextResponse.json({ wireInstructions, files });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (e) {
    console.error("company tab-data:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
