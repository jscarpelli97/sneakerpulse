import Link from "next/link";

const TABS = [
  { href: "/markets", label: "Sneakers", match: "sneakers" },
  { href: "/clothing", label: "Clothing", match: "clothing" },
] as const;

/** Sneakers / Clothing switch under the markets tools. */
export function MarketsCategoryTabs({
  active,
}: {
  active: "sneakers" | "clothing";
}) {
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
