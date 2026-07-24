"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import { rememberCatalogHit } from "@/lib/catalog/rememberClient";

/**
 * Header search — local debounce via useCatalogSearch (no KicksDB until 2+ chars).
 * Selecting a hit opens the pair page.
 */
export function SiteSearch({
  initialQuery = "",
  className = "",
}: {
  initialQuery?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const { hits, busy } = useCatalogSearch(query, open);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function goToPair(slug: string, hit?: (typeof hits)[number]) {
    if (hit) rememberCatalogHit(hit);
    setOpen(false);
    setQuery("");
    startTransition(() => {
      router.push(`/sneakers/${slug}`);
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (hits[0]) {
      goToPair(hits[0].slug, hits[0]);
      return;
    }
    startTransition(() => {
      router.push(q ? `/markets?q=${encodeURIComponent(q)}` : "/markets");
    });
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <form
        onSubmit={submit}
        className="flex min-w-0 items-center"
        role="search"
      >
        <label className="sr-only" htmlFor="site-sneaker-search">
          Search sneakers
        </label>
        <input
          id="site-sneaker-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search any pair…"
          className="min-w-0 flex-1 rounded-lg border border-dash-border bg-dash-elevated px-2.5 py-1.5 font-[family-name:var(--font-instrument)] text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent md:w-44 md:flex-none lg:w-56"
          autoComplete="off"
        />
        <button
          type="submit"
          className="ml-1.5 rounded-lg border border-dash-border px-2.5 py-1.5 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
        >
          Go
        </button>
      </form>
      {open && query.trim().length >= 2 ? (
        <ul className="absolute right-0 z-50 mt-1 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-dash-border bg-dash-surface shadow-[var(--shadow-md)]">
          {busy && hits.length === 0 ? (
            <li className="px-3 py-3 text-sm text-dash-muted">Searching…</li>
          ) : hits.length === 0 ? (
            <li className="px-3 py-3 text-sm text-dash-muted">
              No matches — Enter searches Markets.
            </li>
          ) : (
            hits.slice(0, 8).map((hit) => (
              <li key={hit.slug}>
                <Link
                  href={`/sneakers/${hit.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-dash-elevated"
                  onClick={() => {
                    rememberCatalogHit(hit);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-dash-bg">
                    {hit.fallbackImage ? (
                      <Image
                        src={hit.fallbackImage}
                        alt=""
                        fill
                        className="object-contain p-0.5"
                        sizes="32px"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-dash-text">
                      {hit.name}
                    </span>
                    <span className="block truncate font-[family-name:var(--font-plex-mono)] text-[10px] text-dash-accent">
                      {hit.ticker}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
