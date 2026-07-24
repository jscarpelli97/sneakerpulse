"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SiteSearch } from "@/components/layout/SiteSearch";

const PRIMARY = [
  { href: "/markets", label: "Markets" },
  { href: "/mine", label: "Mine" },
  { href: "/plus", label: "Plus" },
  { href: "/about", label: "About" },
] as const;

const TOOLS = [
  { href: "/compare", label: "Compare" },
  { href: "/alerts", label: "Alerts" },
  { href: "/spi", label: "SPI index" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/wardrobe", label: "Wardrobe" },
] as const;

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="relative md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-dash-border bg-dash-elevated text-dash-text hover:border-dash-muted"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">{open ? "Close" : "Menu"}</span>
        <span aria-hidden className="flex w-4 flex-col gap-1">
          <span
            className={`h-0.5 w-full rounded-full bg-dash-text transition-transform ${
              open ? "translate-y-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-full rounded-full bg-dash-text transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-full rounded-full bg-dash-text transition-transform ${
              open ? "-translate-y-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-x-0 top-0 z-50 max-h-[min(100dvh,100%)] overflow-y-auto border-b border-dash-border bg-dash-surface pt-[env(safe-area-inset-top)] shadow-[var(--dash-shadow)]"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
                Menu
              </p>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="border-t border-dash-border px-4 py-3">
              <SiteSearch className="flex w-full" />
            </div>

            <nav className="border-t border-dash-border px-2 py-2">
              <p className="px-3 pb-1 pt-2 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                Main
              </p>
              {PRIMARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-3 text-base font-semibold ${
                    item.href === "/plus"
                      ? "text-dash-accent"
                      : "text-dash-text"
                  } hover:bg-dash-elevated`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <nav className="border-t border-dash-border px-2 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="px-3 pb-1 pt-2 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                More
              </p>
              {TOOLS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
