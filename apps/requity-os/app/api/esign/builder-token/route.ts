import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/esign/builder-token
 * Generates a JWT token for the DocusealBuilder embedded component.
 * The builder token is signed with the DocuSeal API key and includes
 * the user's email, template name, and document URLs to load.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can configure signing fields
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
  const { templateName, documentUrls, templateId } = body as {
    templateName: string;
    documentUrls?: string[];
    templateId?: number;
  };

  if (!templateName) {
    return NextResponse.json(
      { error: "templateName is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.DOCUSEAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Build JWT payload for DocuSeal Builder
  // See: https://www.docuseal.com/docs/embedded/builder
  const payload: Record<string, unknown> = {
    user_email: user.email,
    name: templateName,
  };

  // If editing an existing DocuSeal template, include template_id
  if (templateId) {
    payload.template_id = templateId;
  }

  // If loading new document(s) into the builder
  if (documentUrls && documentUrls.length > 0) {
    payload.document_urls = documentUrls;
  }

  const token = jwt.sign(payload, apiKey, { expiresIn: "2h" });

  return NextResponse.json({ token });
}
