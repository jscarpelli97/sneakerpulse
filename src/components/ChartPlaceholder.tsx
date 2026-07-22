import { chartSeries, market, ranges } from "@/data/darkMocha";
import { formatMoney } from "@/lib/format";

function buildPath(values: readonly number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);

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

  return { line, area, min, max, points };
}

export function ChartPlaceholder() {
  const width = 960;
  const height = 360;
  const { line, area, min, max } = buildPath(chartSeries, width, height);
  const isUp = market.changeToday.percent >= 0;

  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 md:px-5">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
            Price chart
          </h2>
          <p className="text-sm text-ink-soft">
            Dummy 90-day close series · placeholder visualization
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {ranges.map((range) => (
            <span
              key={range}
              className={`px-2.5 py-1 text-xs font-semibold ${
                range === "3M"
                  ? "bg-ink text-white"
                  : "bg-paper text-ink-soft"
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
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            role="img"
            aria-label="Jordan 1 High Dark Mocha dummy price chart"
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

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border border-dashed border-ink/20 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/50 backdrop-blur-sm">
              Chart placeholder
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
