export default function Loading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef1f4_0%,#e6eaef_45%,#eef1f4_100%)]">
      <div className="border-b border-ink/10 bg-white/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
          <div className="h-4 w-28 animate-pulse bg-ink/10" />
          <div className="h-4 w-40 animate-pulse bg-ink/10" />
        </div>
      </div>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <div className="h-28 animate-pulse border border-ink/10 bg-white" />
        <div className="h-[360px] animate-pulse border border-ink/10 bg-white" />
        <div className="h-48 animate-pulse border border-ink/10 bg-white" />
      </main>
    </div>
  );
}
