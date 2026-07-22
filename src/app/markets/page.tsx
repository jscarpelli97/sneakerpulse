import { CatalogMarketsExplorer } from "@/components/catalog/CatalogMarketsExplorer";
import { DataModeBanner } from "@/components/layout/DataModeBanner";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getDataModeLabel } from "@/lib/dataMode";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";

export const revalidate = 300;

export default async function MarketsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const quotes = await getCatalogQuotes(TOP_SELLERS_LIMIT);
  const liveCount = quotes.filter((row) => row.live).length;
  const cachedCount = quotes.filter(
    (row) => !row.live && row.price != null,
  ).length;
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
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <DataModeBanner
            mode={dataMode.mode}
            badge={dataMode.badge}
            detail={dataMode.detail}
          />
          <CatalogMarketsExplorer
            rows={quotes}
            initialQuery={typeof q === "string" ? q : ""}
          />
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
