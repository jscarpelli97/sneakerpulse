import type { UpstreamStatus } from "@/types/market";

const LABELS: Record<UpstreamStatus, string> = {
  live: "Live",
  degraded: "Degraded",
  cached: "Snapshot",
  offline: "Offline",
};

const TONES: Record<UpstreamStatus, string> = {
  live: "bg-dash-up/15 text-dash-up",
  degraded: "bg-heat/15 text-heat",
  cached: "bg-dash-elevated text-dash-muted",
  offline: "bg-dash-elevated text-dash-faint",
};

export function UpstreamStatusBadge({ status }: { status: UpstreamStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${TONES[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 ${
          status === "live" ? "animate-blink bg-dash-up" : "bg-current"
        }`}
      />
      {LABELS[status]}
    </span>
  );
}
