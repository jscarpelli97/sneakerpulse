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
    <header className="border-b border-ink/10 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-ink"
          >
            SneakerPulse
          </Link>
          <span className="hidden text-ink/25 sm:inline">/</span>
          <nav className="hidden items-center gap-3 text-sm font-medium text-ink-soft sm:flex">
            <Link href="/" className="hover:text-ink">
              Markets
            </Link>
            <Link href="/compare" className="hover:text-ink">
              Compare
            </Link>
            <Link href="/alerts" className="hover:text-ink">
              Alerts
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge}
          <div className="hidden items-center gap-2 rounded-sm border border-ink/10 bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft sm:flex">
            <span
              className={`h-1.5 w-1.5 ${live ? "animate-blink bg-up" : "bg-ink/30"}`}
            />
            {live ? "StockX live via KicksDB" : "Waiting for StockX credentials"}
          </div>
        </div>
        <div className="text-right text-xs text-ink-soft md:text-sm">
          <span className="font-semibold text-ink">{market.ticker}</span>
          <span className="mx-2 text-ink/25">·</span>
          <span className={changeClass(market.changeToday?.percent)}>
            {today.percent}
          </span>
          <span className="ml-2 font-semibold text-ink">
            {formatMoney(market.price)}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-5 pt-2 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-sm bg-paper-deep md:h-20 md:w-20">
            <Image
              src={market.image}
              alt={market.name}
              fill
              className="object-contain p-1"
              sizes="80px"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
              {market.brand} · {market.year}
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              {market.name}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
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
          className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          View on StockX
        </a>
      </div>
    </header>
  );
}
