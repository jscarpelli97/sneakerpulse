import { CatalogMarketsExplorer } from "@/components/catalog/CatalogMarketsExplorer";
import { DataModeBanner } from "@/components/layout/DataModeBanner";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";
import { getDataModeLabel } from "@/lib/dataMode";
import { FREE_CATALOG_LIMIT, gateCatalogRows, getPlusAccess } from "@/lib/plus/access";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All markets",
  description:
    "Browse the full SPI Markets top-seller board — StockX-style asks, rank, and weekly volume.",
  alternates: { canonical: "/markets" },
};

export default async function MarketsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [{ isPlus, publicPlus }, allQuotes] = await Promise.all([
    getPlusAccess(),
    getCatalogQuotes(TOP_SELLERS_LIMIT),
  ]);
  const access = gateCatalogRows(allQuotes, isPlus);
  const quotes = access.rows;
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
      <SiteHeader
        subtitle={
          access.gated
            ? `Free · top ${FREE_CATALOG_LIMIT} of ${access.total}`
            : dataMode.subtitle
        }
        variant="dashboard"
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {access.gated && publicPlus ? (
            <PlusCatalogGate
              visible={access.visible}
              total={access.total}
              freeLimit={access.freeLimit}
            />
          ) : null}
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
