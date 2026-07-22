import Link from "next/link";
import { plusPublicEnabled } from "@/lib/plus/config";

export function DataModeBanner({
  mode,
  badge,
  detail,
}: {
  mode: "live" | "cached" | "offline";
  badge: string;
  detail: string;
}) {
  const tone =
    mode === "live"
      ? "border-dash-up/30 bg-[rgba(38,166,154,0.08)] text-dash-up"
      : mode === "cached"
        ? "border-dash-accent/35 bg-[rgba(212,160,23,0.08)] text-dash-accent"
        : "border-dash-border bg-dash-elevated text-dash-muted";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 sm:px-5 ${tone}`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <span className="rounded-full border border-current/20 bg-dash-bg/40 px-2.5 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em]">
          {badge}
        </span>
        <p className="text-sm text-dash-text/90">{detail}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {mode !== "live" && plusPublicEnabled() ? (
          <Link
            href="/plus"
            className="shrink-0 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted underline-offset-4 hover:text-dash-text hover:underline"
          >
            Plus soon
          </Link>
        ) : null}
        <Link
          href="/about"
          className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted underline-offset-4 hover:text-dash-text hover:underline"
        >
          How it works
        </Link>
      </div>
    </div>
  );
}
