import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { MarketHeader } from "@/components/MarketHeader";
import { PriceOverview } from "@/components/PriceOverview";
import { StatsPanel } from "@/components/StatsPanel";
import { sneaker } from "@/data/darkMocha";

export default function Home() {
  return (
    <>
      <MarketHeader />
      <main className="flex-1 bg-[linear-gradient(180deg,#eef1f4_0%,#e6eaef_45%,#eef1f4_100%)]">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 md:px-6 md:py-6">
          <PriceOverview />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            <ChartPlaceholder />
            <StatsPanel />
          </div>

          <p className="pb-4 text-center text-xs text-ink/40 md:text-left">
            Showing dummy market data for {sneaker.name} ({sneaker.year}). Not
            live pricing.
          </p>
        </div>
      </main>
      <footer className="border-t border-ink/10 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-sm text-ink-soft">
          <span className="font-[family-name:var(--font-syne)] font-extrabold text-ink">
            SneakerPulse
          </span>
          <span>Market view inspired by TradingView & CoinMarketCap</span>
        </div>
      </footer>
    </>
  );
}
