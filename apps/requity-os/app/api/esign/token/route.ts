import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
    .from("esign_submissions" as never)
    .select("id, requested_by" as never)
    .eq("id" as never, submissionId as never)
    .single();

  const sub = submission as any;
  if (!sub) {
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

  if (!adminRole && sub.requested_by !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Get the signer's DocuSeal submitter ID
  const { data: signer } = await admin
    .from("esign_signers" as never)
    .select("docuseal_submitter_id" as never)
    .eq("submission_id" as never, submissionId as never)
    .eq("email" as never, signerEmail as never)
    .single();

  const s = signer as any;
  if (!s?.docuseal_submitter_id) {
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
      submitterId: s.docuseal_submitter_id,
      userId: user.id,
    },
    secret,
    { expiresIn: "1h" }
  );

  return NextResponse.json({ token });
}
