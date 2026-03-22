import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared/skeletons";

export default function LoansLoading() {
  return (
    <div className="space-y-6 p-6">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
