import Image from "next/image";
import Link from "next/link";
import type { CatalogQuote } from "@/services/market/getCatalogQuotes";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

export function MarketsHero({
  featured,
  modeBadge,
  modeSubtitle,
  totalMarkets,
}: {
  featured: CatalogQuote;
  modeBadge: string;
  modeSubtitle: string;
  totalMarkets: number;
}) {
  const hasPrice = featured.price != null;
  const hasOrders = featured.weeklyOrders != null;
  const hasRank = featured.rank != null;

  return (
    <section className="dash-card animate-rise relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(42,49,66,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,49,66,0.55) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-11 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center lg:gap-12 lg:px-10 lg:py-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-dash-border bg-dash-elevated/90 px-3 py-1 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  modeBadge === "Live"
                    ? "animate-blink bg-dash-up"
                    : modeBadge === "Snapshot" || modeBadge === "Cached"
                      ? "bg-dash-accent"
                      : "bg-dash-faint"
                }`}
              />
              {modeSubtitle}
            </span>
            <span className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              {modeBadge === "Live" ? "StockX via KicksDB" : "Daily catalog"}
            </span>
          </div>

          <h1 className="mt-5 font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-[1.02] tracking-tight text-dash-text sm:text-5xl lg:text-[3.5rem]">
            SPI Markets
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-dash-muted sm:text-lg">
            Ask board and premium index for sneakers. StockX tape across the top{" "}
            {totalMarkets} sellers — homepage highlights the top 10.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/sneakers/${featured.slug}`}
              className="inline-flex items-center rounded-xl bg-dash-accent px-5 py-3 text-sm font-semibold text-dash-bg shadow-[0_8px_24px_rgba(212,160,23,0.22)] hover:brightness-110 active:translate-y-px"
            >
              Open {featured.ticker}
            </Link>
            <Link
              href="/markets"
              className="inline-flex items-center rounded-xl border border-dash-border bg-dash-elevated px-5 py-3 text-sm font-semibold text-dash-text hover:border-dash-muted hover:bg-dash-panel"
            >
              Browse all {totalMarkets}
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-dash-border bg-dash-elevated/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
                Featured · {featured.ticker}
              </p>
              <p className="mt-1 truncate font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text">
                {featured.name}
              </p>
              <p className="mt-1 text-sm text-dash-muted">
                {featured.brand} · {featured.styleCode} · {featured.year}
              </p>
            </div>
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-dash-border bg-dash-panel transition-transform duration-300 hover:scale-[1.03] sm:h-24 sm:w-24">
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
                {hasPrice ? formatMaybeMoney(featured.price) : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                Weekly orders
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tabular-nums text-dash-text">
                {hasOrders ? formatNumber(featured.weeklyOrders!) : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                StockX rank
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-lg font-medium tabular-nums text-dash-muted">
                {hasRank ? `#${formatNumber(featured.rank!)}` : "—"}
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
            className="mt-5 flex w-full items-center justify-center rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-link hover:bg-dash-panel"
          >
            View full market →
          </Link>
        </aside>
      </div>
    </section>
  );
}
