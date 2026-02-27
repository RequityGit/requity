import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import StatusBadge from "~/components/StatusBadge";
import { requireAuth } from "~/utils/auth.server";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { formatCurrency } from "~/utils/format";
import type { Loan } from "~/types/database";

export const meta: MetaFunction = () => [
  { title: "My Loans | Requity Lending Portal" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAuth(request);
  const supabase = getSupabaseClient(token);

  const { data: loans, error } = await supabase
    .from("loans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Response(error.message, { status: 500 });
  }

  return Response.json({ loans: loans || [] });
}

export default function BorrowerDashboard() {
  const { loans } = useLoaderData<{ loans: Loan[] }>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">My Loans</h1>

      {loans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-muted/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-muted">No active loans yet.</p>
          <p className="text-sm text-muted/70 mt-1">Your loans will appear here once they&apos;re created by the Requity team.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <Link
              key={loan.id}
              to={`/dashboard/loan/${loan.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-accent/30 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <StatusBadge status={loan.status} />
                <span className="text-xs text-muted">{loan.loan_type}</span>
              </div>
              <h3 className="font-semibold text-navy group-hover:text-accent transition text-sm mb-1">
                {loan.property_address || loan.loan_name}
              </h3>
              <p className="text-lg font-bold text-navy">
                {formatCurrency(loan.loan_amount)}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-muted">
                  Processor: {loan.processor_name || "TBD"}
                </span>
                <svg className="w-4 h-4 text-muted group-hover:text-accent transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}