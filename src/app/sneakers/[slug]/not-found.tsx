import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export default function NotFound() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader />
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-dash-text">
            Sneaker not found
          </h1>
          <p className="mt-3 text-dash-muted">
            That slug is not in the SPI Markets catalog yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-dash-accent px-4 py-2 text-sm font-semibold text-dash-bg hover:brightness-110"
          >
            Back to markets
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
