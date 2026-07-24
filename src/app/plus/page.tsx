import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusOverview } from "@/components/plus/PlusOverview";
import { INDEX_NAME } from "@/lib/brand";
import { FREE_CATALOG_LIMIT } from "@/lib/plus/access";
import { plusPublicEnabled } from "@/lib/plus/config";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const checkoutLive = plusPublicEnabled();
  return {
    title: "Plus — SPI Markets",
    description: checkoutLive
      ? `Plus unlocks the full ${INDEX_NAME} Markets suite beyond the free top ${FREE_CATALOG_LIMIT} board.`
      : `Plus is the full ${INDEX_NAME} Markets suite — free for now. Free homepage stays ${INDEX_NAME} + top ${FREE_CATALOG_LIMIT} asks.`,
    alternates: { canonical: "/plus" },
  };
}

export default function PlusPage() {
  const checkoutLive = plusPublicEnabled();

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader
        subtitle={
          checkoutLive ? "Plus · membership" : "Plus · free for now"
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <PlusOverview />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
