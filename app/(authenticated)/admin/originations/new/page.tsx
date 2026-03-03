import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { NewDealForm } from "@/components/admin/originations/new-deal-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function NewDealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Use borrowers_safe view which joins borrowers with crm_contacts
  // to expose first_name, last_name, email, etc.
  const [entitiesResult, borrowersResult] = await Promise.all([
    admin
      .from("borrower_entities")
      .select("id, entity_name, entity_type, borrower_id")
      .order("entity_name"),
    (admin as any)
      .from("borrowers_safe")
      .select("id, first_name, last_name, email")
      .order("last_name"),
  ]);

  const entities = (entitiesResult.data || []).map((e: any) => ({
    id: e.id,
    entity_name: e.entity_name,
    entity_type: e.entity_type,
    borrower_id: e.borrower_id,
  }));

  const borrowers = (borrowersResult.data || []).map((b: any) => ({
    id: b.id,
    name: `${b.first_name || ""} ${b.last_name || ""}`.trim() || "Unknown",
    email: b.email || "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/originations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Pipeline
          </Button>
        </Link>
      </div>

      <PageHeader
        title="New Deal"
        description="Create a new deal opportunity in the pipeline."
      />

      <NewDealForm
        entities={entities}
        borrowers={borrowers}
        currentUserId={user.id}
      />
    </div>
  );
}
