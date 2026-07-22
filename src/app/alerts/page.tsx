import { AlertsClient } from "@/components/alerts/AlertsClient";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export default function AlertsPage() {
  return (
    <>
      <SiteHeader subtitle="Alerts" />
      <main className="flex-1 bg-[linear-gradient(180deg,#eef1f4_0%,#e6eaef_45%,#eef1f4_100%)]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
          <section className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink">
              Price alerts
            </h1>
            <p className="mt-3 text-ink-soft">
              Set above/below thresholds on tracked sneakers. Optional webhook
              delivery on check.
            </p>
          </section>
          <AlertsClient />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
