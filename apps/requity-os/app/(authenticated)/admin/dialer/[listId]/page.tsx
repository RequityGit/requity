import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import type { DialerList, DialerListContact } from "@/lib/dialer/types";

export const dynamic = "force-dynamic";

export default async function DialerListDetailPage({
  params,
}: {
  params: { listId: string };
}) {
  const { listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: list } = await supabase
    .from("dialer_lists")
    .select("*")
    .eq("id", listId)
    .single();

  if (!list) notFound();

  const typedList = list as unknown as DialerList;

  // Fetch list contacts with CRM contact info
  const { data: listContacts } = await supabase
    .from("dialer_list_contacts")
    .select("*, crm_contacts(first_name, last_name, phone, email, dnc, source)")
    .eq("list_id", listId)
    .order("position");

  const contacts = (listContacts ?? []) as unknown as (DialerListContact & {
    crm_contacts: {
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      email: string | null;
      dnc: boolean | null;
      source: string | null;
    };
  })[];

  const statusColors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    called: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dnc_skipped: "bg-red-500/10 text-red-600 dark:text-red-400",
    skipped: "bg-muted text-muted-foreground",
    callback_scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  const canStart = typedList.status === "draft" || typedList.status === "paused";

  return (
    <div className="space-y-6">
      <PageHeader
        title={typedList.name}
        description={typedList.description || `${typedList.total_contacts} contacts`}
        action={
          canStart ? (
            <Link
              href={`/admin/dialer/${listId}/session`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Start Dialing
            </Link>
          ) : undefined
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold font-mono text-foreground">{typedList.total_contacts}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-lg font-semibold font-mono text-foreground">{typedList.completed_contacts}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-lg font-semibold text-foreground capitalize">{typedList.status}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Position</p>
          <p className="text-lg font-semibold font-mono text-foreground">{typedList.current_position}</p>
        </div>
      </div>

      {/* Contacts table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Phone</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Disposition</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => {
              const name = [c.crm_contacts?.first_name, c.crm_contacts?.last_name]
                .filter(Boolean)
                .join(" ") || "Unknown";
              return (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                    {c.position}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-medium text-foreground">{name}</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-muted-foreground">
                    {c.crm_contacts?.phone || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        statusColors[c.status] || statusColors.pending
                      }`}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {c.disposition ? c.disposition.replace(/_/g, " ") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                    {c.attempts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
