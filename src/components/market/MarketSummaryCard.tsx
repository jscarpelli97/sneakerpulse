import { buildMarketSummary } from "@/lib/summary/buildMarketSummary";
import type { SneakerMarket } from "@/types/market";
import type { MarketSummary, MarketTone } from "@/types/summary";
import { formatNumber } from "@/utils/format";

const TONE_STYLES: Record<
  MarketTone,
  { badge: string; label: string; accent: string }
> = {
  bullish: {
    badge: "bg-[rgba(38,166,154,0.14)] text-dash-up",
    label: "Bullish",
    accent: "border-l-dash-up",
  },
  bearish: {
    badge: "bg-[rgba(239,83,80,0.14)] text-dash-down",
    label: "Bearish",
    accent: "border-l-dash-down",
  },
  mixed: {
    badge: "bg-[rgba(212,160,23,0.14)] text-dash-accent",
    label: "Mixed",
    accent: "border-l-dash-accent",
  },
  neutral: {
    badge: "bg-dash-elevated text-dash-muted",
    label: "Neutral",
    accent: "border-l-dash-muted",
  },
  insufficient: {
    badge: "bg-dash-elevated text-dash-faint",
    label: "Limited data",
    accent: "border-l-dash-faint",
  },
};

function signalLabel(value: string) {
  if (value === "up") return "Rising";
  if (value === "down") return "Falling";
  if (value === "flat") return "Stable";
  return "Unknown";
}

export function MarketSummaryCard({
  market,
  summary: provided,
}: {
  market: SneakerMarket;
  summary?: MarketSummary;
}) {
  const summary = provided ?? buildMarketSummary(market);
  const tone = TONE_STYLES[summary.tone];
  const { signals } = summary;

  return (
    <section
      className={`dash-card animate-rise overflow-hidden border-l-4 text-dash-text ${tone.accent}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dash-border px-4 py-3 sm:px-5">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
            Market read
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
            {summary.headline}
          </h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.badge}`}
        >
          {tone.label}
        </span>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <p className="text-base leading-relaxed text-dash-text sm:text-[17px]">
          {summary.body}
        </p>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-dash-border bg-dash-elevated/70 px-3 py-3">
            <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              Price signal
            </dt>
            <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-sm font-semibold text-dash-text">
              {signalLabel(signals.price)}
              {signals.priceChangePercent != null
                ? ` · ${signals.priceChangePercent > 0 ? "+" : ""}${signals.priceChangePercent.toFixed(1)}%`
                : ""}
            </dd>
          </div>
          <div className="rounded-xl border border-dash-border bg-dash-elevated/70 px-3 py-3">
            <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              Inventory signal
            </dt>
            <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-sm font-semibold text-dash-text">
              {signalLabel(signals.inventory)}
              {signals.supplyPressure != null
                ? ` · ${signals.supplyPressure.toFixed(2)} asks/order`
                : ""}
            </dd>
          </div>
          <div className="rounded-xl border border-dash-border bg-dash-elevated/70 px-3 py-3">
            <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              Depth
            </dt>
            <dd className="mt-1 font-[family-name:var(--font-plex-mono)] text-sm font-semibold text-dash-text">
              {formatNumber(signals.askCount)} asks
              {signals.weeklyOrders != null
                ? ` · ${formatNumber(signals.weeklyOrders)} wk orders`
                : ""}
            </dd>
          </div>
        </dl>

        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] leading-relaxed text-dash-faint">
          Automated read from ask, volume, and inventory signals. Not financial
          advice.
        </p>
      </div>
    </section>
  );
}
