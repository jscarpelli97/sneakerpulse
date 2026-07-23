import Link from "next/link";
import { PRODUCT_TOOLS } from "@/lib/brand";

const COLLECTION = [
  {
    title: "Portfolio",
    href: "/portfolio",
    body: "What you own, sized asks vs what you paid — synced across devices.",
    era: "Next",
  },
  {
    title: "Wardrobe",
    href: "/wardrobe",
    body: "Closet + fits from real outfit ideas.",
    era: "Recent",
  },
] as const;

/**
 * Homepage blocks after the board — chronological: collection, then tools.
 */
export function HomeLaterChapters() {
  return (
    <div className="space-y-6 sm:space-y-7 lg:space-y-8">
      <section className="animate-rise">
        <div className="mb-3">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            Then yours
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
            Portfolio & wardrobe
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-dash-muted">
            After the index and the board — track what you own and what you
            wear.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {COLLECTION.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/30 px-4 py-4 transition-colors hover:border-dash-muted hover:bg-dash-elevated/55"
              >
                <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                  {item.era}
                </p>
                <p className="mt-1 font-[family-name:var(--font-syne)] text-base font-bold text-dash-text transition-colors group-hover:text-white">
                  {item.title}
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-dash-muted">
                  {item.body}
                </p>
                <span className="mt-3 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
                  Open →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="animate-rise">
        <div className="mb-3">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            Most recent
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
            Tools on the board
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-dash-muted">
            Deal check lives on every pair page. Compare and alerts are ready
            when you need them.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {PRODUCT_TOOLS.map((tool) => {
            const href =
              "href" in tool && tool.href
                ? tool.href
                : "/markets";
            const label =
              tool.title === "Deal check" ? "Browse pairs →" : "Open →";
            return (
              <li key={tool.title}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/20 px-4 py-4 transition-colors hover:border-dash-muted hover:bg-dash-elevated/50"
                >
                  <p className="font-[family-name:var(--font-syne)] text-base font-bold text-dash-text transition-colors group-hover:text-white">
                    {tool.title}
                  </p>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-dash-muted">
                    {tool.body}
                  </p>
                  <span className="mt-3 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
