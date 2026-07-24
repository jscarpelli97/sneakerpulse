import {
  FOUNDING_MEMBER_CAP,
  FOUNDING_PRICE_USD,
  FOUNDING_TERM_LABEL,
  FREE_BENEFITS,
} from "@/lib/plus/public";

/**
 * Shown on Create account — sets Plus expectations without killing soft-launch energy.
 */
export function FoundingMemberNotice({
  className = "",
}: {
  className?: string;
} = {}) {
  const freeKeep = FREE_BENEFITS.filter((line) => !line.startsWith("No account"))
    .join(" · ");

  return (
    <aside
      className={`rounded-xl border border-dash-border/80 bg-dash-elevated/40 px-3.5 py-3 text-xs leading-relaxed text-dash-muted ${className}`}
    >
      <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-accent">
        Soft launch · heads up
      </p>
      <p className="mt-1.5">
        Right now the full site is open and free while we test with early
        users. When{" "}
        <span className="text-dash-text">Plus</span> goes live, free keeps{" "}
        <span className="text-dash-text">{freeKeep}</span>. Plus unlocks the
        rest of the board and tools.
      </p>
      <p className="mt-2 text-dash-text">
        Founding deal: the first {FOUNDING_MEMBER_CAP} accounts get $
        {FOUNDING_PRICE_USD} for the {FOUNDING_TERM_LABEL}. After that we’ll
        reassess pricing based on what people actually use.
      </p>
    </aside>
  );
}
