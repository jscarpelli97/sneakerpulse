import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusApp } from "@/components/plus/PlusApp";
import { PlusPausedNotice } from "@/components/plus/PlusPausedNotice";
import { plusPublicEnabled } from "@/lib/plus/config";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const publicPlus = plusPublicEnabled();
  return {
    title: "Plus — SPI Markets",
    description: publicPlus
      ? "Free vs Plus checklist: full board, email alerts, Restock Monitor. Upgrade with Bitcoin or Lightning."
      : "SPI Plus is paused while StockX API access is pending.",
  };
}

export default function PlusPage() {
  const publicPlus = plusPublicEnabled();

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader
        subtitle={publicPlus ? "Plus · Bitcoin checkout" : "Plus · paused"}
        variant="dashboard"
      />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          {publicPlus ? <PlusApp /> : <PlusPausedNotice />}
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
