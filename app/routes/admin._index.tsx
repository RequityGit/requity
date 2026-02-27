import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/utils/auth.server";
import { createSupabaseServerClient } from "~/utils/supabase.server";

export const meta: MetaFunction = () => [
  { title: "Admin Dashboard | Requity Group" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const { supabase, headers } = createSupabaseServerClient(request);

  const [investorsResult, entitiesResult, investmentsResult, documentsResult] =
    await Promise.all([
      supabase.from("investors").select("id", { count: "exact", head: true }),
      supabase.from("entities").select("id", { count: "exact", head: true }),
      supabase.from("investments").select("id", { count: "exact", head: true }),
      supabase
        .from("documents")
        .select("id, name, document_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return Response.json(
    {
      stats: {
        investors: investorsResult.count ?? 0,
        entities: entitiesResult.count ?? 0,
        investments: investmentsResult.count ?? 0,
      },
      recentDocuments: documentsResult.data ?? [],
    },
    { headers }
  );
}

export default function AdminDashboard() {
  const { stats, recentDocuments } = useLoaderData<{
    stats: { investors: number; entities: number; investments: number };
    recentDocuments: { id: string; name: string; document_type: string; created_at: string }[];
  }>();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-3xl font-bold text-navy">{stats.investors}</p>
          <p className="text-sm text-muted mt-1">Total Investors</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-3xl font-bold text-navy">{stats.entities}</p>
          <p className="text-sm text-muted mt-1">Total Entities</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-3xl font-bold text-navy">{stats.investments}</p>
          <p className="text-sm text-muted mt-1">Total Investments</p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-navy mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/admin/investors"
            className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 hover:border-accent/30 hover:shadow-md transition"
          >
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-sm font-medium text-navy">Manage Investors</span>
          </Link>
          <Link
            to="/admin/investments"
            className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 hover:border-accent/30 hover:shadow-md transition"
          >
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-navy">Manage Investments</span>
          </Link>
          <Link
            to="/admin/documents"
            className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 hover:border-accent/30 hover:shadow-md transition"
          >
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm font-medium text-navy">Upload Documents</span>
          </Link>
        </div>
      </section>

      {/* Recent Documents */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Recent Uploads</h2>
        {recentDocuments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-muted text-sm">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-navy">{doc.name}</td>
                    <td className="px-4 py-3 text-muted capitalize">
                      {doc.document_type.replace(/_/g, " ")}
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
    </div>
  );
}
