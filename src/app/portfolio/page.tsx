import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PortfolioApp } from "@/components/portfolio/PortfolioApp";

export const metadata = {
  title: "Portfolio",
  description:
    "Track your sneaker collection across devices. See market asks vs what you paid.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Collection tracker" />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <PortfolioApp />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
