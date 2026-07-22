"use client";

import {
  AreaSeries,
  ColorType,
  createChart,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { ChartPoint } from "@/types/market";

type Props = {
  data: ChartPoint[];
  /** Optional second segment (e.g. post-gap extension) drawn separately so we do not invent a line across missing years. */
  secondaryData?: ChartPoint[];
  up: boolean;
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

export function LightweightPriceChart({ data, secondaryData, up }: Props) {
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
        timeVisible: false,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: "#1b2130" },
        vertLine: { labelBackgroundColor: "#1b2130" },
      },
      handleScroll: true,
      handleScale: true,
    });

    const line = up ? "#26a69a" : "#ef5350";
    const hasSecondary = Boolean(secondaryData && secondaryData.length > 1);
    const series = chart.addSeries(AreaSeries, {
      lineColor: line,
      topColor: up ? "rgba(38, 166, 154, 0.32)" : "rgba(239, 83, 80, 0.32)",
      bottomColor: up ? "rgba(38, 166, 154, 0.02)" : "rgba(239, 83, 80, 0.02)",
      lineWidth: 2,
      priceLineVisible: !hasSecondary,
      lastValueVisible: !hasSecondary,
    });

    const points = toChartPoints(data);
    if (points.length > 0) {
      series.setData(points);
    }

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
  }, [data, secondaryData, up]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[260px] w-full"
      role="img"
      aria-label="StockX historical price chart"
    />
  );
}
