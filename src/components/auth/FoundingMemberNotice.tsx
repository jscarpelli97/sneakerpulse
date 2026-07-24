import {
  FOUNDING_MEMBER_CAP,
  FOUNDING_PRICE_USD,
  FOUNDING_TERM_LABEL,
  FREE_BENEFITS,
} from "@/lib/plus/public";

/**
 * Shown on Create account — sets Plus / founding expectations.
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
        Founding · open now
      </p>
      <p className="mt-1.5">
        Free keeps <span className="text-dash-text">{freeKeep}</span>.{" "}
        <span className="text-dash-text">Plus</span> unlocks the full board and
        tools — pay with card, or request a Lightning invoice from John.
      </p>
      <p className="mt-2 text-dash-text">
        Founding deal: the first {FOUNDING_MEMBER_CAP} paid members get $
        {FOUNDING_PRICE_USD} for the {FOUNDING_TERM_LABEL}. After that we&apos;ll
        reassess pricing based on what people actually use.
      </p>
    </aside>
  );
}
