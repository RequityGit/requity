import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireInvestor } from "~/utils/auth.server";
import { createSupabaseServerClient } from "~/utils/supabase.server";
import { formatCurrency } from "~/utils/format";
import type { Investor, Entity, EntityInvestment, Document } from "~/types/database";
import { ENTITY_TYPE_LABELS } from "~/types/database";

export const meta: MetaFunction = () => [
  { title: "Dashboard | Requity Group Investor Portal" },
];

interface EntityCard {
  entity: Entity;
  investmentCount: number;
  totalFundedCapital: number;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await requireInvestor(request);
  const { supabase, headers } = createSupabaseServerClient(request);

  // Fetch investor's entities with their investments
  const { data: investorEntities } = await supabase
    .from("investor_entities")
    .select("*, entity:entities(*)")
    .eq("investor_id", auth.userId);

  const entityCards: EntityCard[] = [];

  if (investorEntities) {
    for (const ie of investorEntities) {
      const entity = ie.entity as Entity;
      const { data: entityInvestments } = await supabase
        .from("entity_investments")
        .select("*")
        .eq("entity_id", entity.id)
        .eq("status", "active");

      const investmentCount = entityInvestments?.length ?? 0;
      const totalFundedCapital = entityInvestments?.reduce(
        (sum: number, ei: EntityInvestment) => sum + (ei.funded_capital ?? 0),
        0
      ) ?? 0;

      entityCards.push({ entity, investmentCount, totalFundedCapital });
    }
  }

  // Fetch recent documents (last 5)
  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("*, entity:entities(name), investment:investments(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return Response.json(
    {
      investor: auth.investor,
      entityCards,
      recentDocuments: recentDocuments ?? [],
    },
    { headers }
  );
}

export default function InvestorDashboard() {
  const { investor, entityCards, recentDocuments } = useLoaderData<{
    investor: Investor;
    entityCards: EntityCard[];
    recentDocuments: Document[];
  }>();

  return (
    <div>
      {/* Welcome */}
      <h1 className="text-2xl font-bold text-navy mb-1">
        Welcome, {investor.first_name}
      </h1>
      <p className="text-sm text-muted mb-8">
        Here&apos;s an overview of your investments.
      </p>

      {/* Entity Cards */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-navy mb-4">Your Entities</h2>
        {entityCards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-muted/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-muted">No entities linked to your account yet.</p>
            <p className="text-sm text-muted/70 mt-1">
              Your investment entities will appear here once configured by the Requity team.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entityCards.map(({ entity, investmentCount, totalFundedCapital }) => (
              <Link
                key={entity.id}
                to={`/entities/${entity.id}`}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-accent/30 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-muted">
                    {ENTITY_TYPE_LABELS[entity.entity_type]}
                  </span>
                  {entity.tax_id_last_four && (
                    <span className="text-xs text-muted">
                      ****{entity.tax_id_last_four}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-navy group-hover:text-accent transition text-sm mb-1">
                  {entity.name}
                </h3>
                <p className="text-lg font-bold text-navy">
                  {formatCurrency(totalFundedCapital)}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {investmentCount} active investment{investmentCount !== 1 ? "s" : ""}
                  </span>
                  <svg className="w-4 h-4 text-muted group-hover:text-accent transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Documents */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Recent Documents</h2>
          <Link
            to="/documents"
            className="text-sm text-accent hover:text-accent-light transition"
          >
            View all
          </Link>
        </div>
        {recentDocuments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-muted text-sm">No documents available yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden md:table-cell">Entity</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-navy">
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-muted capitalize hidden sm:table-cell">
                      {doc.document_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-muted hidden md:table-cell">
                      {doc.entity?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted text-right">
                      {new Date(doc.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/documents"
            className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 hover:border-accent/30 hover:shadow-md transition"
          >
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-navy">All Documents</span>
          </Link>
          <Link
            to="/entities"
            className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 hover:border-accent/30 hover:shadow-md transition"
          >
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            <span className="text-sm font-medium text-navy">My Entities</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 hover:border-accent/30 hover:shadow-md transition"
          >
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-navy">My Profile</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
