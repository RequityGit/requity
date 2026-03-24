import { TableSkeleton } from "@/components/shared/skeletons";
import { PageHeaderSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="rq-page-content">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
