import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";

import { requireAdmin } from "~/utils/auth.server";
import { getSupabaseClient, getSupabaseAdmin } from "~/utils/getSupabaseClient";
import { sendWelcomeEmail } from "~/utils/email.server";
import { formatDate } from "~/utils/format";
import type { Profile } from "~/types/database";

export const meta: MetaFunction = () => [
  { title: "Borrowers | Requity Lending Admin" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAdmin(request);
  const supabase = getSupabaseClient(token);

  const { data: borrowers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "borrower")
    .order("created_at", { ascending: false });

  return Response.json({ borrowers: borrowers || [] });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_borrower") {
    const email = formData.get("email") as string;
    const fullName = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    const companyName = formData.get("company_name") as string;
    const tempPassword = formData.get("password") as string;

    if (!email || !tempPassword) {
      return Response.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "borrower",
        },
      });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    // Update profile with extra fields
    if (authData.user) {
      await supabaseAdmin
        .from("profiles")
        .update({ phone, company_name: companyName })
        .eq("id", authData.user.id);
    }

    // Send welcome email
    await sendWelcomeEmail(email, fullName || email, tempPassword);

    return Response.json({ success: true, message: "Borrower created successfully." });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminBorrowers() {
  const { borrowers } = useLoaderData<{ borrowers: Profile[] }>();
  const actionData = useActionData<{ error?: string; success?: boolean; message?: string }>();
  const navigation = useNavigation();
  const [showForm, setShowForm] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Borrowers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-light transition cursor-pointer"
        >
          {showForm ? "Cancel" : "+ New Borrower"}
        </button>
      </div>

      {actionData?.error && (
        <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 text-error border border-red-100">
          {actionData.error}
        </div>
      )}
      {actionData?.success && (
        <div className="p-3 mb-4 text-sm rounded-lg bg-green-50 text-green-700 border border-green-100">
          {actionData.message}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-navy mb-4">Create New Borrower</h2>
          <Form method="POST" onSubmit={() => setShowForm(false)}>
            <input type="hidden" name="intent" value="create_borrower" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Email <span className="text-error">*</span></label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="borrower@example.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Temporary Password <span className="text-error">*</span></label>
                <input
                  name="password"
                  type="text"
                  required
                  placeholder="TempPass123!"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Full Name</label>
                <input
                  name="full_name"
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Phone</label>
                <input
                  name="phone"
                  placeholder="(555) 123-4567"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted mb-1">Company / Entity Name</label>
                <input
                  name="company_name"
                  placeholder="Smith Capital LLC"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Borrower & Send Invite"}
            </button>
          </Form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-navy">Name</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Email</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Company</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted">
                    No borrowers yet.
                  </td>
                </tr>
              ) : (
                borrowers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-navy">{b.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted">{b.email}</td>
                    <td className="px-4 py-3 text-muted">{b.company_name || "—"}</td>
                    <td className="px-4 py-3 text-muted">{b.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted text-xs">{formatDate(b.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
