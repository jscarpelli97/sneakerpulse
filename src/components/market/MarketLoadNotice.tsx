import Link from "next/link";

type MarketLoadNoticeProps = {
  sneakerName?: string;
  stockxUrl?: string;
  styleCode?: string;
};

/** Customer-safe empty state when a market page cannot load live/snapshot data. */
export function MarketLoadNotice({
  sneakerName,
  stockxUrl,
  styleCode,
}: MarketLoadNoticeProps) {
  return (
    <section className="dash-card px-4 py-5 md:px-5">
      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
        Market data
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-dash-text">
        Couldn&apos;t load this pair
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dash-muted">
        {sneakerName
          ? `We hit a snag loading asks for ${sneakerName}. Try again in a moment, or browse other markets.`
          : "We hit a snag loading this market. Try again in a moment, or browse other markets."}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/markets"
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          Browse markets
        </Link>
        {stockxUrl ? (
          <a
            href={stockxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
          >
            View on StockX
          </a>
        ) : null}
      </div>
      {sneakerName && styleCode ? (
        <p className="mt-4 text-xs text-dash-faint">
          {sneakerName} · {styleCode}
        </p>
      ) : null}
    </section>
  );
}
