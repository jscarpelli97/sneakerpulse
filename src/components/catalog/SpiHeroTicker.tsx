"use client";

import Link from "next/link";
import { LightweightPriceChart } from "@/charts/LightweightPriceChart";
import { INDEX_NAME } from "@/lib/brand";
import type { ChartPoint, MarketIndex } from "@/types/market";
import { changeClass } from "@/utils/format";

function formatIndexLevel(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDayPercent(percent: number | null | undefined) {
  if (percent == null || !Number.isFinite(percent)) return "—";
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function formatShortDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function offPeakPercent(level: number, peak: number | null) {
  if (peak == null || !(peak > 0)) return null;
  return ((level - peak) / peak) * 100;
}

function liveWindowLabel(live: ChartPoint[]) {
  if (live.length < 1) return "Tracking live";
  const first = formatShortDate(live[0]?.date);
  if (live.length === 1) return `Since ${first}`;
  const last = formatShortDate(live[live.length - 1]?.date);
  return `${first} → ${last}`;
}

export function SpiHeroTicker({ index }: { index: MarketIndex }) {
  const live = index.liveSeries ?? [];
  const boom = index.historicalSeries ?? [];
  const dayPct = index.changeToday?.percent ?? null;
  const dayLabel = formatDayPercent(dayPct);
  const peak = index.peakLevel;
  const vsPeak = offPeakPercent(index.level, peak);
  const vsPeakLabel =
    vsPeak == null
      ? null
      : `${vsPeak > 0 ? "+" : ""}${vsPeak.toFixed(0)}% from hype peak`;
  const liveUp =
    live.length >= 2
      ? live[live.length - 1].price >= live[0].price
      : (dayPct ?? 0) >= 0;
  const hasLive = live.length >= 1;
  const hasBoom = boom.length >= 2;
  const allPrices = [
    ...live.map((p) => p.price),
    ...boom.map((p) => p.price),
    index.level,
    index.baseLevel,
    peak ?? 0,
  ].filter((v) => v > 0);
  const sharedMin = allPrices.length
    ? Math.min(...allPrices) * 0.92
    : index.baseLevel * 0.8;
  const sharedMax = allPrices.length
    ? Math.max(...allPrices) * 1.06
    : index.baseLevel * 1.2;
  const priceRange = { min: sharedMin, max: sharedMax };

  return (
    <aside className="flex h-full flex-col gap-5 rounded-2xl border border-dash-border bg-dash-elevated/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            {INDEX_NAME} · daily index
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-[family-name:var(--font-plex-mono)] tabular-nums">
            <span className="text-3xl font-semibold tracking-tight text-dash-text sm:text-4xl">
              {formatIndexLevel(index.level)}
            </span>
            <span className={`text-base font-semibold ${changeClass(dayPct)}`}>
              {dayLabel}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-dash-muted">
            {formatShortDate(index.asOf)} · 100 = retail
          </p>
        </div>
        {vsPeakLabel ? (
          <p
            className={`font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums ${
              (vsPeak ?? 0) >= 0 ? "text-dash-up" : "text-dash-down"
            }`}
          >
            {vsPeakLabel}
          </p>
        ) : null}
      </div>

      {/* Boom reference — slim strip, not fighting the live chart for width */}
      <div className="overflow-hidden rounded-xl border border-dash-up/20 bg-[rgba(38,166,154,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
          <div>
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-up">
              Hype reference · 2020–21
            </p>
            <p className="mt-1 font-[family-name:var(--font-plex-mono)] text-sm text-dash-muted">
              Peak{" "}
              <span className="font-semibold tabular-nums text-dash-text">
                {peak != null ? formatIndexLevel(peak) : "—"}
              </span>
              <span className="text-dash-faint">
                {" "}
                · {formatShortDate(index.peakDate)}
              </span>
            </p>
          </div>
        </div>
        <div className="relative h-[72px] w-full sm:h-[84px]">
          {hasBoom ? (
            <LightweightPriceChart
              data={boom}
              up
              eraColors
              showTime={false}
              referenceLevel={index.baseLevel}
              referenceTitle="100"
              peakLevel={peak ?? undefined}
              priceRange={priceRange}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-dash-faint">
              Boom history unavailable
            </div>
          )}
        </div>
      </div>

      {/* Live tracking — main stage */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-dash-accent/25 bg-[rgba(212,160,23,0.05)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3">
          <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-accent">
            Now · tracking
          </p>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-muted">
            {liveWindowLabel(live)}
          </p>
        </div>
        <div className="relative mt-1 min-h-[220px] flex-1 sm:min-h-[260px]">
          {hasLive ? (
            <LightweightPriceChart
              data={live}
              up={liveUp}
              showTime
              referenceLevel={index.baseLevel}
              referenceTitle="Retail"
              priceRange={priceRange}
              className="h-full min-h-[220px] w-full sm:min-h-[260px]"
            />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-sm text-dash-muted">
              First SPI prints land as the daily series grows.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
          Same Y scale · updates daily
        </p>
        <Link
          href="/spi"
          className="text-sm font-semibold text-dash-link hover:underline"
        >
          How {INDEX_NAME} works →
        </Link>
      </div>
    </aside>
  );
}
