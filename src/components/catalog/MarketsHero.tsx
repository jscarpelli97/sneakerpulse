import Link from "next/link";
import { SpiHeroTicker } from "@/components/catalog/SpiHeroTicker";
import {
  BRAND_HERO_LINE,
  BRAND_NAME,
  BRAND_VALUE_LINE,
  INDEX_NAME,
} from "@/lib/brand";
import type { MarketIndex } from "@/types/market";

export function MarketsHero({
  index,
  modeBadge,
  modeSubtitle,
  totalMarkets,
}: {
  index: MarketIndex;
  modeBadge: string;
  modeSubtitle: string;
  totalMarkets: number;
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
      <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-11 lg:grid-cols-[minmax(0,0.9fr)_minmax(400px,1.15fr)] lg:items-stretch lg:gap-12 lg:px-10 lg:py-14">
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
            {BRAND_NAME}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-dash-muted sm:text-lg">
            {BRAND_HERO_LINE}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-dash-faint sm:text-base">
            {BRAND_VALUE_LINE}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/markets"
              className="inline-flex items-center rounded-xl bg-dash-accent px-5 py-3 text-sm font-semibold text-dash-bg shadow-[0_8px_24px_rgba(212,160,23,0.22)] hover:brightness-110 active:translate-y-px"
            >
              Browse markets
            </Link>
            <Link
              href="/plus"
              className="inline-flex items-center rounded-xl border border-dash-border bg-dash-elevated px-5 py-3 text-sm font-semibold text-dash-text hover:border-dash-muted hover:bg-dash-panel"
            >
              Explore Plus
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center rounded-xl border border-dash-border px-5 py-3 text-sm font-semibold text-dash-muted hover:border-dash-muted hover:bg-dash-elevated hover:text-dash-text"
            >
              Open portfolio
            </Link>
          </div>
          <p className="mt-3 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-faint">
            {totalMarkets} pairs on the board · {INDEX_NAME} tape updates daily
          </p>
        </div>

        <SpiHeroTicker index={index} />
      </div>
    </section>
  );
}
