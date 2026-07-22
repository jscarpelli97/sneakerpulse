"use client";

import { useMemo, useState } from "react";
import { CHART_RANGES } from "@/charts/constants";
import { LightweightPriceChart } from "@/charts/LightweightPriceChart";
import type { ChartPoint, MarketIndex } from "@/types/market";
import { formatNumber } from "@/utils/format";

type Range = (typeof CHART_RANGES)[number];

function filterByRange(points: ChartPoint[], range: Range): ChartPoint[] {
  if (points.length === 0) return points;
  if (range === "ALL") return points;

  const last = Date.parse(points[points.length - 1].date.slice(0, 10));
  const dayMs = 24 * 60 * 60 * 1000;
  const lookback: Record<Exclude<Range, "ALL">, number> = {
    "1D": 1,
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "1Y": 365,
  };
  const from = last - lookback[range] * dayMs;
  const filtered = points.filter(
    (point) => Date.parse(point.date.slice(0, 10)) >= from,
  );
  return filtered.length > 1 ? filtered : points.slice(-2);
}

/** Pad a single live tip so Lightweight Charts can draw the present segment. */
function padLiveTip(points: ChartPoint[]): ChartPoint[] {
  if (points.length !== 1) return points;
  const tip = points[0];
  const ms = Date.parse(`${tip.date}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return points;
  const prev = new Date(ms - 86_400_000).toISOString().slice(0, 10);
  return [
    { date: prev, price: tip.price, orders: 0 },
    tip,
  ];
}

function formatIndexLevel(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatVsRetail(level: number, baseLevel: number) {
  const delta = level - baseLevel;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}% vs retail`;
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

export function MarketIndexCard({ index }: { index: MarketIndex }) {
  const [range, setRange] = useState<Range>("ALL");
  const [showMethod, setShowMethod] = useState(false);

  const { primary, secondary, gapNote, dualEra } = useMemo(() => {
    if (range === "ALL" || range === "1Y") {
      const hist = filterByRange(index.historicalSeries, range);
      const live = padLiveTip(filterByRange(index.liveSeries, range));
      const hasGap =
        hist.length >= 2 &&
        live.length >= 1 &&
        hist.at(-1)!.date.slice(0, 4) !== live[0]!.date.slice(0, 4);
      return {
        primary: hist.length >= 2 ? hist : filterByRange(index.series, range),
        secondary: hasGap || live.length >= 2 ? live : undefined,
        gapNote: hasGap
          ? `Quiet years left blank · ${hist.at(-1)!.date.slice(0, 4)}–${live.at(-1)!.date.slice(0, 4)}`
          : null,
        dualEra: hasGap || live.length >= 2,
      };
    }
    // Short ranges must never bridge the 2022–2025 gap by falling back to
    // the concatenated series (that drew a fake crash from ~196 → ~94).
    const live = padLiveTip(filterByRange(index.liveSeries, range));
    return {
      primary: live.length >= 2 ? live : [],
      secondary: undefined,
      gapNote:
        live.length < 2
          ? "Need two live daily captures for this range — use ALL to see the hype cycle"
          : null,
      dualEra: false,
    };
  }, [index, range]);

  const hasSeries = primary.length > 1;
  const tip = secondary?.at(-1) ?? primary.at(-1);
  const start = primary[0];
  const isUp = Boolean(tip && start && tip.price >= start.price);
  const peak = index.peakLevel;
  const offPeak = offPeakPercent(index.level, peak);
  const boomVsRetail = peak != null ? formatVsRetail(peak, index.baseLevel) : null;
  const nowVsRetail = formatVsRetail(index.level, index.baseLevel);
  const nowTone =
    index.level >= index.baseLevel ? "text-dash-up" : "text-dash-down";
  const offPeakLabel =
    offPeak == null
      ? null
      : `${offPeak > 0 ? "+" : ""}${offPeak.toFixed(0)}% from boom peak`;

  return (
    <section className="dash-card animate-rise stagger-2 overflow-hidden">
      <div className="border-b border-dash-border px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
            SneakerPulse Index
          </p>
          <span className="rounded-full border border-dash-border bg-dash-elevated px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted">
            {index.ticker}
          </span>
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
            100 = retail
          </span>
        </div>

        <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-dash-text sm:text-3xl">
          From peak hype to below retail
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dash-muted sm:text-base">
          2020–21 pushed StockX asks to roughly double retail. Today’s basket
          sits under retail — the quiet after the boom, not a continuous crash
          line.
        </p>

        <div className="mt-6 grid gap-0 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
          <div className="relative overflow-hidden rounded-2xl border border-dash-up/25 bg-[rgba(38,166,154,0.07)] px-4 py-4 sm:px-5 sm:py-5">
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.16em] text-dash-up">
              Boom peak
            </p>
            <p className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tabular-nums tracking-tight text-dash-text sm:text-5xl">
              {peak != null ? formatIndexLevel(peak) : "—"}
            </p>
            <p className="mt-2 font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums text-dash-up">
              {boomVsRetail ?? "—"}
            </p>
            <p className="mt-1 text-sm text-dash-muted">
              {formatShortDate(index.peakDate)}
            </p>
          </div>

          <div className="flex items-center justify-center py-3 sm:px-4 sm:py-0">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="hidden h-px w-8 bg-dash-border sm:block" aria-hidden />
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-semibold uppercase tracking-[0.12em] text-dash-accent">
                {offPeakLabel ?? "→"}
              </p>
              <span className="hidden h-px w-8 bg-dash-border sm:block" aria-hidden />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-dash-accent/30 bg-[rgba(212,160,23,0.08)] px-4 py-4 sm:px-5 sm:py-5">
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.16em] text-dash-accent">
              Today
            </p>
            <p className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tabular-nums tracking-tight text-dash-text sm:text-5xl">
              {formatIndexLevel(index.level)}
            </p>
            <p
              className={`mt-2 font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums ${nowTone}`}
            >
              {nowVsRetail}
            </p>
            <p className="mt-1 text-sm text-dash-muted">
              {formatShortDate(index.asOf)}
              {index.change30d
                ? ` · 30d ${index.change30d.percent > 0 ? "+" : ""}${index.change30d.percent.toFixed(1)}%`
                : ""}
              {" · "}
              <a
                href="/#plus"
                className="text-dash-faint underline-offset-2 hover:text-dash-accent hover:underline"
              >
                live tip · Plus soon
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="px-2 py-4 md:px-5 md:py-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex flex-wrap items-center gap-3 text-sm text-dash-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-dash-up" aria-hidden />
              Hype cycle · 2020–21
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-dash-accent" aria-hidden />
              Live SPI · now
            </span>
            <span className="inline-flex items-center gap-1.5 text-dash-faint">
              <span
                className="h-px w-4 border-t border-dashed border-dash-muted"
                aria-hidden
              />
              Retail = 100
            </span>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-dash-elevated p-1">
            {CHART_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  range === item
                    ? "bg-dash-accent text-dash-bg"
                    : "text-dash-muted hover:bg-dash-panel hover:text-dash-text"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {gapNote ? (
          <p className="mb-3 px-2 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.08em] text-dash-faint">
            {gapNote}
          </p>
        ) : null}

        <div className="relative h-[280px] w-full md:h-[360px]">
          {hasSeries ? (
            <LightweightPriceChart
              data={primary}
              secondaryData={secondary}
              up={isUp}
              showTime
              eraColors={dualEra}
              referenceLevel={index.baseLevel}
              referenceTitle="Retail"
              peakLevel={
                dualEra && peak != null ? peak : undefined
              }
              peakTitle="Boom peak"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-dash-border bg-dash-elevated/40 text-sm text-dash-muted">
              No index points to plot yet.
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-dash-border px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setShowMethod((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={showMethod}
        >
          <span className="font-[family-name:var(--font-syne)] text-base font-bold tracking-tight text-dash-text">
            How SPI works
          </span>
          <span className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted">
            {showMethod ? "Hide" : "Show"}
          </span>
        </button>

        {showMethod ? (
          <div className="mt-4 space-y-4 border-t border-dash-border pt-4">
            <p className="text-sm leading-relaxed text-dash-muted">
              Volume-weighted ask ÷ retail × 100. Teal is real daily premium
              tape from Nov 2020–Dec 2021. Gold is live SPI from daily
              snapshots. The middle years stay empty because there is no free
              public daily feed — we do not invent a crash line across that gap.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                  Basket
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-dash-muted">
                  {index.howItWorks.selection}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                  Calculation
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-dash-muted">
                  {index.howItWorks.calculation}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                  Updates
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-dash-muted">
                  {index.howItWorks.updates}
                </p>
              </div>
            </div>
            {index.brands.length > 0 ? (
              <div>
                <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                  Active basket · {formatNumber(index.constituents)} models ·{" "}
                  {index.brandCount ?? index.brands.length} brands
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {index.brands.map((row) => (
                    <span
                      key={row.brand}
                      className="rounded-lg border border-dash-border bg-dash-elevated/60 px-2 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.08em] text-dash-muted"
                    >
                      {row.brand}
                      <span className="text-dash-faint"> · {row.models}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {index.citation ? (
              <p className="text-xs text-dash-faint">
                Boom-era premiums via{" "}
                <a
                  href={index.citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dash-link underline-offset-2 hover:underline"
                >
                  Flurin17
                </a>
                .
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-dash-faint">
            Ask ÷ retail × 100 · {formatNumber(index.constituents || 0)} models
            in basket · gap years intentionally blank
          </p>
        )}
      </div>
    </section>
  );
}
