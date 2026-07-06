import { Skeleton } from "@/components/ui/skeleton";

export function PipelineSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-52 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Columns skeleton */}
      <div className="flex-1 flex gap-3 overflow-x-auto p-4 pt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="min-w-[280px] w-[280px] flex-shrink-0">
            <Skeleton className="h-24 rounded-xl mb-2" />
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
