type SetupBannerProps = {
  code: string;
  message: string;
  sneakerName?: string;
  stockxUrl?: string;
  styleCode?: string;
};

export function SetupBanner({
  code,
  message,
  sneakerName,
  stockxUrl,
  styleCode,
}: SetupBannerProps) {
  return (
    <section className="dash-card px-4 py-5 md:px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dash-faint">
        StockX connection · {code}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-dash-text">
        Live StockX data needs an API key
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-dash-muted">
        {message} StockX blocks direct datacenter scrapes, so SPI Markets loads
        market data through{" "}
        <a
          href="https://kicks.dev"
          className="font-semibold text-dash-text underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          KicksDB
        </a>
        , which serves StockX product and pricing data.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-dash-muted">
        <li>
          Create a free key at{" "}
          <a
            href="https://kicks.dev/register"
            className="font-semibold text-dash-text underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            kicks.dev/register
          </a>
          .
        </li>
        <li>
          Add it to{" "}
          <code className="bg-dash-elevated px-1.5 py-0.5 text-dash-text">.env.local</code>:
          <pre className="mt-2 overflow-x-auto bg-dash-elevated px-3 py-2 text-xs text-dash-text">{`KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx`}</pre>
        </li>
        <li>
          Restart <code className="bg-dash-elevated px-1.5 py-0.5 text-dash-text">npm run dev</code>.
        </li>
      </ol>
      {sneakerName ? (
        <p className="mt-4 text-xs text-dash-faint">
          Tracking {sneakerName}
          {styleCode ? ` · ${styleCode}` : ""}
          {stockxUrl ? (
            <>
              {" · "}
              <a
                href={stockxUrl}
                className="underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                StockX listing
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
