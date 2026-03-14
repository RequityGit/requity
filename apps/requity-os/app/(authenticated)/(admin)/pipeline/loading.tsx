import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="flex-shrink-0 w-72 space-y-3">
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            {/* Cards */}
            {Array.from({ length: col === 0 ? 3 : col === 1 ? 4 : 2 }).map(
              (_, card) => (
                <div
                  key={card}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex items-center gap-2 pt-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
