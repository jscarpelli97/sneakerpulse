import { notFound } from "next/navigation";
import { MarketHeader } from "@/components/MarketHeader";
import { MarketSizeSection } from "@/components/MarketSizeSection";
import { MarketSnapshot } from "@/components/MarketSnapshot";
import { PriceChart } from "@/components/PriceChart";
import { PriceOverview } from "@/components/PriceOverview";
import { SetupBanner } from "@/components/SetupBanner";
import { StatsPanel } from "@/components/StatsPanel";
import { UpstreamStatusBadge } from "@/components/UpstreamStatusBadge";
import { SiteFooter } from "@/components/layout/SiteChrome";
import {
  getAllSneakerSlugs,
  getSneakerBySlug,
} from "@/catalog/sneakers";
import {
  getMarketBySlug,
  getMarketFallback,
} from "@/lib/market/getMarketBySlug";

export const revalidate = 300;

export function generateStaticParams() {
  return getAllSneakerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sneaker = getSneakerBySlug(slug);
  if (!sneaker) {
    return { title: "Sneaker not found — SneakerPulse" };
  }
  return {
    title: `${sneaker.name} — SneakerPulse`,
    description: `Live StockX market view for ${sneaker.name} (${sneaker.year}).`,
  };
}

export default async function SneakerMarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = getSneakerBySlug(slug);
  if (!catalog) notFound();

  const result = await getMarketBySlug(slug);
  const live = result.ok;
  const market = result.ok ? result.data : getMarketFallback(catalog);

  return (
    <>
      <MarketHeader
        market={market}
        live={live}
        statusBadge={
          result.ok ? (
            <UpstreamStatusBadge status={market.upstreamStatus} />
          ) : undefined
        }
      />
      <main className="flex-1 bg-[linear-gradient(180deg,#eef1f4_0%,#e6eaef_45%,#eef1f4_100%)]">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 md:px-6 md:py-6">
          {!result.ok ? (
            <SetupBanner
              code={result.code}
              message={result.error}
              sneakerName={catalog.name}
              styleCode={catalog.styleCode}
              stockxUrl={catalog.stockxUrl}
            />
          ) : null}

          {result.ok ? <PriceOverview market={market} /> : null}

          {result.ok ? <MarketSnapshot market={market} /> : null}

          {result.ok ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
              <PriceChart
                series={market.chartSeries}
                historySource={market.historySource}
              />
              <StatsPanel market={market} />
            </div>
          ) : null}

          {result.ok ? <MarketSizeSection market={market} /> : null}

          <p className="pb-4 text-center text-xs text-ink/40 md:text-left">
            {result.ok
              ? `Live StockX market data for ${market.name}, refreshed about every 5 minutes. Source: StockX via KicksDB · chart=${market.historySource} · status=${market.upstreamStatus} · fetched ${new Date(market.fetchedAt).toLocaleString()}.`
              : `Connect KicksDB to stream live StockX pricing for ${catalog.name}.`}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
