import Image from "next/image";
import Link from "next/link";
import type {
  MarketsQuickLook,
  QuickLookKind,
  QuickLookPick,
} from "@/services/market/getQuickLook";
import type { MarketTone } from "@/types/summary";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

const KIND_META: Record<
  QuickLookKind,
  { eyebrow: string; empty: string }
> = {
  best_value: {
    eyebrow: "Best investment",
    empty: "Need asks + retail to screen value",
  },
  bullish: {
    eyebrow: "Most bullish",
    empty: "No clear bullish setup in sample",
  },
  bearish: {
    eyebrow: "Most bearish",
    empty: "No clear bearish setup in sample",
  },
  mixed: {
    eyebrow: "Most mixed",
    empty: "No mixed setup in sample",
  },
};

const TONE_BADGE: Record<MarketTone, string> = {
  bullish: "bg-[rgba(38,166,154,0.14)] text-dash-up",
  bearish: "bg-[rgba(239,83,80,0.14)] text-dash-down",
  mixed: "bg-[rgba(212,160,23,0.14)] text-dash-accent",
  neutral: "bg-dash-elevated text-dash-muted",
  insufficient: "bg-dash-elevated text-dash-faint",
};

const TONE_BORDER: Record<MarketTone, string> = {
  bullish: "border-l-dash-up",
  bearish: "border-l-dash-down",
  mixed: "border-l-dash-accent",
  neutral: "border-l-dash-muted",
  insufficient: "border-l-dash-faint",
};

const ORDER: QuickLookKind[] = [
  "best_value",
  "bullish",
  "bearish",
  "mixed",
];

function PickCard({ pick }: { pick: QuickLookPick }) {
  const meta = KIND_META[pick.kind];
  return (
    <Link
      href={`/sneakers/${pick.slug}`}
      className={`dash-card dash-card-hover group flex h-full flex-col overflow-hidden border-l-4 animate-rise ${TONE_BORDER[pick.tone]}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-dash-border px-4 py-3">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
          {meta.eyebrow}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] ${TONE_BADGE[pick.tone]}`}
        >
          {pick.tone}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-dash-border bg-dash-elevated transition-transform group-hover:scale-[1.03]">
            <Image
              src={pick.image}
              alt={pick.name}
              fill
              className="object-contain p-1.5"
              sizes="56px"
            />
          </span>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
              {pick.ticker}
              {pick.rank != null ? ` · #${pick.rank}` : ""}
            </p>
            <p className="mt-0.5 line-clamp-2 font-[family-name:var(--font-syne)] text-base font-bold leading-snug text-dash-text group-hover:text-white">
              {pick.name}
            </p>
          </div>
        </div>
        <div>
          <p className="font-[family-name:var(--font-syne)] text-sm font-semibold text-dash-text">
            {pick.headline}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-dash-muted">
            {pick.detail}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-dash-border/80 pt-3">
          <div>
            <p className="font-[family-name:var(--font-plex-mono)] text-lg font-semibold tabular-nums text-dash-text">
              {formatMaybeMoney(pick.price)}
            </p>
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-faint">
              Retail {formatMaybeMoney(pick.retail)}
              {pick.weeklyOrders != null
                ? ` · ${formatNumber(pick.weeklyOrders)}/wk`
                : ""}
            </p>
          </div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted">
            {pick.metricLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyCard({ kind }: { kind: QuickLookKind }) {
  return (
    <article className="dash-card flex h-full flex-col justify-between border-l-4 border-l-dash-faint px-4 py-4 opacity-70">
      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
        {KIND_META[kind].eyebrow}
      </p>
      <p className="mt-6 text-sm text-dash-muted">{KIND_META[kind].empty}</p>
    </article>
  );
}

export function MarketsQuickLook({
  look,
}: {
  look: MarketsQuickLook;
}) {
  const byKind = new Map(look.picks.map((pick) => [pick.kind, pick]));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
            Quick look
          </h2>
          <p className="mt-1 text-sm text-dash-muted">
            Best value plus the strongest bullish, bearish, and mixed setups in
            the top {look.scanned} sellers
          </p>
        </div>
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
          Rules + value screen
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((kind, index) => {
          const pick = byKind.get(kind);
          return (
            <div key={kind} className={`stagger-${index + 1}`}>
              {pick ? <PickCard pick={pick} /> : <EmptyCard kind={kind} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
