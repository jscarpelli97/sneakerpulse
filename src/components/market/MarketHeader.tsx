import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MobileNavMenu } from "@/components/layout/MobileNavMenu";
import { SpiTicker } from "@/components/market/SpiTicker";
import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";
import type { SneakerMarket, UpstreamStatus } from "@/types/market";
import { changeClass, formatChange, formatMoney } from "@/utils/format";

const FEED_LABEL: Record<UpstreamStatus, string> = {
  live: "Live asks",
  degraded: "Degraded feed",
  cached: "Daily snapshot",
  offline: "Offline",
};

const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/mine", label: "Mine" },
  { href: "/plus", label: "Plus" },
  { href: "/about", label: "About" },
] as const;

export function MarketHeader({
  market,
  upstreamStatus,
  statusBadge,
}: {
  market: SneakerMarket;
  upstreamStatus: UpstreamStatus;
  statusBadge?: ReactNode;
}) {
  const today = formatChange(
    market.changeToday?.absolute,
    market.changeToday?.percent,
  );
  const feedLive = upstreamStatus === "live";

  return (
    <header className="sticky top-0 z-40 border-b border-dash-border/90 bg-dash-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="shrink-0 font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-dash-text transition-opacity hover:opacity-90 sm:text-xl"
          >
            <span className="sm:hidden">{BRAND_SHORT}</span>
            <span className="hidden sm:inline">{BRAND_NAME}</span>
          </Link>
          <SpiTicker className="min-w-0 truncate" />
          <nav className="hidden items-center gap-1 text-sm font-medium text-dash-muted lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 hover:bg-dash-elevated hover:text-dash-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {statusBadge}
          <div className="hidden items-center gap-2 rounded-full border border-dash-border bg-dash-elevated/80 px-3 py-1.5 text-xs font-medium text-dash-muted sm:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${feedLive ? "animate-blink bg-dash-up" : "bg-dash-faint"}`}
            />
            {FEED_LABEL[upstreamStatus]}
          </div>
          <div className="hidden text-right text-xs text-dash-muted sm:block sm:text-sm">
            <span className="font-[family-name:var(--font-plex-mono)] font-semibold text-dash-text">
              {market.ticker}
            </span>
            <span className="mx-1.5 text-dash-faint sm:mx-2">·</span>
            <span className={changeClass(market.changeToday?.percent)}>
              {today.percent}
            </span>
            <span className="ml-1.5 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-dash-text sm:ml-2">
              {formatMoney(market.price)}
            </span>
          </div>
          <MobileNavMenu />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-3 pb-4 pt-1 sm:gap-4 sm:px-6 sm:pb-5 md:flex-row md:items-center md:justify-between md:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-dash-border bg-dash-elevated sm:h-16 sm:w-16 md:h-20 md:w-20">
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
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
              {market.brand} · {market.year}
            </p>
            <h1 className="truncate font-[family-name:var(--font-syne)] text-xl font-extrabold tracking-tight text-dash-text sm:text-2xl md:text-3xl">
              {market.name}
            </h1>
            <p className="mt-1 truncate text-sm text-dash-muted">
              <span className="font-[family-name:var(--font-plex-mono)] font-semibold text-dash-text sm:hidden">
                {market.ticker}
                <span className="mx-1.5 text-dash-faint">·</span>
                <span className={changeClass(market.changeToday?.percent)}>
                  {today.percent}
                </span>
                <span className="ml-1.5 tabular-nums text-dash-text">
                  {formatMoney(market.price)}
                </span>
              </span>
              <span className="hidden sm:inline">
                {market.ticker}
                <span className="mx-2 text-dash-faint">·</span>
                {market.styleCode}
                <span className="mx-2 text-dash-faint">·</span>
                {market.colorway}
              </span>
            </p>
          </div>
        </div>
        <a
          href={market.stockxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-dash-border bg-dash-elevated px-4 py-2 text-sm font-semibold text-dash-text hover:border-dash-muted hover:bg-dash-panel"
        >
          View on StockX
        </a>
      </div>
    </header>
  );
}
