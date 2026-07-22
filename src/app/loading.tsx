import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-muted">
      <div className="border-b border-dash-border bg-dash-surface/90">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:space-y-8 lg:px-8">
        <Skeleton className="h-64 w-full rounded-2xl sm:h-72" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-dash-border bg-dash-panel p-4">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
