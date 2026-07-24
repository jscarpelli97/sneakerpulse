import Link from "next/link";
import { PRODUCT_PILLARS, PRODUCT_TOOLS } from "@/lib/brand";

/**
 * Product suite — pillars then tools.
 * Lives on Plus; homepage free surface is SPI + top-10 board only.
 */
export function ProductSuite({
  eyebrow = "What Plus includes",
}: {
  eyebrow?: string;
} = {}) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="animate-rise">
        <div className="mb-4">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text sm:text-2xl">
            What you can’t stitch together on StockX alone
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dash-muted sm:text-base">
            Index for the market, a board for pairs, and a collection for what
            you own and wear.
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
        <div className="mb-4">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            Built into Markets
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text sm:text-2xl">
            Tools when you’re deciding
          </h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PRODUCT_TOOLS.map((tool) => (
            <li key={tool.title}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/20 px-4 py-4 transition-colors hover:border-dash-muted hover:bg-dash-elevated/50"
              >
                <p className="font-[family-name:var(--font-syne)] text-base font-bold text-dash-text transition-colors group-hover:text-white">
                  {tool.title}
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-dash-muted">
                  {tool.body}
                </p>
                <span className="mt-3 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
                  Open in Markets →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
