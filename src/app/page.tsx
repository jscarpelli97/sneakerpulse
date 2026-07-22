import { CatalogTable } from "@/components/catalog/CatalogTable";
import { MarketsHero } from "@/components/catalog/MarketsHero";
import { MarketsStatStrip } from "@/components/catalog/MarketsStatStrip";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getFeaturedSneaker, SNEAKERS } from "@/services/catalog/sneakers";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";

export const revalidate = 300;

export default async function MarketsIndexPage() {
  const featuredEntry = getFeaturedSneaker();
  const quotes = await getCatalogQuotes();
  const liveCount = quotes.filter((row) => row.live).length;
  const featured =
    quotes.find((row) => row.slug === featuredEntry.slug) ??
    quotes[0] ??
    ({
      ...featuredEntry,
      price: null,
      rank: null,
      weeklyOrders: null,
      live: false,
    } as const);

  const statusLabel = liveCount
    ? `${liveCount}/${SNEAKERS.length} markets live`
    : `${SNEAKERS.length} tracked markets`;

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle={statusLabel} variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:space-y-7 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10">
          <MarketsHero
            featured={featured}
            liveCount={liveCount}
            totalMarkets={SNEAKERS.length}
          />
          <MarketsStatStrip quotes={quotes} liveCount={liveCount} />
          <CatalogTable rows={quotes} variant="dashboard" />
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
