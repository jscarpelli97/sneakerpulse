import {
  FREE_BENEFITS,
  PLAN_COMPARE,
  PLUS_BENEFITS,
  type PlanCell,
} from "@/lib/plus/public";

function cellClass(state: PlanCell["state"]) {
  if (state === "yes") return "text-dash-up";
  if (state === "soon") return "text-dash-accent";
  if (state === "limited") return "text-dash-muted";
  return "text-dash-faint";
}

function CellMark({ cell }: { cell: PlanCell }) {
  const mark =
    cell.state === "yes"
      ? "✓"
      : cell.state === "soon"
        ? "◐"
        : cell.state === "limited"
          ? "◦"
          : "—";
  return (
    <span className={`font-semibold tabular-nums ${cellClass(cell.state)}`}>
      <span className="mr-1.5 opacity-80" aria-hidden>
        {mark}
      </span>
      {cell.label}
    </span>
  );
}

/**
 * Readable Plus pitch + free vs paid checklist.
 * Shown to everyone on /plus (before sign-in / checkout).
 */
export function PlusPlanOverview({
  priceUsd,
  termDays,
}: {
  priceUsd?: number | null;
  termDays?: number | null;
}) {
  const price = priceUsd ?? 10;
  const term = termDays ?? 30;

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
          SPI Plus
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          What you get
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-dash-muted">
          Free keeps the terminal open. Plus unlocks the full board, Collection,
          and the Restock Monitor roadmap — paid with Lightning or on-chain
          Bitcoin only.
        </p>
        <p className="font-[family-name:var(--font-plex-mono)] text-sm text-dash-text">
          ${price}
          <span className="text-dash-muted"> / {term} days</span>
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-dash-border bg-dash-elevated/30 p-5">
          <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
            Free forever
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold">
            Stay on the board
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-dash-muted">
            {FREE_BENEFITS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-dash-up">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-dash-accent/30 bg-[rgba(212,160,23,0.06)] p-5">
          <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-accent">
            Plus membership
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold">
            Unlock the rest
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-dash-muted">
            {PLUS_BENEFITS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-dash-accent">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="compare" className="scroll-mt-24 space-y-4">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
            Checklist
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight">
            Free vs Plus
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-dash-muted">
            Read through each line — limited means the free top sellers only;
            coming soon ships to Plus members first.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-dash-border">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] border-b border-dash-border bg-dash-elevated/50 text-[11px] font-semibold uppercase tracking-[0.1em] text-dash-faint sm:text-xs">
            <div className="px-3 py-3 sm:px-4">Feature</div>
            <div className="px-3 py-3 sm:px-4">Free</div>
            <div className="px-3 py-3 text-dash-accent sm:px-4">Plus</div>
          </div>
          {PLAN_COMPARE.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] border-b border-dash-border last:border-b-0 hover:bg-dash-elevated/25"
            >
              <div className="px-3 py-3.5 sm:px-4">
                <p className="text-sm font-semibold text-dash-text">
                  {row.feature}
                </p>
                <p className="mt-1 hidden text-xs leading-relaxed text-dash-faint sm:block">
                  {row.detail}
                </p>
              </div>
              <div className="px-3 py-3.5 text-sm sm:px-4">
                <CellMark cell={row.free} />
              </div>
              <div className="px-3 py-3.5 text-sm sm:px-4">
                <CellMark cell={row.plus} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-dash-faint sm:hidden">
          Tip: wider screens show a short note under each feature.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border-l-2 border-dash-accent/50 pl-4">
          <p className="font-[family-name:var(--font-syne)] font-bold">
            Collectors
          </p>
          <p className="mt-1.5 text-sm text-dash-muted">
            Spot under-retail asks and momentum without influencer spin.
          </p>
        </div>
        <div className="border-l-2 border-dash-up/50 pl-4">
          <p className="font-[family-name:var(--font-syne)] font-bold">
            Resellers &amp; storefronts
          </p>
          <p className="mt-1.5 text-sm text-dash-muted">
            A cleaner keep-vs-dump read across your inventory.
          </p>
        </div>
      </section>
    </div>
  );
}
