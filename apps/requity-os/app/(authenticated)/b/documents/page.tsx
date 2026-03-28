import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";

export default async function BorrowerDocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documents"
        description="View and download documents related to your loans"
      />
      <EmptyState
        icon={FileText}
        title="Documents coming soon"
        description="We are upgrading the borrower portal. Check back shortly."
      />
    </div>
  );
}
