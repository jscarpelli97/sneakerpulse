"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const STORAGE_KEY = "sp-plus-popup-dismissed-v1";
const SHOW_AFTER_MS = 2800;

/** First-visit modal pitching live Plus checkout. */
export function PlusPopup() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label="Close Plus dialog"
        onClick={dismiss}
      />
      <div className="relative z-10 w-full max-w-lg animate-rise overflow-hidden rounded-2xl border border-dash-accent/30 bg-dash-surface shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="border-b border-dash-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.16em] text-dash-accent">
                SPI Plus · live
              </p>
              <h2
                id={titleId}
                className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-dash-text"
              >
                Clearer tape. Less noise.
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={dismiss}
              className="rounded-lg px-2 py-1 text-dash-faint hover:bg-dash-elevated hover:text-dash-muted"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-dash-muted">
            Full Markets board, Compare, Deal check, and Collection — built for
            collectors and shop floors who want a bias-light read on asks.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <ul className="space-y-2 text-sm text-dash-muted">
            <li>
              <span className="text-dash-text">Collectors</span> — spot
              under-retail asks and momentum without influencer spin.
            </li>
            <li>
              <span className="text-dash-text">Resellers & storefronts</span> —
              a cleaner read on keep vs dump across your shelves.
            </li>
            <li>
              <span className="text-dash-text">Founding</span> — first 100 paid
              members get $10 for the first year.
            </li>
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/plus#checkout"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
            >
              Upgrade to Plus →
            </Link>
            <Link
              href="/plus#compare"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
            >
              Free vs Plus
            </Link>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-dash-faint hover:text-dash-muted"
          >
            Maybe later
          </button>
          <p className="text-[11px] leading-relaxed text-dash-faint">
            Not investment advice. Markets move — do your own research.
          </p>
        </div>
      </div>
    </div>
  );
}
