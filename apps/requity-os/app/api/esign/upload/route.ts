import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import docuseal from "@/lib/docuseal";

/**
 * POST /api/esign/upload
 * Uploads a generated PDF to DocuSeal as a template.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "Uploaded Document";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const template = await docuseal.createTemplateFromPdf({
      documents: [{ name, file: base64 }],
    });

    return NextResponse.json({
      templateId: template.id,
      name: template.name,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not upload document",
      },
      { status: 500 }
    );
  }
}
