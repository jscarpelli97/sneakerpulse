import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SneakerMarket } from "@/types/market";
import { changeClass, formatChange, formatMoney } from "@/utils/format";

export function MarketHeader({
  market,
  live,
  statusBadge,
}: {
  market: SneakerMarket;
  live: boolean;
  statusBadge?: ReactNode;
}) {
  const today = formatChange(
    market.changeToday?.absolute,
    market.changeToday?.percent,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-ink transition-opacity hover:opacity-80"
          >
            SneakerPulse
          </Link>
          <span className="hidden text-ink/25 sm:inline">/</span>
          <nav className="hidden items-center gap-1 text-sm font-medium text-ink-soft sm:flex">
            {[
              { href: "/", label: "Markets" },
              { href: "/compare", label: "Compare" },
              { href: "/alerts", label: "Alerts" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 hover:bg-paper hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge}
          <div className="hidden items-center gap-2 rounded-full border border-ink/8 bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft sm:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${live ? "animate-blink bg-up" : "bg-ink/30"}`}
            />
            {live ? "StockX live via KicksDB" : "Waiting for StockX credentials"}
          </div>
        </div>
        <div className="hidden text-right text-xs text-ink-soft md:block md:text-sm">
          <span className="font-[family-name:var(--font-plex-mono)] font-semibold text-ink">
            {market.ticker}
          </span>
          <span className="mx-2 text-ink/25">·</span>
          <span className={changeClass(market.changeToday?.percent)}>
            {today.percent}
          </span>
          <span className="ml-2 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-ink">
            {formatMoney(market.price)}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-5 pt-1 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-ink/8 bg-paper-deep shadow-[var(--shadow-xs)] md:h-20 md:w-20">
            <Image
              src={market.image}
              alt={market.name}
              fill
              className="object-contain p-1.5"
              sizes="80px"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">
              {market.brand} · {market.year}
            </p>
            <h1 className="truncate font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              {market.name}
            </h1>
            <p className="mt-1 truncate text-sm text-ink-soft">
              {market.ticker}
              <span className="mx-2 text-ink/25">·</span>
              {market.styleCode}
              <span className="mx-2 text-ink/25">·</span>
              {market.colorway}
            </p>
          </div>
        </div>
        <a
          href={market.stockxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-[var(--shadow-xs)] hover:border-ink/20 hover:shadow-[var(--shadow-sm)]"
        >
          View on StockX
        </a>
      </div>
    </header>
  );
}
