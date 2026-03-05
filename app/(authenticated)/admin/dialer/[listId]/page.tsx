import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DialerListBuilder } from "@/components/dialer/DialerListBuilder";
import {
  updateDialerListAction,
  addContactsToListAction,
  removeContactFromListAction,
} from "../actions";
import type { DialerList, DialerListContact } from "@/lib/dialer/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { listId: string };
}

export default async function DialerListDetailPage({ params }: PageProps) {
  const { listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch list, contacts, team members, and CRM contacts in parallel
  const [listResult, listContactsResult, teamResult, crmContactsResult] =
    await Promise.all([
      admin.from("dialer_lists").select("*").eq("id", listId).single(),
      admin
        .from("dialer_list_contacts")
        .select(
          `
          *,
          contact:crm_contacts(
            id, first_name, last_name, phone, email, company_name,
            source, dnc, city, state, lifecycle_stage, last_contacted_at, notes
          )
        `
        )
        .eq("list_id", listId)
        .order("position", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "admin")
        .order("full_name"),
      admin
        .from("crm_contacts")
        .select(
          "id, first_name, last_name, phone, email, company_name, source, dnc, city, state, lifecycle_stage, last_contacted_at"
        )
        .is("deleted_at", null)
        .order("first_name"),
    ]);

  if (!listResult.data) notFound();

  const list = listResult.data as unknown as DialerList;
  const listContacts = (listContactsResult.data ?? []) as unknown as DialerListContact[];
  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
    })
  );
  const allContacts = crmContactsResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={list.name}
        description={list.description || "Dialer list configuration and contacts."}
        action={
          <Link href="/admin/dialer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              Back to Lists
            </Button>
          </Link>
        }
      />
      <DialerListBuilder
        list={list}
        listContacts={listContacts}
        allContacts={allContacts as any}
        teamMembers={teamMembers}
        onUpdateList={async (data) => {
          "use server";
          return updateDialerListAction(listId, data);
        }}
        onAddContacts={async (contactIds) => {
          "use server";
          return addContactsToListAction(listId, contactIds);
        }}
        onRemoveContact={async (listContactId) => {
          "use server";
          return removeContactFromListAction(listContactId, listId);
        }}
      />
    </div>
  );
}
