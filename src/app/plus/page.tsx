import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusOverview } from "@/components/plus/PlusOverview";
import { INDEX_NAME } from "@/lib/brand";
import { FREE_CATALOG_LIMIT } from "@/lib/plus/access";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "Plus — SPI Markets",
    description: `Plus unlocks the full ${INDEX_NAME} Markets suite beyond the free top ${FREE_CATALOG_LIMIT} board. Founding: $10 / first year for the first 100.`,
    alternates: { canonical: "/plus" },
  };
}

export default function PlusPage() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Plus · membership" />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <PlusOverview />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
