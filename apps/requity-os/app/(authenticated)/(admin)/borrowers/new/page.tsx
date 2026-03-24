import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AddBorrowerForm } from "@/components/admin/add-borrower-form";

export default async function AddBorrowerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Borrower"
        description="Create a new borrower profile."
      />
      <AddBorrowerForm />
    </div>
  );
}
