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
    const series = chart.addSeries(AreaSeries, {
      lineColor: line,
      topColor: up ? "rgba(38, 166, 154, 0.32)" : "rgba(239, 83, 80, 0.32)",
      bottomColor: up ? "rgba(38, 166, 154, 0.02)" : "rgba(239, 83, 80, 0.02)",
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
