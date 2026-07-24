import { notFound } from "next/navigation";
import { MarketHeader } from "@/components/market/MarketHeader";
import { MarketSizeSection } from "@/components/market/MarketSizeSection";
import { MarketSnapshot } from "@/components/market/MarketSnapshot";
import { MarketSummaryCard } from "@/components/market/MarketSummaryCard";
import { DealCheckPanel } from "@/components/market/DealCheckPanel";
import { PriceChart } from "@/charts/PriceChart";
import { PriceOverview } from "@/components/market/PriceOverview";
import { EbayCompsPanel } from "@/components/market/EbayCompsPanel";
import { MarketLoadNotice } from "@/components/market/MarketLoadNotice";
import { StatsPanel } from "@/components/market/StatsPanel";
import { UpstreamStatusBadge } from "@/components/market/UpstreamStatusBadge";
import { SiteFooter } from "@/components/layout/SiteChrome";
import { ProductJsonLd } from "@/components/seo/JsonLd";
import { PlusMarketLock } from "@/components/plus/PlusCatalogGate";
import { BRAND_NAME } from "@/lib/brand";
import { buildMarketSummary } from "@/lib/summary/buildMarketSummary";
import {
  FREE_CATALOG_LIMIT,
  getPlusAccess,
} from "@/lib/plus/access";
import {
  getAllSneakerSlugs,
  getOfflineCatalogQuotes,
  getSneakerBySlug,
} from "@/services/catalog/sneakers";
import { STATIC_PARAMS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import {
  getMarketBySlug,
  getMarketFallback,
} from "@/services/market/getMarketBySlug";
import { getLiveSizeLadder } from "@/services/market/getLiveSizeLadder";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllSneakerSlugs();
  return slugs.slice(0, STATIC_PARAMS_LIMIT).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sneaker = await getSneakerBySlug(slug);
  if (!sneaker) {
    return { title: "Sneaker not found" };
  }
  return {
    title: sneaker.name,
    description: `${sneaker.name} (${sneaker.year}) — StockX-style asks, size ladder, and chart on ${BRAND_NAME}.`,
    alternates: { canonical: `/sneakers/${sneaker.slug}` },
    openGraph: {
      title: sneaker.name,
      description: `Market view for ${sneaker.name} on ${BRAND_NAME}.`,
      type: "website",
    },
  };
}

export default async function SneakerMarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getSneakerBySlug(slug);
  if (!catalog) notFound();

  const { isPlus, publicPlus } = await getPlusAccess();
  if (publicPlus && !isPlus) {
    const freeSlugs = new Set(
      getOfflineCatalogQuotes(FREE_CATALOG_LIMIT).map((row) => row.slug),
    );
    if (!freeSlugs.has(slug)) {
      return (
        <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
          <main className="flex flex-1 items-center justify-center px-4 py-16">
            <PlusMarketLock name={catalog.name} />
          </main>
          <SiteFooter />
        </div>
      );
    }
  }

  const result = await getMarketBySlug(slug);
  let market = result.ok ? result.data : await getMarketFallback(catalog);

  // Snapshot markets have no size ladder — hydrate live asks for Deal + size table.
  if (result.ok && market.sizes.length === 0) {
    const ladder = await getLiveSizeLadder(slug);
    if (ladder.sizes.length > 0) {
      market = {
        ...market,
        sizes: ladder.sizes,
        upstreamStatus: ladder.live ? "live" : market.upstreamStatus,
      };
    }
  }

  const summary = result.ok ? buildMarketSummary(market) : null;
  const upstreamStatus = result.ok ? market.upstreamStatus : "offline";

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <ProductJsonLd
        name={market.name}
        slug={market.slug}
        brand={market.brand}
        image={market.image}
        sku={market.styleCode}
        price={market.price > 0 ? market.price : null}
        stockxUrl={market.stockxUrl}
      />
      <MarketHeader
        market={market}
        upstreamStatus={upstreamStatus}
        statusBadge={
          result.ok ? (
            <UpstreamStatusBadge status={market.upstreamStatus} />
          ) : undefined
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 md:space-y-6 md:py-7 lg:px-8">
          {!result.ok ? (
            <MarketLoadNotice
              sneakerName={catalog.name}
              styleCode={catalog.styleCode}
              stockxUrl={catalog.stockxUrl}
            />
          ) : null}

          {result.ok ? <PriceOverview market={market} /> : null}

          {result.ok && summary ? (
            <MarketSummaryCard market={market} summary={summary} />
          ) : null}

          {result.ok ? <DealCheckPanel market={market} /> : null}

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

          {market.ebay ? (
            <EbayCompsPanel
              ebay={market.ebay}
              stockxAsk={market.price > 0 ? market.price : null}
            />
          ) : null}

          <p className="pb-4 text-center text-xs text-dash-faint md:text-left">
            {result.ok
              ? `${BRAND_NAME} · ${market.name}. Asks via StockX data providers · ${market.upstreamStatus} · updated ${new Date(market.fetchedAt).toLocaleString()}. Independent — not affiliated with StockX.`
              : `${BRAND_NAME} could not load a full market view for ${catalog.name}. Independent — not affiliated with StockX.`}
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
