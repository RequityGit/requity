import { DetailPageSkeleton } from "@/components/shared/skeletons";

export default function LoanDetailLoading() {
  return (
    <div className="p-6">
      <DetailPageSkeleton />
    </div>
  );
}
