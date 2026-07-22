"use client";

import {
  AreaSeries,
  ColorType,
  createChart,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { ChartPoint } from "@/types/market";

type Props = {
  data: ChartPoint[];
  /** Optional second segment drawn separately (e.g. live SPI after a data gap). */
  secondaryData?: ChartPoint[];
  up: boolean;
  /** Show calendar axis labels (useful for multi-year index charts). */
  showTime?: boolean;
  /** Optional reference price line (e.g. 100 = retail parity). */
  referenceLevel?: number;
  referenceTitle?: string;
  /** Optional boom-peak marker line. */
  peakLevel?: number;
  peakTitle?: string;
  /**
   * When true (dual-era SPI chart), primary series stays teal (boom)
   * and secondary stays gold (today) regardless of up/down.
   */
  eraColors?: boolean;
};

function toChartPoints(data: ChartPoint[]) {
  const seen = new Set<string>();
  const points: Array<{ time: Time; value: number }> = [];

  for (const point of data) {
    if (!(point.price > 0) || !point.date) continue;
    const day = point.date.slice(0, 10);
    if (seen.has(day)) continue;
    seen.add(day);
    points.push({ time: day as Time, value: point.price });
  }

  points.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  return points;
}

function addLevelLine(
  series: ISeriesApi<"Area">,
  price: number | undefined,
  color: string,
  title: string,
) {
  if (price == null || !Number.isFinite(price) || price <= 0) return;
  series.createPriceLine({
    price,
    color,
    lineWidth: 1,
    lineStyle: 2,
    axisLabelVisible: true,
    title,
  });
}

export function LightweightPriceChart({
  data,
  secondaryData,
  up,
  showTime = false,
  referenceLevel,
  referenceTitle = "Retail",
  peakLevel,
  peakTitle = "Boom peak",
  eraColors = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: Math.max(el.clientWidth, 1),
      height: Math.max(el.clientHeight, 1),
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#151922" },
        textColor: "#8b93a7",
        fontFamily: "var(--font-instrument), system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(42, 49, 66, 0.65)" },
        horzLines: { color: "rgba(42, 49, 66, 0.65)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: showTime,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: "#1b2130" },
        vertLine: { labelBackgroundColor: "#1b2130" },
      },
      handleScroll: true,
      handleScale: true,
    });

    const hasSecondary = Boolean(secondaryData && secondaryData.length >= 2);
    const primaryLine = eraColors
      ? "#26a69a"
      : up
        ? "#26a69a"
        : "#ef5350";
    const primaryTop = eraColors
      ? "rgba(38, 166, 154, 0.32)"
      : up
        ? "rgba(38, 166, 154, 0.32)"
        : "rgba(239, 83, 80, 0.32)";
    const primaryBottom = eraColors
      ? "rgba(38, 166, 154, 0.02)"
      : up
        ? "rgba(38, 166, 154, 0.02)"
        : "rgba(239, 83, 80, 0.02)";

    const series = chart.addSeries(AreaSeries, {
      lineColor: primaryLine,
      topColor: primaryTop,
      bottomColor: primaryBottom,
      lineWidth: 2,
      priceLineVisible: !hasSecondary,
      lastValueVisible: !hasSecondary,
    });

    const points = toChartPoints(data);
    if (points.length > 0) {
      series.setData(points);
    }

    addLevelLine(
      series,
      referenceLevel,
      "rgba(139, 147, 167, 0.9)",
      referenceTitle,
    );
    addLevelLine(series, peakLevel, "rgba(38, 166, 154, 0.75)", peakTitle);

    if (hasSecondary && secondaryData) {
      const secondary = chart.addSeries(AreaSeries, {
        lineColor: "#d4a017",
        topColor: "rgba(212, 160, 23, 0.28)",
        bottomColor: "rgba(212, 160, 23, 0.02)",
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      const secondaryPoints = toChartPoints(secondaryData);
      if (secondaryPoints.length > 0) {
        secondary.setData(secondaryPoints);
      }
    }

    if (points.length > 0 || hasSecondary) {
      chart.timeScale().fitContent();
    }

    const ro = new ResizeObserver(() => {
      if (!el.isConnected) return;
      chart.applyOptions({
        width: Math.max(el.clientWidth, 1),
        height: Math.max(el.clientHeight, 1),
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [
    data,
    secondaryData,
    up,
    showTime,
    referenceLevel,
    referenceTitle,
    peakLevel,
    peakTitle,
    eraColors,
  ]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[260px] w-full"
      role="img"
      aria-label="SPI Index chart"
    />
  );
}
