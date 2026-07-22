import { AlertsClient } from "@/components/alerts/AlertsClient";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getTrackedCatalog } from "@/services/catalog/sneakers";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const sneakers = await getTrackedCatalog();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader subtitle="Alerts" />
      <main className="page-shell flex-1">
        <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 md:px-6 md:py-10">
          <section className="animate-rise max-w-2xl">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-ink/40">
              Tools
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Price alerts
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-soft md:text-lg">
              Set above/below thresholds on any of the current top 100 StockX
              sellers. Optional webhook delivery on check.
            </p>
          </section>
          <div className="animate-rise stagger-2">
            <AlertsClient sneakers={sneakers} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
