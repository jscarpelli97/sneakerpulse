import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: "Mine",
  description: `Your collection on ${BRAND_NAME} — portfolio value and wardrobe fits, same account.`,
  alternates: { canonical: "/mine" },
};

const DOORS = [
  {
    href: "/portfolio",
    label: "Portfolio",
    body: "Log what you paid and mark it to your size’s ask — not the all-size low.",
    cta: "Open portfolio →",
  },
  {
    href: "/wardrobe",
    label: "Wardrobe",
    body: "Closet + fits from real outfit ideas, synced with the same account.",
    cta: "Open wardrobe →",
  },
] as const;

export default function MinePage() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Mine · your collection" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <header className="space-y-4">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              Mine
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              What you own and wear
            </h1>
            <p className="text-lg leading-relaxed text-dash-muted">
              After you check {BRAND_NAME} for the market and a pair, this is
              where it gets personal — same login for value and fits. Part of
              Plus; free for now.
            </p>
          </header>

          <ul className="grid gap-4 sm:grid-cols-2">
            {DOORS.map((door) => (
              <li key={door.href}>
                <Link
                  href={door.href}
                  className="group flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/30 px-5 py-5 transition-colors hover:border-dash-muted hover:bg-dash-elevated/55"
                >
                  <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-dash-text group-hover:text-white">
                    {door.label}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-dash-muted">
                    {door.body}
                  </p>
                  <span className="mt-4 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
                    {door.cta}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-sm text-dash-faint">
            Still figuring out the market?{" "}
            <Link href="/" className="text-dash-link hover:underline">
              Start with SPI on the homepage
            </Link>{" "}
            or{" "}
            <Link href="/plus" className="text-dash-link hover:underline">
              see everything on Plus
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
