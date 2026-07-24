import { CatalogMarketsExplorer } from "@/components/catalog/CatalogMarketsExplorer";
import { DataModeBanner } from "@/components/layout/DataModeBanner";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";
import { getDataModeLabel } from "@/lib/dataMode";
import { FREE_CATALOG_LIMIT, gateCatalogRows, getPlusAccess } from "@/lib/plus/access";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Markets",
  description:
    "Browse the SPI Markets top-seller board — StockX-style asks, rank, and weekly volume.",
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
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <header className="animate-rise max-w-2xl">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
              Board
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-dash-text md:text-5xl">
              Markets
            </h1>
            <p className="mt-3 text-base leading-relaxed text-dash-muted md:text-lg">
              Top {quotes.length} sneakers by sales volume — board # is 1–
              {quotes.length} in order; StockX’s own rank is noted under each
              name (it can skip numbers for non-sneakers). Open a pair for deal
              check. Compare and alerts sit here too.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em]">
              <Link
                href="/alerts"
                className="rounded-lg border border-dash-border px-3 py-1.5 text-dash-muted hover:border-dash-muted hover:text-dash-text"
              >
                Alerts
              </Link>
              <Link
                href="/compare"
                className="rounded-lg border border-dash-border px-3 py-1.5 text-dash-muted hover:border-dash-muted hover:text-dash-text"
              >
                Compare
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-dash-border px-3 py-1.5 text-dash-muted hover:border-dash-muted hover:text-dash-text"
              >
                SPI index
              </Link>
            </div>
          </header>
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
      <SiteFooter />
    </div>
  );
}
