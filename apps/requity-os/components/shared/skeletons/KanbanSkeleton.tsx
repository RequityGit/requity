import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  const columns = [4, 3, 2, 3, 1];
  return (
    <div className="flex gap-4 overflow-hidden">
      {columns.map((cardCount, col) => (
        <div key={col} className="w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="space-y-2 rounded-lg bg-muted/30 p-2">
            {Array.from({ length: cardCount }).map((_, i) => (
              <Skeleton key={i} className="h-[130px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
