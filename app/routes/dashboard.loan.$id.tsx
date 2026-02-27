import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useRef } from "react";

import LoanStatusStepper from "~/components/LoanStatusStepper";
import StatusBadge from "~/components/StatusBadge";
import { requireAuth } from "~/utils/auth.server";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { formatCurrency, formatDate, formatFileSize } from "~/utils/format";
import { sendDocumentUploadedAdminEmail } from "~/utils/email.server";
import type { Loan, DocumentRequirement, ActivityLog } from "~/types/database";

export const meta: MetaFunction = () => [
  { title: "Loan Details | Requity Lending Portal" },
];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { token } = await requireAuth(request);
  const supabase = getSupabaseClient(token);
  const loanId = params.id!;

  const [loanRes, reqsRes, activityRes] = await Promise.all([
    supabase.from("loans").select("*").eq("id", loanId).single(),
    supabase
      .from("document_requirements")
      .select("*, documents(*)")
      .eq("loan_id", loanId)
      .order("created_at", { ascending: true }),
    supabase
      .from("activity_log")
      .select("*")
      .eq("loan_id", loanId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (loanRes.error || !loanRes.data) {
    throw new Response("Loan not found", { status: 404 });
  }

  return Response.json({
    loan: loanRes.data as Loan,
    requirements: (reqsRes.data || []) as DocumentRequirement[],
    activity: (activityRes.data || []) as ActivityLog[],
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { token, userId, profile } = await requireAuth(request);
  const supabase = getSupabaseClient(token);
  const loanId = params.id!;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "upload") {
    const requirementId = formData.get("requirementId") as string;
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return Response.json({ error: "No file selected" }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: "File must be under 25MB" }, { status: 400 });
    }

    const filePath = `${loanId}/${requirementId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("loan-documents")
      .upload(filePath, file);

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert document record
    await supabase.from("documents").insert({
      requirement_id: requirementId,
      loan_id: loanId,
      uploaded_by: userId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
    });

    // Update requirement status
    await supabase
      .from("document_requirements")
      .update({ status: "Uploaded" })
      .eq("id", requirementId);

    // Log activity
    await supabase.from("activity_log").insert({
      loan_id: loanId,
      actor_id: userId,
      action: "document_uploaded",
      details: `Uploaded ${file.name}`,
    });

    // Send email to admin
    const { data: loan } = await supabase
      .from("loans")
      .select("property_address, processor_email")
      .eq("id", loanId)
      .single();

    const { data: req } = await supabase
      .from("document_requirements")
      .select("document_name")
      .eq("id", requirementId)
      .single();

    if (loan?.processor_email && req) {
      await sendDocumentUploadedAdminEmail(
        loan.processor_email,
        profile.full_name || profile.email,
        req.document_name,
        loan.property_address,
        loanId
      );
    }

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function BorrowerLoanDetail() {
  const { loan, requirements, activity } = useLoaderData<{
    loan: Loan;
    requirements: DocumentRequirement[];
    activity: ActivityLog[];
  }>();

  return (
    <div className="space-y-6">
      {/* Back link */}
      <a href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent transition">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Loans
      </a>

      {/* Loan Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-navy">
              {loan.property_address || loan.loan_name}
            </h1>
            <p className="text-sm text-muted mt-1">
              {loan.loan_type} &middot; {formatCurrency(loan.loan_amount)}
            </p>
          </div>
          <StatusBadge status={loan.status} />
        </div>
        <LoanStatusStepper currentStatus={loan.status} />
      </div>

      {/* Loan Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Loan Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted text-xs">Property</p>
            <p className="font-medium text-navy">{loan.property_address}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Loan Amount</p>
            <p className="font-medium text-navy">{formatCurrency(loan.loan_amount)}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Loan Type</p>
            <p className="font-medium text-navy">{loan.loan_type}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Processor</p>
            <p className="font-medium text-navy">{loan.processor_name || "TBD"}</p>
            {loan.processor_email && (
              <a href={`mailto:${loan.processor_email}`} className="text-xs text-accent hover:underline">
                {loan.processor_email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">
          Document Checklist ({requirements.filter((r) => r.status === "Approved").length}/{requirements.length} complete)
        </h2>
        {requirements.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">No documents requested yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {requirements.map((req) => (
              <DocumentRow key={req.id} requirement={req} loanId={loan.id} />
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div>
                  <p className="text-navy">{entry.details}</p>
                  <p className="text-xs text-muted">{formatDate(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentRow({
  requirement,
  loanId,
}: {
  requirement: DocumentRequirement;
  loanId: string;
}) {
  const fetcher = useFetcher();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = fetcher.state === "submitting";

  const showUpload =
    requirement.status === "Pending Upload" ||
    requirement.status === "Needs Revision";

  const latestDoc = requirement.documents?.length
    ? requirement.documents[requirement.documents.length - 1]
    : null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("intent", "upload");
    formData.set("requirementId", requirement.id);
    formData.set("file", file);
    fetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
  }

  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-navy truncate">
            {requirement.document_name}
          </span>
          {requirement.required && (
            <span className="text-[10px] text-error font-medium">Required</span>
          )}
        </div>
        {requirement.description && (
          <p className="text-xs text-muted">{requirement.description}</p>
        )}
        {requirement.due_date && (
          <p className="text-xs text-muted">Due: {formatDate(requirement.due_date)}</p>
        )}
        {requirement.status === "Needs Revision" && requirement.revision_note && (
          <div className="mt-2 p-2 rounded bg-red-50 border border-red-100">
            <p className="text-xs text-error font-medium">Revision needed:</p>
            <p className="text-xs text-red-700">{requirement.revision_note}</p>
          </div>
        )}
        {latestDoc && (
          <p className="text-xs text-muted mt-1">
            Uploaded: {latestDoc.file_name} ({formatFileSize(latestDoc.file_size)})
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={requirement.status} />
        {showUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.heic"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-light transition disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
