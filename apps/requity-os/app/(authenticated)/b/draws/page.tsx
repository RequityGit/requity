import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { PenTool } from "lucide-react";

export default async function BorrowerDrawsPage() {
  return (
    <div>
      <PageHeader
        title="Draw Requests"
        description="Submit and track draw requests for your loans"
      />
      <EmptyState
        icon={PenTool}
        title="Draw requests coming soon"
        description="We are upgrading the borrower portal. Check back shortly."
      />
    </div>
  );
}
