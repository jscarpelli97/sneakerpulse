import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusApp } from "@/components/plus/PlusApp";

export const metadata = {
  title: "Plus — SneakerPulse",
  description:
    "Free vs Plus checklist: full board, email alerts, Restock Monitor. Upgrade with Bitcoin or Lightning.",
};

export default function PlusPage() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Plus · Bitcoin checkout" variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <PlusApp />
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
