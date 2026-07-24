import { CatalogTable } from "@/components/catalog/CatalogTable";
import { HomeWhatWeProvide } from "@/components/catalog/HomeWhatWeProvide";
import { MarketsHero } from "@/components/catalog/MarketsHero";
import { MarketsQuickLook } from "@/components/catalog/MarketsQuickLook";
import { MarketsStatStrip } from "@/components/catalog/MarketsStatStrip";
import { MarketIndexCard } from "@/components/market/MarketIndexCard";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusInterest } from "@/components/plus/PlusInterest";
import { PlusPopup } from "@/components/plus/PlusPopup";
import { PlusTopCallout } from "@/components/plus/PlusTopCallout";
import { BRAND_BLURB, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { getDataModeLabel } from "@/lib/dataMode";
import {
  FREE_CATALOG_LIMIT,
  gateCatalogRows,
  getPlusAccess,
} from "@/lib/plus/access";
import {
  HOMEPAGE_WATCHLIST_LIMIT,
  TOP_SELLERS_LIMIT,
} from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";
import { getMarketIndex } from "@/services/market/getMarketIndex";
import { getQuickLook } from "@/services/market/getQuickLook";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    absolute: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
  },
  description: BRAND_BLURB,
  alternates: { canonical: "/" },
};
export default async function MarketsIndexPage() {
  const [{ isPlus, publicPlus }, allQuotes, marketIndex] = await Promise.all([
    getPlusAccess(),
    getCatalogQuotes(TOP_SELLERS_LIMIT),
    getMarketIndex(TOP_SELLERS_LIMIT),
  ]);
  const access = gateCatalogRows(allQuotes, isPlus);
  const quotes = access.rows;
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
      {publicPlus ? <PlusTopCallout /> : null}
      <SiteHeader
        subtitle={
          access.gated
            ? `Free · top ${FREE_CATALOG_LIMIT} of ${access.total}`
            : dataMode.subtitle
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:space-y-7 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10">
          {/* 1) What is SPI Markets? */}
          {featured ? (
            <MarketsHero
              featured={featured}
              modeBadge={dataMode.badge}
              modeSubtitle={
                access.gated
                  ? `Free top ${FREE_CATALOG_LIMIT} · ${access.total} on Plus`
                  : dataMode.subtitle
              }
              totalMarkets={access.gated ? FREE_CATALOG_LIMIT : quotes.length}
            />
          ) : null}

          {/* 2) Why here? — unique value vs a StockX tab */}
          {marketIndex ? <MarketIndexCard index={marketIndex} /> : null}

          {/* 3) What do we provide? */}
          <HomeWhatWeProvide />

          {access.gated && publicPlus ? (
            <PlusCatalogGate
              visible={access.visible}
              total={access.total}
              freeLimit={access.freeLimit}
            />
          ) : null}

          {/* 4) Show me — proof on the board */}
          <CatalogTable
            rows={watchlist}
            title="See it on the board"
            subtitle={
              access.gated
                ? `Free top ${watchlist.length} · unlock all ${access.total} with Plus`
                : `Heat on the board · top ${watchlist.length} of ${access.total} tracked sellers`
            }
            hrefAll={{
              href: access.gated && publicPlus ? "/plus" : "/markets",
              label:
                access.gated && publicPlus
                  ? `Unlock all ${access.total}`
                  : `View all ${access.total}`,
            }}
          />
          <MarketsStatStrip quotes={quotes} liveCount={liveCount} />
          <MarketsQuickLook look={quickLook} />

          {publicPlus ? <PlusInterest variant="panel" source="home" /> : null}
        </div>
      </main>
      <SiteFooter />
      {publicPlus ? <PlusPopup /> : null}
    </div>
  );
}
