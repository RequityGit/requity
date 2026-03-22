import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/shared/skeletons";

export default function FundsLoading() {
  return (
    <div className="space-y-6 p-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </div>
  );
}
