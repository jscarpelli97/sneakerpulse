import { CatalogMarketsExplorer } from "@/components/catalog/CatalogMarketsExplorer";
import { MarketsCategoryTabs } from "@/components/catalog/MarketsCategoryTabs";
import { DataModeBanner } from "@/components/layout/DataModeBanner";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";
import { getDataModeLabel } from "@/lib/dataMode";
import {
  FREE_CATALOG_LIMIT,
  gateCatalogRows,
  getPlusAccess,
} from "@/lib/plus/access";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";

export const dynamic = "force-dynamic";

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
            ? `Sneakers · free top ${FREE_CATALOG_LIMIT} of ${access.total}`
            : `Sneakers · ${dataMode.subtitle}`
        }
        variant="dashboard"
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <section className="space-y-3">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              Markets
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sneakers
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-dash-muted sm:text-base">
              Top StockX sellers by rank — asks, volume, and tickers.
            </p>
            <MarketsCategoryTabs active="sneakers" />
          </section>
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
            itemHrefBase="/sneakers"
            emptyNoun="pairs"
          />
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
