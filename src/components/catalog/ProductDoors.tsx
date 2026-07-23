import Link from "next/link";
import { PRODUCT_PILLARS } from "@/lib/brand";

/** Four product doors under SPI — index, board, portfolio, wardrobe. */
export function ProductDoors() {
  return (
    <section className="animate-rise">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            What you can do
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
            Four doors into SPI Markets
          </h2>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCT_PILLARS.map((pillar) => (
          <li key={pillar.title}>
            <Link
              href={pillar.href}
              className="group flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/30 px-4 py-4 transition-colors hover:border-dash-muted hover:bg-dash-elevated/55"
            >
              <p className="font-[family-name:var(--font-syne)] text-base font-bold text-dash-text transition-colors group-hover:text-white">
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
  );
}
