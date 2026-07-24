"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sp-plus-top-dismissed-v1";

/** Slim top strip — always visible until dismissed for the session/browser. */
export function PlusTopCallout() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div className="border-b border-dash-accent/25 bg-[rgba(212,160,23,0.1)]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <p className="min-w-0 text-sm leading-snug text-dash-text">
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-accent">
            Plus · live
          </span>{" "}
          <span className="text-dash-muted">
            Full board + Collection — founding $10 / first year for the first
            100.
          </span>{" "}
          <Link
            href="/plus#checkout"
            className="font-medium text-dash-accent underline-offset-2 hover:underline"
          >
            Upgrade
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg px-2 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint hover:bg-dash-elevated hover:text-dash-muted"
          aria-label="Dismiss Plus callout"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
