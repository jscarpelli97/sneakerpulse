import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { CollectionTabs } from "@/components/collection/CollectionTabs";

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Collection" />
      <CollectionTabs />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
