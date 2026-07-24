import Link from "next/link";
import { INDEX_EXPANSION, INDEX_NAME } from "@/lib/brand";
import { FREE_CATALOG_LIMIT } from "@/lib/plus/access";

/**
 * First-visit story: what SPI is, what an index is, why it beats a listing tab.
 */
export function HomeVisitorStory() {
  const steps = [
    {
      n: "01",
      q: `What is ${INDEX_NAME}?`,
      a: (
        <>
          <strong className="text-dash-text">{INDEX_NAME}</strong> stands for{" "}
          <strong className="text-dash-text">{INDEX_EXPANSION}</strong>. It’s
          one score for how expensive popular sneakers are on resale versus
          what they cost at retail.{" "}
          <span className="font-[family-name:var(--font-plex-mono)] text-dash-text">
            100 ≈ selling near retail
          </span>
          . Above 100 = premiums. Below 100 = sitting under retail.
        </>
      ),
    },
    {
      n: "02",
      q: "What is an index?",
      a: (
        <>
          Think of it like a market temperature — not one shoe’s ask, but a
          weighted read across a basket of bestsellers. Same idea as how the
          S&amp;P 500 summarizes stocks: one number you can check daily instead
          of opening fifty tabs.
        </>
      ),
    },
    {
      n: "03",
      q: "Why look at this?",
      a: (
        <>
          Before you buy, sell, or hold, you want to know if the{" "}
          <em className="text-dash-text not-italic">whole market</em> is rich
          or cheap — not just whether one pair looks okay. {INDEX_NAME} answers
          that in a glance, then the board lets you drill into specific shoes.
        </>
      ),
    },
    {
      n: "04",
      q: "How is this different from StockX or Google?",
      a: (
        <>
          StockX (and search) show a listing for one size of one shoe. We show
          whether sneakers as a market are expensive vs retail, whether{" "}
          <em className="text-dash-text not-italic">your</em> size is a deal,
          and what your collection is worth — plus fits in a wardrobe. Independent
          of StockX.
        </>
      ),
    },
  ] as const;

  return (
    <section className="dash-card animate-rise overflow-hidden">
      <div className="border-b border-dash-border px-5 py-5 sm:px-6 sm:py-6">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
          New here?
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-dash-text sm:text-3xl">
          Start with four questions
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dash-muted sm:text-base">
          Free forever on this page: {INDEX_NAME} and the top{" "}
          {FREE_CATALOG_LIMIT} seller asks. Everything else is Plus — free for
          now.
        </p>
      </div>
      <ol className="divide-y divide-dash-border">
        {steps.map((step) => (
          <li
            key={step.n}
            className="grid gap-3 px-5 py-5 sm:grid-cols-[auto_1fr] sm:gap-6 sm:px-6 sm:py-6"
          >
            <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums text-dash-accent">
              {step.n}
            </span>
            <div>
              <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
                {step.q}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-dash-muted sm:text-base">
                {step.a}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3 border-t border-dash-border px-5 py-4 sm:px-6">
        <Link
          href="#spi"
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          See {INDEX_NAME} today →
        </Link>
        <Link
          href="#board"
          className="rounded-xl border border-dash-border bg-dash-elevated px-4 py-2.5 text-sm font-semibold text-dash-text hover:border-dash-muted"
        >
          Browse top {FREE_CATALOG_LIMIT}
        </Link>
        <Link
          href="/plus"
          className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
        >
          What’s on Plus
        </Link>
      </div>
    </section>
  );
}
