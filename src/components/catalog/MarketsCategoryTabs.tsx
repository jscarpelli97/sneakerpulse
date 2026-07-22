import Link from "next/link";
import { clothingPublicEnabled } from "@/lib/brand";

const TABS = [
  { href: "/markets", label: "Sneakers", match: "sneakers" as const },
  { href: "/clothing", label: "Clothing", match: "clothing" as const },
] as const;

/** Sneakers / Clothing switch under the markets tools. Hidden when clothing is off. */
export function MarketsCategoryTabs({
  active,
}: {
  active: "sneakers" | "clothing";
}) {
  if (!clothingPublicEnabled()) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="mr-1 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
        Board
      </p>
      {TABS.map((tab) => {
        const on = tab.match === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
              on
                ? "bg-dash-accent text-dash-bg"
                : "border border-dash-border text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
