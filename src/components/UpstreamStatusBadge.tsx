import type { UpstreamStatus } from "@/lib/market/types";

const LABELS: Record<UpstreamStatus, string> = {
  live: "Live",
  degraded: "Degraded",
  cached: "Cached",
  offline: "Offline",
};

const TONES: Record<UpstreamStatus, string> = {
  live: "bg-up/15 text-up",
  degraded: "bg-heat/15 text-heat",
  cached: "bg-paper text-ink/55",
  offline: "bg-ink/10 text-ink/45",
};

export function UpstreamStatusBadge({ status }: { status: UpstreamStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${TONES[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 ${
          status === "live" ? "animate-blink bg-up" : "bg-current"
        }`}
      />
      {LABELS[status]}
    </span>
  );
}
