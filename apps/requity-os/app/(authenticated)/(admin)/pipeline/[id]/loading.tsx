import { Skeleton } from "@/components/ui/skeleton";

export default function DealDetailLoading() {
  return (
    <div className="px-6 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex gap-4 items-start">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        {/* Stage Stepper */}
        <div className="mt-6 rounded-xl border bg-card px-5 py-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <div className="h-px w-3 bg-border" />}
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mt-6 mb-6">
          <div className="inline-flex gap-0.5 rounded-[10px] p-[3px] bg-muted border">
            {["Overview", "Property", "Underwriting", "Borrower", "Conditions", "Documents", "Tasks", "Activity", "Notes"].map(
              (tab) => (
                <div
                  key={tab}
                  className="rounded-lg px-3.5 py-[7px] text-[13px] text-muted-foreground"
                >
                  {tab}
                </div>
              )
            )}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
