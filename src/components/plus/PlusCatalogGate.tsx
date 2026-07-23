import Link from "next/link";

export function PlusCatalogGate({
  visible,
  total,
  freeLimit,
}: {
  visible: number;
  total: number;
  freeLimit: number;
}) {
  const locked = Math.max(0, total - visible);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dash-accent/30 bg-[rgba(212,160,23,0.08)] px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-accent">
          Free tier · top {freeLimit}
        </p>
        <p className="mt-1 text-sm text-dash-text/90">
          Showing {visible} of {total} pairs
          {locked > 0 ? ` · ${locked} more unlock with Plus` : ""}.
        </p>
      </div>
      <Link
        href="/plus"
        className="shrink-0 rounded-xl bg-dash-accent px-4 py-2 text-sm font-semibold text-dash-bg hover:brightness-110"
      >
        Unlock all with Plus
      </Link>
    </div>
  );
}

export function PlusMarketLock({
  name,
}: {
  name: string;
}) {
  return (
    <div className="dash-card mx-auto max-w-lg space-y-4 border-dash-accent/25 p-6 text-center sm:p-8">
      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
        Plus market
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight sm:text-3xl">
        {name} is behind Plus
      </h1>
      <p className="text-sm leading-relaxed text-dash-muted">
        Free accounts get the top {FREE_LIMIT_COPY} sellers. Upgrade with
        Bitcoin or Lightning to open the full board.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/plus"
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          Upgrade to Plus
        </Link>
        <Link
          href="/markets"
          className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold hover:bg-dash-elevated"
        >
          Free markets
        </Link>
      </div>
    </div>
  );
}

const FREE_LIMIT_COPY = 10;
