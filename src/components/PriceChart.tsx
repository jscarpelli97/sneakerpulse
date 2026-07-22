import { CHART_RANGES } from "@/data/darkMocha";
import type { SneakerMarket } from "@/lib/stockx/types";
import { formatMoney } from "@/lib/format";

function buildPath(values: readonly number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / span) * (height - 24) - 12;
    return { x, y };
  });

  const line = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return { line, area, min, max };
}

export function PriceChart({ market }: { market: SneakerMarket }) {
  const width = 960;
  const height = 360;
  const prices = market.chartSeries.map((point) => point.price);
  const hasSeries = prices.length > 1;
  const { line, area, min, max } = hasSeries
    ? buildPath(prices, width, height)
    : { line: "", area: "", min: market.price, max: market.price };
  const isUp = (market.changeToday?.percent ?? market.change30d?.percent ?? 0) >= 0;

  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 md:px-5">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
            Price chart
          </h2>
          <p className="text-sm text-ink-soft">
            {hasSeries
              ? `StockX daily average sales · ${market.chartSeries.length} sessions`
              : "StockX sales history unavailable on free KicksDB tier"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {CHART_RANGES.map((range) => (
            <span
              key={range}
              className={`px-2.5 py-1 text-xs font-semibold ${
                range === "3M" ? "bg-ink text-white" : "bg-paper text-ink-soft"
              }`}
            >
              {range}
            </span>
          ))}
        </div>
      </div>

      <div className="relative px-2 py-4 md:px-4 md:py-5">
        <div className="mb-3 flex items-end justify-between px-2 text-xs text-ink/45">
          <span>High {formatMoney(max)}</span>
          <span>Low {formatMoney(min)}</span>
        </div>

        <div className="relative h-[280px] w-full md:h-[360px]">
          {hasSeries ? (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-full w-full"
              role="img"
              aria-label={`${market.name} StockX price chart`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isUp ? "#16a34a" : "#dc2626"}
                    stopOpacity="0.28"
                  />
                  <stop
                    offset="100%"
                    stopColor={isUp ? "#16a34a" : "#dc2626"}
                    stopOpacity="0.02"
                  />
                </linearGradient>
                <pattern
                  id="grid"
                  width="80"
                  height="48"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 80 0 L 0 0 0 48"
                    fill="none"
                    stroke="rgba(18,20,26,0.06)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              <rect width={width} height={height} fill="url(#grid)" />
              <path d={area} fill="url(#chartFill)" />
              <path
                d={line}
                fill="none"
                stroke={isUp ? "#16a34a" : "#dc2626"}
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-ink/15 bg-paper/50 px-6 text-center text-sm text-ink-soft">
              Live lowest ask is loaded from StockX. Upgrade KicksDB for daily
              sales history to render the full chart.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
