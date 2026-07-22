import { MarketHeader } from "@/components/MarketHeader";
import { PriceChart } from "@/components/PriceChart";
import { PriceOverview } from "@/components/PriceOverview";
import { SetupBanner } from "@/components/SetupBanner";
import { StatsPanel } from "@/components/StatsPanel";
import { DARK_MOCHA } from "@/data/darkMocha";
import { getDarkMochaMarket } from "@/lib/stockx/getDarkMocha";
import type { SneakerMarket } from "@/lib/stockx/types";

export const revalidate = 300;

function fallbackMarket(): SneakerMarket {
  return {
    id: DARK_MOCHA.slug,
    name: DARK_MOCHA.name,
    brand: DARK_MOCHA.brand,
    year: DARK_MOCHA.year,
    ticker: DARK_MOCHA.ticker,
    styleCode: DARK_MOCHA.styleCode,
    colorway: DARK_MOCHA.colorway,
    retail: DARK_MOCHA.retail,
    image: DARK_MOCHA.fallbackImage,
    stockxUrl: DARK_MOCHA.stockxUrl,
    price: 0,
    currency: "USD",
    changeToday: null,
    change30d: null,
    volume24h: { pairs: 0, notional: null },
    volume30d: { pairs: 0, notional: null },
    stats: {
      lowestAsk: null,
      highestAsk: null,
      averageAsk: null,
      askCount: 0,
      high24h: null,
      low24h: null,
      high30d: null,
      low30d: null,
      avgSale30d: null,
      lastSale: null,
      sales15d: 0,
      sales30d: 0,
      sales60d: 0,
      weeklyOrders: null,
      rank: null,
      annualHigh: null,
      annualLow: null,
      annualAvg: null,
      annualVolatility: null,
      annualSales: null,
    },
    chartSeries: [],
    historySource: "local",
    source: "stockx",
    provider: "kicksdb",
    fetchedAt: new Date().toISOString(),
    historyAvailable: false,
  };
}

export default async function Home() {
  const result = await getDarkMochaMarket();
  const live = result.ok;
  const market = result.ok ? result.data : fallbackMarket();

  return (
    <>
      <MarketHeader market={market} live={live} />
      <main className="flex-1 bg-[linear-gradient(180deg,#eef1f4_0%,#e6eaef_45%,#eef1f4_100%)]">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 md:px-6 md:py-6">
          {!result.ok ? (
            <SetupBanner code={result.code} message={result.error} />
          ) : null}

          {result.ok ? <PriceOverview market={market} /> : null}

          {result.ok ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
              <PriceChart
                series={market.chartSeries}
                historySource={market.historySource}
              />
              <StatsPanel market={market} />
            </div>
          ) : null}

          <p className="pb-4 text-center text-xs text-ink/40 md:text-left">
            {result.ok
              ? `Live StockX market data for ${market.name}, refreshed about every 5 minutes. Source: StockX via KicksDB · fetched ${new Date(market.fetchedAt).toLocaleString()}.`
              : `Connect KicksDB to stream live StockX pricing for ${DARK_MOCHA.name}.`}
          </p>
        </div>
      </main>
      <footer className="border-t border-ink/10 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
          <span className="font-[family-name:var(--font-syne)] font-extrabold text-ink">
            SneakerPulse
          </span>
          <span>StockX market view · TradingView / CoinMarketCap layout</span>
        </div>
      </footer>
    </>
  );
}
