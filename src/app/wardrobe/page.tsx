import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { WardrobeApp } from "@/components/wardrobe/WardrobeApp";

export const metadata = {
  title: "Wardrobe",
  description:
    "Closet and Fits — build outfits from your sneakers and custom pieces on this device.",
  alternates: { canonical: "/wardrobe" },
};

export default function WardrobePage() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Closet · Fits" />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <WardrobeApp />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
