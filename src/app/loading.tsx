export default function Loading() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-muted">
      <div className="border-b border-dash-border bg-dash-surface">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-32 animate-pulse rounded bg-dash-elevated" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-2xl border border-dash-border bg-dash-panel" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-dash-border bg-dash-panel"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-dash-border bg-dash-panel" />
      </main>
    </div>
  );
}
