import type { SneakerMarket } from "@/types/market";
import { premiumVsRetail } from "@/utils/metrics";
import {
  formatChange,
  formatMaybeMoney,
  formatNumber,
} from "@/utils/format";

type SnapshotRow = {
  label: string;
  value: string;
  tone?: string;
  hint?: string;
};

function formatReleaseDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function premiumTone(percent: number | null | undefined) {
  if (percent == null) return "text-dash-faint";
  if (percent > 0) return "text-dash-up";
  if (percent < 0) return "text-dash-down";
  return "text-dash-muted";
}

export function MarketSnapshot({ market }: { market: SneakerMarket }) {
  const ask =
    market.stats.lowestAsk ?? (market.price > 0 ? market.price : null);
  const premium = premiumVsRetail(ask, market.retail);
  const premiumFmt = formatChange(premium?.absolute, premium?.percent);

  const lastSale =
    market.historySource === "sales" ? market.stats.lastSale : null;

  const rows: SnapshotRow[] = [
    {
      label: "Release Date",
      value: formatReleaseDate(market.releaseDate),
    },
    {
      label: "Retail Price",
      value: formatMaybeMoney(market.retail),
    },
    {
      label: "SKU",
      value: market.styleCode,
      hint: "Style code",
    },
    {
      label: "Colorway",
      value: market.colorway,
    },
    {
      label: "Current Premium",
      value:
        premium == null
          ? "—"
          : `${premiumFmt.absolute} (${premiumFmt.percent})`,
      tone: premiumTone(premium?.percent),
      hint: "Lowest ask vs retail",
    },
    {
      label: "Lowest Ask",
      value: formatMaybeMoney(ask),
      hint: "Live StockX",
    },
    {
      label: "Highest Bid",
      value: formatMaybeMoney(market.stats.highestBid),
      hint: "Not in current KicksDB feed",
    },
    {
      label: "Last Sale",
      value: formatMaybeMoney(lastSale),
      hint:
        market.historySource === "sales"
          ? "Latest daily avg sale"
          : "Needs StockX sales history",
    },
    {
      label: "Average Sale",
      value: formatMaybeMoney(market.stats.avgSale30d),
      hint:
        market.stats.avgSale30dSource === "sales"
          ? "30d daily avg"
          : market.stats.avgSale30dSource === "snapshot"
            ? "30d ask snapshots"
            : market.stats.avgSale30dSource === "stockx_stats"
              ? "StockX 90d avg"
              : undefined,
    },
    {
      label: "Number of Sales",
      value: formatNumber(market.stats.sales30d),
      hint: "30d · sum of size variants",
    },
  ];

  const left = rows.slice(0, 5);
  const right = rows.slice(5);

  return (
    <section className="overflow-hidden rounded-2xl border border-dash-border bg-dash-panel text-dash-text shadow-[0_1px_0_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-dash-border px-4 py-3 sm:px-5">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
            Key statistics
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
            Market Snapshot
          </h2>
        </div>
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-muted">
          {market.ticker} · {market.currency}
        </p>
      </div>

      <div className="grid md:grid-cols-2">
        {[left, right].map((column, columnIndex) => (
          <dl
            key={columnIndex}
            className={
              columnIndex === 0 ? "border-dash-border md:border-r" : undefined
            }
          >
            {column.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-baseline gap-3 border-b border-[var(--dash-border-subtle)] px-4 py-2.5 last:border-b-0 sm:px-5"
              >
                <dt className="text-sm text-dash-muted">
                  {row.label}
                  {row.hint ? (
                    <span className="mt-0.5 block font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
                      {row.hint}
                    </span>
                  ) : null}
                </dt>
                <dd
                  className={`text-right font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums sm:text-[15px] ${
                    row.tone ?? "text-dash-text"
                  }`}
                  title={row.hint}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </section>
  );
}
