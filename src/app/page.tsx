import { CatalogTable } from "@/components/catalog/CatalogTable";
import { MarketsHero } from "@/components/catalog/MarketsHero";
import { MarketsQuickLook } from "@/components/catalog/MarketsQuickLook";
import { MarketsStatStrip } from "@/components/catalog/MarketsStatStrip";
import { DataModeBanner } from "@/components/layout/DataModeBanner";
import { MarketIndexCard } from "@/components/market/MarketIndexCard";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusInterest } from "@/components/plus/PlusInterest";
import { getDataModeLabel } from "@/lib/dataMode";
import {
  HOMEPAGE_WATCHLIST_LIMIT,
  TOP_SELLERS_LIMIT,
} from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";
import { getMarketIndex } from "@/services/market/getMarketIndex";
import { getQuickLook } from "@/services/market/getQuickLook";

export const revalidate = 300;

export default async function MarketsIndexPage() {
  const [quotes, marketIndex] = await Promise.all([
    getCatalogQuotes(TOP_SELLERS_LIMIT),
    getMarketIndex(TOP_SELLERS_LIMIT),
  ]);
  const quickLook = await getQuickLook(quotes);
  const liveCount = quotes.filter((row) => row.live).length;
  const cachedCount = quotes.filter(
    (row) => !row.live && row.price != null,
  ).length;
  const featured =
    quotes.find((row) => row.featured) ?? quotes[0] ?? null;
  const watchlist = quotes.slice(0, HOMEPAGE_WATCHLIST_LIMIT);
  const dataMode = getDataModeLabel({
    liveCount,
    cachedCount,
    total: quotes.length,
    asOf: getOfflineCatalogAsOf(),
  });

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle={dataMode.subtitle} variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:space-y-7 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10">
          {featured ? (
            <MarketsHero
              featured={featured}
              modeBadge={dataMode.badge}
              modeSubtitle={dataMode.subtitle}
              totalMarkets={quotes.length}
            />
          ) : null}
          <DataModeBanner
            mode={dataMode.mode}
            badge={dataMode.badge}
            detail={dataMode.detail}
          />
          <MarketsStatStrip quotes={quotes} liveCount={liveCount} />
          <MarketsQuickLook look={quickLook} />
          {marketIndex ? <MarketIndexCard index={marketIndex} /> : null}
          <CatalogTable
            rows={watchlist}
            title="Top 10 watchlist"
            subtitle={`Hottest ${watchlist.length} of ${quotes.length} tracked StockX sellers`}
            hrefAll={{
              href: "/markets",
              label: `View all ${quotes.length}`,
            }}
            variant="dashboard"
          />
          <PlusInterest variant="panel" source="home" />
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
