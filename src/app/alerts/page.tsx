import { AlertsClient } from "@/components/alerts/AlertsClient";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";
import { gateCatalogRows, getPlusAccess } from "@/lib/plus/access";
import { getTrackedCatalog } from "@/services/catalog/sneakers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alerts",
  description:
    "Browser price alerts for sneaker asks — set above/below thresholds and check the tape.",
  alternates: { canonical: "/alerts" },
};

export default async function AlertsPage() {
  const [{ isPlus, publicPlus }, all] = await Promise.all([
    getPlusAccess(),
    getTrackedCatalog(),
  ]);
  const access = gateCatalogRows(all, isPlus);
  const sneakers = access.rows;

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader
        subtitle={
          publicPlus
            ? isPlus
              ? "Alerts · Plus"
              : "Alerts · Plus feature"
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
              {publicPlus ? "Email alerts" : "Price alerts"}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-dash-muted md:text-lg">
              {publicPlus
                ? isPlus
                  ? `Threshold alerts to your inbox${access.gated ? "" : " across the Plus board"}.`
                  : "Email price alerts are a Plus feature. Free stays on browser thresholds below."
                : "Save above/below thresholds in this browser, then check asks against them anytime."}
            </p>
          </section>
          {access.gated && publicPlus && isPlus ? (
            <PlusCatalogGate
              visible={access.visible}
              total={access.total}
              freeLimit={access.freeLimit}
            />
          ) : null}
          <div className="animate-rise stagger-2">
            <AlertsClient
              sneakers={sneakers}
              isPlus={isPlus}
              publicPlus={publicPlus}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
