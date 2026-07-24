import { CatalogTable } from "@/components/catalog/CatalogTable";
import { MarketsHero } from "@/components/catalog/MarketsHero";
import { MarketsStatStrip } from "@/components/catalog/MarketsStatStrip";
import { MarketIndexCard } from "@/components/market/MarketIndexCard";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusInterest } from "@/components/plus/PlusInterest";
import { PlusPopup } from "@/components/plus/PlusPopup";
import { PlusTopCallout } from "@/components/plus/PlusTopCallout";
import { BRAND_BLURB, BRAND_NAME, BRAND_TAGLINE, INDEX_NAME } from "@/lib/brand";
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
import Link from "next/link";

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
  const liveCount = quotes.filter((row) => row.live).length;
  const cachedCount = quotes.filter(
    (row) => !row.live && row.price != null,
  ).length;
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
          {/* Free surface: SPI + top-10 board */}
          {marketIndex ? (
            <MarketsHero
              index={marketIndex}
              modeBadge={dataMode.badge}
              modeSubtitle={
                access.gated
                  ? `Free top ${FREE_CATALOG_LIMIT} · ${access.total} on Plus`
                  : dataMode.subtitle
              }
              totalMarkets={access.gated ? FREE_CATALOG_LIMIT : quotes.length}
            />
          ) : null}

          {marketIndex ? <MarketIndexCard index={marketIndex} /> : null}

          <MarketsStatStrip quotes={quotes} liveCount={liveCount} />
          <CatalogTable
            rows={watchlist}
            title="Top sellers"
            subtitle={`Free board · top ${watchlist.length} asks`}
            hrefAll={{
              href: "/plus",
              label: "See Plus tools",
            }}
          />

          <section className="rounded-2xl border border-dash-border bg-dash-elevated/25 px-5 py-5 sm:px-6">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
              Free vs Plus
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
              This page stays free — {INDEX_NAME} and the top{" "}
              {FREE_CATALOG_LIMIT}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dash-muted">
              Portfolio, wardrobe, full board, compare, alerts, and deal checks
              live on Plus. Plus is free for now.
            </p>
            <Link
              href="/plus"
              className="mt-4 inline-flex items-center rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
            >
              Open Plus →
            </Link>
          </section>

          {publicPlus ? <PlusInterest variant="panel" source="home" /> : null}
        </div>
      </main>
      <SiteFooter />
      {publicPlus ? <PlusPopup /> : null}
    </div>
  );
}
