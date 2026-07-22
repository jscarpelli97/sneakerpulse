"use client";

import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { ChartPoint } from "@/types/market";

type Props = {
  data: ChartPoint[];
  up: boolean;
};

export function LightweightPriceChart({ data, up }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#2a2e38",
        fontFamily: "var(--font-instrument), system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(18, 20, 26, 0.06)" },
        horzLines: { color: "rgba(18, 20, 26, 0.06)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: "#12141a" },
        vertLine: { labelBackgroundColor: "#12141a" },
      },
      handleScroll: true,
      handleScale: true,
    });

    const line = up ? "#16a34a" : "#dc2626";
    const series = chart.addSeries(AreaSeries, {
      lineColor: line,
      topColor: up ? "rgba(22, 163, 74, 0.28)" : "rgba(220, 38, 38, 0.28)",
      bottomColor: up ? "rgba(22, 163, 74, 0.02)" : "rgba(220, 38, 38, 0.02)",
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [up]);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    const points = data
      .filter((point) => point.price > 0 && point.date)
      .map((point) => ({
        time: point.date.slice(0, 10) as Time,
        value: point.price,
      }));

    series.setData(points);
    chart.timeScale().fitContent();
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="img"
      aria-label="StockX historical price chart"
    />
  );
}
