import Link from "next/link";
import { PRODUCT_PILLARS, PRODUCT_TOOLS } from "@/lib/brand";

/**
 * “What do we provide?” — pillars then tools.
 * Sits after identity (hero) and differentiation (SPI).
 */
export function HomeWhatWeProvide() {
  return (
    <div className="space-y-6 sm:space-y-7 lg:space-y-8">
      <section className="animate-rise">
        <div className="mb-3">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            What we provide
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
            Four things you can’t stitch together on StockX alone
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-dash-muted">
            Index for the market, a board for pairs, a portfolio for what you
            paid, and a wardrobe for what you wear.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_PILLARS.map((pillar, index) => (
            <li key={pillar.title}>
              <Link
                href={pillar.href}
                className="group flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/30 px-4 py-4 transition-colors hover:border-dash-muted hover:bg-dash-elevated/55"
              >
                <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 font-[family-name:var(--font-syne)] text-base font-bold text-dash-text transition-colors group-hover:text-white">
                  {pillar.title}
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-dash-muted">
                  {pillar.body}
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
            On every pair
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
            Tools when you’re deciding
          </h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {PRODUCT_TOOLS.map((tool) => {
            const href = "href" in tool && tool.href ? tool.href : "/markets";
            const label =
              tool.title === "Deal check" ? "Open a pair →" : "Open →";
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
