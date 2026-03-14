import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AddInvestorForm } from "@/components/admin/add-investor-form";

export default async function AddInvestorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Investor"
        description="Create a new investor account. The investor will receive an email to set up their password."
      />
      <AddInvestorForm />
    </div>
  );
}
