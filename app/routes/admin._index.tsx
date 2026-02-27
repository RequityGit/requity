import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import StatusBadge from "~/components/StatusBadge";
import { requireAdmin } from "~/utils/auth.server";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { formatCurrency, formatDate } from "~/utils/format";
import type { Loan, LoanStatus } from "~/types/database";
import { LOAN_STATUSES } from "~/types/database";

export const meta: MetaFunction = () => [
  { title: "Pipeline | Requity Lending Admin" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAdmin(request);
  const supabase = getSupabaseClient(token);

  const { data: loans, error } = await supabase
    .from("loans")
    .select("*, borrower:profiles!loans_borrower_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Response(error.message, { status: 500 });
  }

  return Response.json({ loans: loans || [] });
}

export default function AdminPipeline() {
  const { loans } = useLoaderData<{ loans: (Loan & { borrower: { full_name: string; email: string } })[] }>();

  const loansByStatus = LOAN_STATUSES.reduce<Record<LoanStatus, typeof loans>>(
    (acc, status) => {
      acc[status] = loans.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<LoanStatus, typeof loans>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Pipeline</h1>
        <Link
          to="/admin/loans/new"
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-light transition"
        >
          + New Loan
        </Link>
      </div>

      {/* Pipeline table view */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-navy">Property</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Borrower</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Type</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Status</th>
                <th className="text-left px-4 py-3 font-medium text-navy">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    No loans yet. Create your first loan.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/admin/loan/${loan.id}`} className="font-medium text-navy hover:text-accent transition">
                        {loan.property_address || loan.loan_name || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {loan.borrower?.full_name || loan.borrower?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{loan.loan_type}</td>
                    <td className="px-4 py-3 font-medium text-navy">{formatCurrency(loan.loan_amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {formatDate(loan.status_updated_at || loan.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/loan/${loan.id}`}
                        className="text-accent hover:text-accent-light text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status summary */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {LOAN_STATUSES.map((status) => (
          <div key={status} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-navy">{loansByStatus[status].length}</p>
            <p className="text-xs text-muted mt-1">{status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
