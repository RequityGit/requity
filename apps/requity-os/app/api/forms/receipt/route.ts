import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import type { FormStep, FormFieldDefinition } from "@/lib/form-engine/types";

interface ReceiptRequest {
  submission_id: string;
}

/**
 * POST /api/forms/receipt
 *
 * Generates a PDF receipt for a signed form submission and saves it to:
 * 1. unified_deal_documents (if submission is linked to a deal)
 * 2. contact_files (if submission created/matched a contact)
 *
 * Called automatically after form submission when a signature is present.
 */
export async function POST(request: Request) {
  try {
    const body: ReceiptRequest = await request.json();
    const { submission_id } = body;

    if (!submission_id) {
      return NextResponse.json(
        { success: false, error: "Missing submission_id" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createAdminClient();

    // 1. Load the submission with form definition
    const { data: submission, error: subError } = await supabase
      .from("form_submissions")
      .select("*, form_definitions(*)")
      .eq("id", submission_id)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { success: false, error: "Submission not found" },
        { status: 404 }
      );
    }

    const formDef = submission.form_definitions;
    const formData = submission.data || {};
    const signatureAudit = submission.signature_audit || {};
    const entityIds = submission.entity_ids || {};
    const steps = (formDef?.steps || []) as FormStep[];

    // Check if there's actually a signature in the data
    const hasSignature = Object.values(formData).some(
      (v: unknown) =>
        v &&
        typeof v === "object" &&
        (v as Record<string, unknown>).data_url &&
        (v as Record<string, unknown>).timestamp
    );

    if (!hasSignature) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "No signature found in submission data",
      });
    }

    // 2. Build the signer info from form data
    const signerName =
      (formData.full_name as string) ||
      `${(formData.first_name as string) || ""} ${(formData.last_name as string) || ""}`.trim() ||
      (submission.submitted_by_email as string) ||
      "Unknown";

    const signerEmail = (formData.email as string) || submission.submitted_by_email || "";
    const signerRole = (formData.preparer_role as string) || "";

    // Get deal name if linked
    let dealName = "";
    const dealId = entityIds.unified_deal_id || entityIds.opportunity_id || null;
    if (dealId) {
      const { data: deal } = await supabase
        .from("unified_deals")
        .select("name")
        .eq("id", dealId)
        .single();
      if (deal) dealName = deal.name;
    }

    // 3. Prepare step metadata for the PDF (labels + types, not raw data)
    const stepMeta = steps.map((step: FormStep) => ({
      title: step.title,
      fields: step.fields.map((f: FormFieldDefinition) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        component_type: f.component_type || null,
        component_config: f.component_config || null,
      })),
    }));

    // 4. Generate the PDF via Python script
    const tmpPath = join("/tmp", `receipt-${randomUUID()}.pdf`);
    const scriptPath = join(process.cwd(), "scripts", "generate-form-receipt.py");

    const pdfInput = {
      form_name: formDef?.name || "Form Submission",
      submission_id,
      submitted_at: submission.updated_at || submission.created_at,
      signer_name: signerName,
      signer_email: signerEmail,
      signer_role: signerRole,
      deal_name: dealName,
      signature_audit: signatureAudit,
      form_data: formData,
      steps: stepMeta,
      output_path: tmpPath,
    };

    await new Promise<void>((resolve, reject) => {
      const proc = execFile("python3", [scriptPath], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.error("PDF generation stderr:", stderr);
          reject(new Error(`PDF generation failed: ${error.message}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              resolve();
            } else {
              reject(new Error("PDF generation returned failure"));
            }
          } catch {
            // stdout might not be valid JSON but file was still created
            resolve();
          }
        }
      });

      // Send input via stdin
      proc.stdin?.write(JSON.stringify(pdfInput));
      proc.stdin?.end();
    });

    // 5. Read the generated PDF
    const pdfBuffer = await readFile(tmpPath);
    const pdfSize = pdfBuffer.length;

    // Build filename
    const dateStr = new Date().toISOString().split("T")[0];
    const safeFormName = (formDef?.name || "form")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const fileName = `${safeFormName}-receipt-${dateStr}.pdf`;

    // 6. Upload to Supabase Storage
    const storageBucket = "portal-documents";
    const storagePath = `form-receipts/${submission_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Clean up temp file
      await unlink(tmpPath).catch(() => {});
      return NextResponse.json(
        { success: false, error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 7. Link to deal documents (if deal exists)
    let dealDocId: string | null = null;
    if (dealId) {
      const { data: dealDoc, error: dealDocError } = await supabase
        .from("unified_deal_documents")
        .insert({
          deal_id: dealId,
          document_name: `${formDef?.name || "Form"} - Signed Receipt`,
          file_url: storagePath,
          storage_path: storagePath,
          file_size_bytes: pdfSize,
          mime_type: "application/pdf",
          category: "application",
          visibility: "internal",
          submission_status: "final",
        })
        .select("id")
        .single();

      if (!dealDocError && dealDoc) {
        dealDocId = dealDoc.id;
      } else {
        console.error("Deal document insert error:", dealDocError);
      }
    }

    // 8. Link to contact files (if contact exists)
    let contactFileId: string | null = null;
    const contactId = entityIds.contact_id || null;
    if (contactId) {
      const { data: contactFile, error: contactFileError } = await supabase
        .from("contact_files")
        .insert({
          contact_id: contactId,
          file_name: fileName,
          file_type: "application",
          storage_path: storagePath,
          file_size: pdfSize,
          mime_type: "application/pdf",
          notes: `Auto-generated signed receipt for ${formDef?.name || "form submission"}`,
        })
        .select("id")
        .single();

      if (!contactFileError && contactFile) {
        contactFileId = contactFile.id;
      } else {
        console.error("Contact file insert error:", contactFileError);
      }
    }

    // 9. Update the submission record with receipt info
    await supabase
      .from("form_submissions")
      .update({
        signature_audit: {
          ...signatureAudit,
          receipt_generated: true,
          receipt_storage_path: storagePath,
          receipt_deal_doc_id: dealDocId,
          receipt_contact_file_id: contactFileId,
          receipt_generated_at: new Date().toISOString(),
        },
      })
      .eq("id", submission_id);

    // Clean up temp file
    await unlink(tmpPath).catch(() => {});

    return NextResponse.json({
      success: true,
      receipt: {
        storage_path: storagePath,
        file_name: fileName,
        file_size: pdfSize,
        deal_doc_id: dealDocId,
        contact_file_id: contactFileId,
      },
    });
  } catch (err) {
    console.error("Receipt generation error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
