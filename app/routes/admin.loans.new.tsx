import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";

import { requireAdmin } from "~/utils/auth.server";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { LOAN_TYPES } from "~/types/database";
import type { Profile, LoanType } from "~/types/database";
import { getTemplateForLoanType } from "~/types/templates";

export const meta: MetaFunction = () => [
  { title: "New Loan | Requity Lending Admin" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAdmin(request);
  const supabase = getSupabaseClient(token);

  const { data: borrowers } = await supabase
    .from("profiles")
    .select("id, email, full_name, company_name")
    .eq("role", "borrower")
    .order("full_name");

  return Response.json({ borrowers: borrowers || [] });
}

export async function action({ request }: ActionFunctionArgs) {
  const { token, userId } = await requireAdmin(request);
  const supabase = getSupabaseClient(token);
  const formData = await request.formData();

  const borrowerId = formData.get("borrower_id") as string;
  const propertyAddress = formData.get("property_address") as string;
  const loanAmount = Number(formData.get("loan_amount"));
  const loanType = formData.get("loan_type") as LoanType;
  const loanName = formData.get("loan_name") as string;
  const processorName = formData.get("processor_name") as string;
  const processorEmail = formData.get("processor_email") as string;
  const useTemplate = formData.get("use_template") === "on";

  if (!borrowerId || !propertyAddress) {
    return Response.json(
      { error: "Borrower and property address are required." },
      { status: 400 }
    );
  }

  // Create loan
  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      borrower_id: borrowerId,
      loan_name: loanName || propertyAddress,
      property_address: propertyAddress,
      loan_amount: loanAmount || 0,
      loan_type: loanType,
      processor_name: processorName || "Estefania",
      processor_email: processorEmail || "",
    })
    .select()
    .single();

  if (error || !loan) {
    return Response.json({ error: error?.message || "Failed to create loan" }, { status: 500 });
  }

  // Add template documents if requested
  if (useTemplate) {
    const templates = getTemplateForLoanType(loanType);
    if (templates.length > 0) {
      const requirements = templates.map((name) => ({
        loan_id: loan.id,
        document_name: name,
      }));
      await supabase.from("document_requirements").insert(requirements);
    }
  }

  // Log activity
  await supabase.from("activity_log").insert({
    loan_id: loan.id,
    actor_id: userId,
    action: "loan_created",
    details: `Loan created for ${propertyAddress}`,
  });

  return redirect(`/admin/loan/${loan.id}`);
}

export default function NewLoan() {
  const { borrowers } = useLoaderData<{ borrowers: Pick<Profile, "id" | "email" | "full_name" | "company_name">[] }>();
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl">
      <a href="/admin" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent transition mb-6 block">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pipeline
      </a>

      <h1 className="text-2xl font-bold text-navy mb-6">Create New Loan</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {actionData?.error && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 text-error border border-red-100">
            {actionData.error}
          </div>
        )}

        <Form method="POST">
          <fieldset className="space-y-5 disabled:opacity-70" disabled={isSubmitting}>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Borrower <span className="text-error">*</span>
              </label>
              <select
                name="borrower_id"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
              >
                <option value="">Select borrower...</option>
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.full_name || b.email} {b.company_name ? `(${b.company_name})` : ""}
                  </option>
                ))}
              </select>
              <a href="/admin/borrowers" className="text-xs text-accent hover:underline mt-1 inline-block">
                + Create new borrower
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Property Address <span className="text-error">*</span>
              </label>
              <input
                name="property_address"
                required
                placeholder="123 Main St, Tampa FL 33602"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Loan Name</label>
              <input
                name="loan_name"
                placeholder="Optional — defaults to property address"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Loan Amount</label>
                <input
                  name="loan_amount"
                  type="number"
                  placeholder="500000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Loan Type</label>
                <select
                  name="loan_type"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                >
                  {LOAN_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Processor Name</label>
                <input
                  name="processor_name"
                  defaultValue="Estefania"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Processor Email</label>
                <input
                  name="processor_email"
                  type="email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use_template"
                name="use_template"
                defaultChecked
                className="rounded border-slate-300 text-accent focus:ring-accent"
              />
              <label htmlFor="use_template" className="text-sm text-navy">
                Add default document checklist for loan type
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Loan"}
            </button>
          </fieldset>
        </Form>
      </div>
    </div>
  );
}
