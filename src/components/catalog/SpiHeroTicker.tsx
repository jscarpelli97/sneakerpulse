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
      : `${vsPeak > 0 ? "+" : ""}${vsPeak.toFixed(0)}% vs hype peak`;
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
    <aside className="flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            {INDEX_NAME} · daily tape
          </p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-[family-name:var(--font-plex-mono)] tabular-nums">
            <span className="text-2xl font-semibold text-dash-text sm:text-3xl">
              {formatIndexLevel(index.level)}
            </span>
            <span className={`text-sm font-semibold sm:text-base ${changeClass(dayPct)}`}>
              {dayLabel}
            </span>
            <span className="text-xs text-dash-faint">today</span>
          </div>
          <p className="mt-1 text-xs text-dash-muted">
            {formatShortDate(index.asOf)} · 100 = retail · updates daily
          </p>
        </div>
        {vsPeakLabel ? (
          <div className="rounded-xl border border-dash-border bg-dash-panel/80 px-3 py-2 text-right">
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
              vs 2020–21
            </p>
            <p
              className={`mt-0.5 font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums ${
                (vsPeak ?? 0) >= 0 ? "text-dash-up" : "text-dash-down"
              }`}
            >
              {vsPeakLabel}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-3 sm:grid-cols-[minmax(96px,0.32fr)_minmax(0,1fr)]">
        <div className="flex flex-col overflow-hidden rounded-xl border border-dash-up/25 bg-[rgba(38,166,154,0.06)]">
          <div className="border-b border-dash-border/80 px-3 py-2">
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-up">
              Hype · 2020–21
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-plex-mono)] text-lg font-semibold tabular-nums text-dash-text">
              {peak != null ? formatIndexLevel(peak) : "—"}
            </p>
            <p className="text-[11px] text-dash-muted">
              peak · {formatShortDate(index.peakDate)}
            </p>
          </div>
          <div className="relative min-h-[110px] flex-1 sm:min-h-0">
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
                className="h-full min-h-[110px] w-full"
              />
            ) : (
              <div className="flex h-full min-h-[110px] items-center justify-center px-3 text-center text-xs text-dash-faint">
                Boom tape unavailable
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-dash-accent/30 bg-[rgba(212,160,23,0.06)]">
          <div className="border-b border-dash-border/80 px-3 py-2">
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-accent">
              Now · tracking
            </p>
            <p className="mt-0.5 text-[11px] text-dash-muted">
              {liveWindowLabel(live)}
            </p>
          </div>
          <div className="relative min-h-[160px] flex-1 sm:min-h-[200px]">
            {hasLive ? (
              <LightweightPriceChart
                data={live}
                up={liveUp}
                showTime
                referenceLevel={index.baseLevel}
                referenceTitle="Retail"
                priceRange={priceRange}
                className="h-full min-h-[160px] w-full sm:min-h-[200px]"
              />
            ) : (
              <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm text-dash-muted">
                First SPI prints land as the daily tape grows.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dash-border pt-3">
        <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
          Same scale · boom vs now
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
