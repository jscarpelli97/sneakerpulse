"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SiteSearch({
  initialQuery = "",
  className = "",
}: {
  initialQuery?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    startTransition(() => {
      router.push(q ? `/markets?q=${encodeURIComponent(q)}` : "/markets");
    });
  }

  return (
    <form
      onSubmit={submit}
      className={`flex min-w-0 items-center ${className}`}
      role="search"
    >
      <label className="sr-only" htmlFor="site-sneaker-search">
        Search sneakers
      </label>
      <input
        id="site-sneaker-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search pairs…"
        className="min-w-0 flex-1 rounded-lg border border-dash-border bg-dash-elevated px-2.5 py-1.5 font-[family-name:var(--font-instrument)] text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent md:w-44 md:flex-none lg:w-56"
      />
      <button
        type="submit"
        className="ml-1.5 rounded-lg border border-dash-border px-2.5 py-1.5 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
      >
        Go
      </button>
    </form>
  );
}
