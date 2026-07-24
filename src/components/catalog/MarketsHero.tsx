import Link from "next/link";
import { SpiHeroTicker } from "@/components/catalog/SpiHeroTicker";
import {
  BRAND_NAME,
  INDEX_EXPANSION,
  INDEX_NAME,
} from "@/lib/brand";
import { FREE_CATALOG_LIMIT } from "@/lib/plus/access";
import type { MarketIndex } from "@/types/market";

export function MarketsHero({
  index,
  modeBadge,
  modeSubtitle,
}: {
  index: MarketIndex;
  modeBadge: string;
  modeSubtitle: string;
  /** @deprecated kept for call-site compat */
  totalMarkets?: number;
}) {
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
      <div className="relative grid gap-6 px-4 py-6 sm:gap-8 sm:px-8 sm:py-11 lg:grid-cols-[minmax(0,0.9fr)_minmax(400px,1.15fr)] lg:items-stretch lg:gap-12 lg:px-10 lg:py-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex max-w-full items-center gap-2 truncate rounded-full border border-dash-border bg-dash-elevated/90 px-3 py-1 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-muted">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  modeBadge === "Live"
                    ? "animate-blink bg-dash-up"
                    : modeBadge === "Snapshot" || modeBadge === "Cached"
                      ? "bg-dash-accent"
                      : "bg-dash-faint"
                }`}
              />
              <span className="truncate">{modeSubtitle}</span>
            </span>
            <span className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              Free · {INDEX_NAME} + top {FREE_CATALOG_LIMIT}
            </span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-extrabold leading-[1.05] tracking-tight text-dash-text sm:mt-5 sm:text-5xl lg:text-[3.5rem]">
            {BRAND_NAME}
          </h1>
          <p className="mt-2 font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-[0.14em] text-dash-accent sm:mt-3 sm:text-[15px]">
            {INDEX_NAME} = {INDEX_EXPANSION}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-dash-muted sm:mt-4 sm:text-lg">
            One number for how expensive the sneaker market is vs retail — then
            a board of real asks so you can act on it. Not another StockX tab.
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-dash-faint sm:mt-3 sm:text-base">
            <span className="font-[family-name:var(--font-plex-mono)] text-dash-text">
              100 ≈ retail
            </span>
            . StockX shows a listing. We show if the market is cheap or rich,
            if your size is a deal, and what you own is worth.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
            <Link
              href="#spi"
              className="inline-flex items-center rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg shadow-[0_8px_24px_rgba(212,160,23,0.22)] hover:brightness-110 active:translate-y-px sm:px-5 sm:py-3"
            >
              What {INDEX_NAME} is today
            </Link>
            <Link
              href="#board"
              className="inline-flex items-center rounded-xl border border-dash-border bg-dash-elevated px-4 py-2.5 text-sm font-semibold text-dash-text hover:border-dash-muted hover:bg-dash-panel sm:px-5 sm:py-3"
            >
              Top {FREE_CATALOG_LIMIT} asks
            </Link>
            <Link
              href="/plus"
              className="inline-flex items-center rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:border-dash-muted hover:bg-dash-elevated hover:text-dash-text sm:px-5 sm:py-3"
            >
              Plus tools
            </Link>
          </div>
        </div>

        <SpiHeroTicker index={index} />
      </div>
    </section>
  );
}
