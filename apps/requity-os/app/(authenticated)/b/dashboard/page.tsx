import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2 } from "lucide-react";

export default async function BorrowerDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your loans and activity"
      />
      <EmptyState
        icon={Building2}
        title="Borrower dashboard coming soon"
        description="We are upgrading the borrower portal. Check back shortly."
      />
    </div>
  );
}
