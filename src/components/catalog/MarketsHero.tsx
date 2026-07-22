import Image from "next/image";
import Link from "next/link";
import type { CatalogQuote } from "@/lib/market/getCatalogQuotes";
import { formatMaybeMoney, formatNumber } from "@/lib/format";

export function MarketsHero({
  featured,
  liveCount,
  totalMarkets,
}: {
  featured: CatalogQuote;
  liveCount: number;
  totalMarkets: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-dash-border bg-dash-panel">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(42,49,66,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,49,66,0.55) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center lg:gap-10 lg:px-10 lg:py-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-dash-border bg-dash-elevated px-3 py-1 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-muted">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-dash-up" />
              {liveCount}/{totalMarkets} markets live
            </span>
            <span className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              StockX via KicksDB
            </span>
          </div>

          <h1 className="mt-5 font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-[1.05] tracking-tight text-dash-text sm:text-5xl lg:text-6xl">
            SneakerPulse
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-dash-muted sm:text-lg">
            Terminal-grade StockX market views. Track lowest asks, volume, and
            size ladders across the watchlist — TradingView layout, exchange
            discipline.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/sneakers/${featured.slug}`}
              className="inline-flex items-center rounded-xl bg-dash-accent px-5 py-3 text-sm font-semibold text-dash-bg transition-opacity hover:opacity-90"
            >
              Open {featured.ticker}
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center rounded-xl border border-dash-border bg-dash-elevated px-5 py-3 text-sm font-semibold text-dash-text transition-colors hover:border-dash-muted"
            >
              Compare markets
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-dash-border bg-dash-elevated/80 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
                Featured · {featured.ticker}
              </p>
              <p className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text">
                {featured.name}
              </p>
              <p className="mt-1 text-sm text-dash-muted">
                {featured.brand} · {featured.styleCode} · {featured.year}
              </p>
            </div>
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-dash-border bg-dash-panel sm:h-24 sm:w-24">
              <Image
                src={featured.fallbackImage}
                alt={featured.name}
                fill
                className="object-contain p-2"
                sizes="96px"
                priority
              />
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-dash-border pt-4">
            <div>
              <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                Lowest ask
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tabular-nums text-dash-text">
                {featured.live ? formatMaybeMoney(featured.price) : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                Weekly orders
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tabular-nums text-dash-text">
                {featured.live && featured.weeklyOrders != null
                  ? formatNumber(featured.weeklyOrders)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                StockX rank
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-lg font-medium tabular-nums text-dash-muted">
                {featured.live && featured.rank != null
                  ? `#${formatNumber(featured.rank)}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                Retail
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-lg font-medium tabular-nums text-dash-muted">
                {formatMaybeMoney(featured.retail)}
              </dd>
            </div>
          </dl>

          <Link
            href={`/sneakers/${featured.slug}`}
            className="mt-5 flex w-full items-center justify-center rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-link transition-colors hover:bg-dash-panel"
          >
            View full market →
          </Link>
        </aside>
      </div>
    </section>
  );
}
