import { AlertsClient } from "@/components/alerts/AlertsClient";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";
import { FREE_CATALOG_LIMIT, gateCatalogRows, getPlusAccess } from "@/lib/plus/access";
import { getTrackedCatalog } from "@/services/catalog/sneakers";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [{ isPlus }, all] = await Promise.all([
    getPlusAccess(),
    getTrackedCatalog(),
  ]);
  const access = gateCatalogRows(all, isPlus);
  const sneakers = access.rows;

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader
        subtitle={
          access.gated
            ? `Alerts · free top ${FREE_CATALOG_LIMIT}`
            : "Alerts"
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <section className="animate-rise max-w-2xl">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
              Tools
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-dash-text md:text-5xl">
              Price alerts
            </h1>
            <p className="mt-3 text-base leading-relaxed text-dash-muted md:text-lg">
              Set above/below thresholds
              {access.gated
                ? ` on the free top ${FREE_CATALOG_LIMIT} sellers.`
                : " on any pair on the Plus board."}
            </p>
          </section>
          {access.gated ? (
            <PlusCatalogGate
              visible={access.visible}
              total={access.total}
              freeLimit={access.freeLimit}
            />
          ) : null}
          <div className="animate-rise stagger-2">
            <AlertsClient sneakers={sneakers} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
