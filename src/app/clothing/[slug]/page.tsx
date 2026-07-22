import { notFound, redirect } from "next/navigation";
import { MarketHeader } from "@/components/market/MarketHeader";
import { MarketSizeSection } from "@/components/market/MarketSizeSection";
import { MarketSnapshot } from "@/components/market/MarketSnapshot";
import { MarketSummaryCard } from "@/components/market/MarketSummaryCard";
import { PriceChart } from "@/charts/PriceChart";
import { PriceOverview } from "@/components/market/PriceOverview";
import { SetupBanner } from "@/components/market/SetupBanner";
import { StatsPanel } from "@/components/market/StatsPanel";
import { UpstreamStatusBadge } from "@/components/market/UpstreamStatusBadge";
import { SiteFooter } from "@/components/layout/SiteChrome";
import { BRAND_NAME, clothingPublicEnabled } from "@/lib/brand";
import { buildMarketSummary } from "@/lib/summary/buildMarketSummary";
import {
  getAllClothingSlugs,
  getClothingBySlug,
} from "@/services/catalog/clothing";
import {
  getMarketBySlug,
  getMarketFallback,
} from "@/services/market/getMarketBySlug";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllClothingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getClothingBySlug(slug);
  if (!item) {
    return { title: `Clothing not found — ${BRAND_NAME}` };
  }
  return {
    title: `${item.name} — ${BRAND_NAME}`,
    description: `Streetwear ask board for ${item.name} (${item.year}).`,
  };
}

export default async function ClothingMarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!clothingPublicEnabled()) {
    redirect("/markets");
  }

  const { slug } = await params;
  const catalog = getClothingBySlug(slug);
  if (!catalog) notFound();

  const result = await getMarketBySlug(slug);
  const live = result.ok;
  const market = result.ok ? result.data : getMarketFallback(catalog);
  const summary = result.ok ? buildMarketSummary(result.data) : null;

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <MarketHeader
        market={market}
        live={live}
        statusBadge={
          result.ok ? (
            <UpstreamStatusBadge status={market.upstreamStatus} />
          ) : undefined
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 md:space-y-6 md:py-7 lg:px-8">
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

          {result.ok && summary ? (
            <MarketSummaryCard market={market} summary={summary} />
          ) : null}

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

          <p className="pb-4 text-center text-xs text-dash-faint md:text-left">
            {result.ok
              ? `Live StockX market data for ${market.name}. Source: StockX via KicksDB · chart=${market.historySource} · status=${market.upstreamStatus}.`
              : `Clothing catalog item — connect KicksDB for live StockX asks on ${catalog.name}, or open StockX directly.`}
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
