import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { NewEquityDealForm } from "@/components/admin/equity-pipeline/new-equity-deal-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewEquityDealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: teamData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "admin")
    .order("full_name");

  const teamMembers = (teamData ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name ?? "Unknown",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/pipeline">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Pipeline
          </Button>
        </Link>
      </div>

      <PageHeader
        title="New Equity Deal"
        description="Create a new equity investment deal in the pipeline."
      />

      <NewEquityDealForm
        teamMembers={teamMembers}
        currentUserId={user.id}
      />
    </div>
  );
}
