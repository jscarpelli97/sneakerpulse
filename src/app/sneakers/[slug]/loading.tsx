import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="page-shell min-h-screen">
      <div className="border-b border-ink/8 bg-white/85">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:h-16 md:px-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="hidden h-4 w-40 sm:block" />
          <Skeleton className="ml-auto h-8 w-28 rounded-full" />
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 pb-5 md:px-6">
          <Skeleton className="h-16 w-16 rounded-xl md:h-20 md:w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <Skeleton className="h-[360px] rounded-2xl" />
          <Skeleton className="h-[360px] rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
