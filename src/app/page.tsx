import { CatalogTable } from "@/components/catalog/CatalogTable";
import { MarketsHero } from "@/components/catalog/MarketsHero";
import { MarketsStatStrip } from "@/components/catalog/MarketsStatStrip";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";

export const revalidate = 300;

export default async function MarketsIndexPage() {
  const quotes = await getCatalogQuotes(TOP_SELLERS_LIMIT);
  const liveCount = quotes.filter((row) => row.live).length;
  const featured =
    quotes.find((row) => row.featured) ??
    quotes[0] ??
    null;

  const statusLabel = liveCount
    ? `${liveCount}/${quotes.length} top sellers live`
    : `${quotes.length} top StockX sellers`;

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle={statusLabel} variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:space-y-7 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10">
          {featured ? (
            <MarketsHero
              featured={featured}
              liveCount={liveCount}
              totalMarkets={quotes.length}
            />
          ) : null}
          <MarketsStatStrip quotes={quotes} liveCount={liveCount} />
          <CatalogTable rows={quotes} variant="dashboard" />
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
