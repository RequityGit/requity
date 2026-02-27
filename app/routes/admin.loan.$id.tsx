import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { useRef, useState } from "react";

import LoanStatusStepper from "~/components/LoanStatusStepper";
import StatusBadge from "~/components/StatusBadge";
import { requireAdmin } from "~/utils/auth.server";
import { getSupabaseClient, getSupabaseAdmin } from "~/utils/getSupabaseClient";
import { formatCurrency, formatDate, formatFileSize } from "~/utils/format";
import {
  sendLoanStatusUpdateEmail,
  sendDocumentApprovedEmail,
  sendRevisionRequestEmail,
  sendDocumentRequestEmail,
} from "~/utils/email.server";
import type { Loan, DocumentRequirement, ActivityLog, Profile } from "~/types/database";
import { LOAN_STATUSES } from "~/types/database";

export const meta: MetaFunction = () => [
  { title: "Loan Admin | Requity Lending" },
];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { token } = await requireAdmin(request);
  const supabase = getSupabaseClient(token);
  const loanId = params.id!;

  const [loanRes, reqsRes, activityRes] = await Promise.all([
    supabase
      .from("loans")
      .select("*, borrower:profiles!loans_borrower_id_fkey(*)")
      .eq("id", loanId)
      .single(),
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
      .limit(30),
  ]);

  if (loanRes.error || !loanRes.data) {
    throw new Response("Loan not found", { status: 404 });
  }

  return Response.json({
    loan: loanRes.data as Loan & { borrower: Profile },
    requirements: (reqsRes.data || []) as DocumentRequirement[],
    activity: (activityRes.data || []) as ActivityLog[],
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { token, userId } = await requireAdmin(request);
  const supabase = getSupabaseClient(token);
  const loanId = params.id!;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Get loan info for emails
  const { data: loan } = await supabase
    .from("loans")
    .select("*, borrower:profiles!loans_borrower_id_fkey(email, full_name)")
    .eq("id", loanId)
    .single();

  if (intent === "update_status") {
    const newStatus = formData.get("status") as string;
    await supabase
      .from("loans")
      .update({ status: newStatus, status_updated_at: new Date().toISOString() })
      .eq("id", loanId);

    await supabase.from("activity_log").insert({
      loan_id: loanId,
      actor_id: userId,
      action: "status_changed",
      details: `Loan status changed to ${newStatus}`,
    });

    if (loan?.borrower?.email) {
      await sendLoanStatusUpdateEmail(
        loan.borrower.email,
        loan.property_address,
        newStatus,
        loanId
      );
    }

    return Response.json({ success: true });
  }

  if (intent === "update_loan") {
    const updates: Record<string, string> = {};
    for (const key of ["loan_name", "property_address", "loan_amount", "processor_name", "processor_email", "notes"]) {
      const val = formData.get(key);
      if (val !== null) updates[key] = val as string;
    }
    await supabase.from("loans").update(updates).eq("id", loanId);
    return Response.json({ success: true });
  }

  if (intent === "approve_doc") {
    const reqId = formData.get("requirementId") as string;
    await supabase
      .from("document_requirements")
      .update({ status: "Approved" })
      .eq("id", reqId);

    const { data: req } = await supabase
      .from("document_requirements")
      .select("document_name")
      .eq("id", reqId)
      .single();

    await supabase.from("activity_log").insert({
      loan_id: loanId,
      actor_id: userId,
      action: "document_approved",
      details: `Approved: ${req?.document_name}`,
    });

    if (loan?.borrower?.email && req) {
      await sendDocumentApprovedEmail(
        loan.borrower.email,
        req.document_name,
        loan.property_address,
        loanId
      );
    }

    return Response.json({ success: true });
  }

  if (intent === "request_revision") {
    const reqId = formData.get("requirementId") as string;
    const note = formData.get("revision_note") as string;
    await supabase
      .from("document_requirements")
      .update({ status: "Needs Revision", revision_note: note })
      .eq("id", reqId);

    const { data: req } = await supabase
      .from("document_requirements")
      .select("document_name")
      .eq("id", reqId)
      .single();

    await supabase.from("activity_log").insert({
      loan_id: loanId,
      actor_id: userId,
      action: "revision_requested",
      details: `Revision requested for ${req?.document_name}: ${note}`,
    });

    if (loan?.borrower?.email && req) {
      await sendRevisionRequestEmail(
        loan.borrower.email,
        req.document_name,
        loan.property_address,
        note,
        loanId
      );
    }

    return Response.json({ success: true });
  }

  if (intent === "mark_under_review") {
    const reqId = formData.get("requirementId") as string;
    await supabase
      .from("document_requirements")
      .update({ status: "Under Review" })
      .eq("id", reqId);
    return Response.json({ success: true });
  }

  if (intent === "add_requirement") {
    const docName = formData.get("document_name") as string;
    const description = formData.get("description") as string;
    if (!docName) return Response.json({ error: "Document name required" }, { status: 400 });

    await supabase.from("document_requirements").insert({
      loan_id: loanId,
      document_name: docName,
      description: description || "",
    });

    await supabase.from("activity_log").insert({
      loan_id: loanId,
      actor_id: userId,
      action: "requirement_added",
      details: `Added requirement: ${docName}`,
    });

    if (loan?.borrower?.email) {
      await sendDocumentRequestEmail(
        loan.borrower.email,
        docName,
        loan.property_address,
        loanId
      );
    }

    return Response.json({ success: true });
  }

  if (intent === "delete_requirement") {
    const reqId = formData.get("requirementId") as string;
    await supabase.from("document_requirements").delete().eq("id", reqId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminLoanDetail() {
  const { loan, requirements, activity } = useLoaderData<{
    loan: Loan & { borrower: Profile };
    requirements: DocumentRequirement[];
    activity: ActivityLog[];
  }>();

  const statusFetcher = useFetcher();
  const loanFetcher = useFetcher();
  const addReqFetcher = useFetcher();
  const [showAddReq, setShowAddReq] = useState(false);
  const [editLoan, setEditLoan] = useState(false);

  return (
    <div className="space-y-6">
      <a href="/admin" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent transition">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pipeline
      </a>

      {/* Header with status changer */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-navy">
              {loan.property_address || loan.loan_name}
            </h1>
            <p className="text-sm text-muted mt-1">
              Borrower: {loan.borrower?.full_name || loan.borrower?.email || "—"} &middot; {loan.loan_type} &middot; {formatCurrency(loan.loan_amount)}
            </p>
          </div>
          <statusFetcher.Form method="POST" className="flex items-center gap-2">
            <input type="hidden" name="intent" value="update_status" />
            <select
              name="status"
              defaultValue={loan.status}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
            >
              {LOAN_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-light transition cursor-pointer"
            >
              Update
            </button>
          </statusFetcher.Form>
        </div>
        <LoanStatusStepper currentStatus={loan.status} />
      </div>

      {/* Loan Details (editable) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-navy">Loan Details</h2>
          <button
            onClick={() => setEditLoan(!editLoan)}
            className="text-xs text-accent hover:underline cursor-pointer"
          >
            {editLoan ? "Cancel" : "Edit"}
          </button>
        </div>
        {editLoan ? (
          <loanFetcher.Form method="POST" className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={() => setEditLoan(false)}>
            <input type="hidden" name="intent" value="update_loan" />
            <label className="block">
              <span className="text-xs text-muted">Loan Name</span>
              <input name="loan_name" defaultValue={loan.loan_name} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Property Address</span>
              <input name="property_address" defaultValue={loan.property_address} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Loan Amount</span>
              <input name="loan_amount" type="number" defaultValue={loan.loan_amount} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Processor Name</span>
              <input name="processor_name" defaultValue={loan.processor_name} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Processor Email</span>
              <input name="processor_email" type="email" defaultValue={loan.processor_email} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-muted">Internal Notes</span>
              <textarea name="notes" defaultValue={loan.notes} rows={3} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </label>
            <div>
              <button type="submit" className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-light transition cursor-pointer">
                Save Changes
              </button>
            </div>
          </loanFetcher.Form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted text-xs">Property</p><p className="font-medium text-navy">{loan.property_address}</p></div>
            <div><p className="text-muted text-xs">Amount</p><p className="font-medium text-navy">{formatCurrency(loan.loan_amount)}</p></div>
            <div><p className="text-muted text-xs">Type</p><p className="font-medium text-navy">{loan.loan_type}</p></div>
            <div><p className="text-muted text-xs">Processor</p><p className="font-medium text-navy">{loan.processor_name}</p></div>
            <div><p className="text-muted text-xs">Borrower</p><p className="font-medium text-navy">{loan.borrower?.full_name || "—"}</p><p className="text-xs text-muted">{loan.borrower?.email}</p></div>
            {loan.notes && <div className="col-span-2 md:col-span-3"><p className="text-muted text-xs">Notes</p><p className="text-navy">{loan.notes}</p></div>}
          </div>
        )}
      </div>

      {/* Document Review */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-navy">
            Documents ({requirements.filter((r) => r.status === "Approved").length}/{requirements.length})
          </h2>
          <button
            onClick={() => setShowAddReq(!showAddReq)}
            className="text-xs text-accent hover:underline cursor-pointer"
          >
            {showAddReq ? "Cancel" : "+ Add Requirement"}
          </button>
        </div>

        {showAddReq && (
          <addReqFetcher.Form method="POST" className="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-slate-50 rounded-lg" onSubmit={() => setShowAddReq(false)}>
            <input type="hidden" name="intent" value="add_requirement" />
            <input name="document_name" placeholder="Document name" required className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            <input name="description" placeholder="Description (optional)" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            <button type="submit" className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-light transition shrink-0 cursor-pointer">Add</button>
          </addReqFetcher.Form>
        )}

        {requirements.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">No document requirements.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {requirements.map((req) => (
              <AdminDocRow key={req.id} requirement={req} loanId={loan.id} />
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Activity Log</h2>
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

function AdminDocRow({ requirement, loanId }: { requirement: DocumentRequirement; loanId: string }) {
  const fetcher = useFetcher();
  const [showRevision, setShowRevision] = useState(false);
  const latestDoc = requirement.documents?.length
    ? requirement.documents[requirement.documents.length - 1]
    : null;

  return (
    <div className="py-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-navy">{requirement.document_name}</span>
            <StatusBadge status={requirement.status} />
          </div>
          {requirement.description && <p className="text-xs text-muted mt-1">{requirement.description}</p>}
          {latestDoc && (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted">
                {latestDoc.file_name} ({formatFileSize(latestDoc.file_size)}) — {formatDate(latestDoc.created_at)}
              </p>
              <a
                href={`/admin/download/${latestDoc.loan_id}/${latestDoc.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline"
              >
                View
              </a>
            </div>
          )}
          {requirement.revision_note && (
            <p className="text-xs text-error mt-1">Note: {requirement.revision_note}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(requirement.status === "Uploaded" || requirement.status === "Under Review") && (
            <>
              {requirement.status === "Uploaded" && (
                <fetcher.Form method="POST">
                  <input type="hidden" name="intent" value="mark_under_review" />
                  <input type="hidden" name="requirementId" value={requirement.id} />
                  <button type="submit" className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md hover:bg-yellow-100 transition cursor-pointer">
                    Review
                  </button>
                </fetcher.Form>
              )}
              <fetcher.Form method="POST">
                <input type="hidden" name="intent" value="approve_doc" />
                <input type="hidden" name="requirementId" value={requirement.id} />
                <button type="submit" className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition cursor-pointer">
                  Approve
                </button>
              </fetcher.Form>
              <button
                onClick={() => setShowRevision(!showRevision)}
                className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition cursor-pointer"
              >
                Revision
              </button>
            </>
          )}
          <fetcher.Form method="POST">
            <input type="hidden" name="intent" value="delete_requirement" />
            <input type="hidden" name="requirementId" value={requirement.id} />
            <button type="submit" className="px-2 py-1 text-xs text-muted hover:text-error transition cursor-pointer" title="Delete requirement">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </fetcher.Form>
        </div>
      </div>

      {showRevision && (
        <fetcher.Form method="POST" className="mt-2 flex gap-2" onSubmit={() => setShowRevision(false)}>
          <input type="hidden" name="intent" value="request_revision" />
          <input type="hidden" name="requirementId" value={requirement.id} />
          <input
            name="revision_note"
            placeholder="Describe what needs to be fixed..."
            required
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button type="submit" className="px-3 py-2 bg-error text-white text-sm rounded-lg hover:bg-red-600 transition cursor-pointer">
            Send
          </button>
        </fetcher.Form>
      )}
    </div>
  );
}
