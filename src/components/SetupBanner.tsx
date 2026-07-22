import { DARK_MOCHA } from "@/data/darkMocha";

export function SetupBanner({
  code,
  message,
}: {
  code: string;
  message: string;
}) {
  return (
    <section className="border border-ink/15 bg-white px-4 py-5 md:px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
        StockX connection · {code}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-ink">
        Live StockX data needs an API key
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
        {message} StockX blocks direct datacenter scrapes, so SneakerPulse loads
        market data through{" "}
        <a
          href="https://kicks.dev"
          className="font-semibold text-ink underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          KicksDB
        </a>
        , which serves StockX product and pricing data.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
        <li>
          Create a free key at{" "}
          <a
            href="https://kicks.dev/register"
            className="font-semibold text-ink underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            kicks.dev/register
          </a>
          .
        </li>
        <li>
          Add it to <code className="bg-paper px-1.5 py-0.5 text-ink">.env.local</code>:
          <pre className="mt-2 overflow-x-auto bg-paper px-3 py-2 text-xs text-ink">{`KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx`}</pre>
        </li>
        <li>Restart <code className="bg-paper px-1.5 py-0.5 text-ink">npm run dev</code>.</li>
      </ol>
      <p className="mt-4 text-xs text-ink/45">
        Tracking {DARK_MOCHA.name} · {DARK_MOCHA.styleCode} ·{" "}
        <a
          href={DARK_MOCHA.stockxUrl}
          className="underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          StockX listing
        </a>
      </p>
    </section>
  );
}
