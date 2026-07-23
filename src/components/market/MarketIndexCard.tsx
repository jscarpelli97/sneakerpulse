"use client";

import { useState } from "react";
import { INDEX_LONG_NAME, INDEX_NAME } from "@/lib/brand";
import type { MarketIndex } from "@/types/market";
import { formatNumber } from "@/utils/format";

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
  const [showMethod, setShowMethod] = useState(false);

  const peak = index.peakLevel;
  const offPeak = offPeakPercent(index.level, peak);
  const boomVsRetail =
    peak != null ? formatVsRetail(peak, index.baseLevel) : null;
  const nowVsRetail = formatVsRetail(index.level, index.baseLevel);
  const nowTone =
    index.level >= index.baseLevel ? "text-dash-up" : "text-dash-down";
  const offPeakLabel =
    offPeak == null
      ? null
      : `${offPeak > 0 ? "+" : ""}${offPeak.toFixed(0)}% from boom peak`;

  return (
    <section className="dash-card animate-rise stagger-2 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
            {INDEX_LONG_NAME}
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
          sits under retail — the quiet after the boom.
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
              <span
                className="hidden h-px w-8 bg-dash-border sm:block"
                aria-hidden
              />
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-semibold uppercase tracking-[0.12em] text-dash-accent">
                {offPeakLabel ?? "→"}
              </p>
              <span
                className="hidden h-px w-8 bg-dash-border sm:block"
                aria-hidden
              />
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
            </p>
          </div>
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
            How {INDEX_NAME} works
          </span>
          <span className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted">
            {showMethod ? "Hide" : "Show"}
          </span>
        </button>

        {showMethod ? (
          <div className="mt-4 space-y-4 border-t border-dash-border pt-4">
            <p className="text-sm leading-relaxed text-dash-muted">
              Volume-weighted ask ÷ retail × 100. Boom peak uses real daily
              premium tape from Nov 2020–Dec 2021. Today’s level comes from the
              live basket snapshot. Years in between stay unused on purpose —
              there is no free public daily feed to fill them honestly.
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
            in basket
          </p>
        )}
      </div>
    </section>
  );
}
