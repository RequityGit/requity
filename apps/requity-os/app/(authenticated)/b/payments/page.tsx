import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { DollarSign } from "lucide-react";

export default async function BorrowerPaymentsPage() {
  return (
    <div>
      <PageHeader
        title="Payments"
        description="View your payment history across all loans"
      />
      <EmptyState
        icon={DollarSign}
        title="Payments coming soon"
        description="We are upgrading the borrower portal. Check back shortly."
      />
    </div>
  );
}
