import Link from "next/link";

/** Soft landing while StockX API access is pending — no paid pitch. */
export function PlusPausedNotice() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
          Membership
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          Plus is on pause
        </h1>
        <p className="text-lg leading-relaxed text-dash-muted">
          We&apos;re waiting on StockX API access before selling or marketing a
          paid tier that leans on their market data. Until that&apos;s clear,
          SPI Markets stays free for now — no Plus checkout, no upsells.
        </p>
      </header>

      <section className="rounded-2xl border border-dash-border bg-dash-elevated/30 px-5 py-5">
        <p className="text-sm leading-relaxed text-dash-muted">
          Official StockX Developer API access is pending. Daily snapshot data
          keeps the terminal usable in the meantime. Not affiliated with
          StockX.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/markets"
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          Browse markets
        </Link>
        <Link
          href="/about"
          className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold hover:bg-dash-elevated"
        >
          How it works
        </Link>
      </div>
    </div>
  );
}
