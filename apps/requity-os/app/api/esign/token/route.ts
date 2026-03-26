import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/esign/token
 * Generates a short-lived JWT token for the DocusealForm embedded signing component.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { submissionId, signerEmail } = body as {
    submissionId: number;
    signerEmail: string;
  };

  if (!submissionId || !signerEmail) {
    return NextResponse.json(
      { error: "submissionId and signerEmail are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify user has access
  const { data: submission } = await admin
    .from("esign_submissions")
    .select("id, requested_by")
    .eq("id", submissionId)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Check if user is admin or the requester
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!adminRole && submission.requested_by !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Get the signer's DocuSeal submitter ID
  const { data: signer } = await admin
    .from("esign_signers")
    .select("docuseal_submitter_id")
    .eq("submission_id", submissionId)
    .eq("email", signerEmail)
    .single();

  if (!signer?.docuseal_submitter_id) {
    return NextResponse.json({ error: "Signer not found" }, { status: 404 });
  }

  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const token = jwt.sign(
    {
      submissionId,
      signerEmail,
      submitterId: signer.docuseal_submitter_id,
      userId: user.id,
    },
    secret,
    { expiresIn: "1h" }
  );

  return NextResponse.json({ token });
}
