import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-paper px-4 py-16 md:px-6">
        <div className="mx-auto max-w-xl">
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-ink">
            Sneaker not found
          </h1>
          <p className="mt-3 text-ink-soft">
            That slug is not in the SneakerPulse catalog yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Back to markets
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
