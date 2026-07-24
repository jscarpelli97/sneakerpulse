"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/collection/portfolio",
    label: "Portfolio",
    hint: "Value vs what you paid",
  },
  {
    href: "/collection/wardrobe",
    label: "Wardrobe",
    hint: "Closet · Fits",
  },
] as const;

export function CollectionTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-dash-border bg-dash-surface/60">
      <div className="mx-auto flex max-w-[1400px] gap-1 px-3 sm:px-6 lg:px-8">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${
                active
                  ? "text-dash-text"
                  : "text-dash-muted hover:text-dash-text"
              }`}
            >
              <span className="font-[family-name:var(--font-syne)]">
                {tab.label}
              </span>
              <span className="ml-2 hidden font-[family-name:var(--font-plex-mono)] text-[10px] font-normal uppercase tracking-[0.12em] text-dash-faint sm:inline">
                {tab.hint}
              </span>
              {active ? (
                <span
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-dash-accent sm:inset-x-4"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
