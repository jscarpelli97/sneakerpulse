import Link from "next/link";

type ChromeVariant = "light" | "dashboard";

export function SiteHeader({
  subtitle,
  variant = "light",
}: {
  subtitle?: string;
  variant?: ChromeVariant;
}) {
  if (variant === "dashboard") {
    return (
      <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/"
              className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-dash-text"
            >
              SneakerPulse
            </Link>
            {subtitle ? (
              <span className="hidden font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-muted sm:inline">
                {subtitle}
              </span>
            ) : null}
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { href: "/", label: "Markets" },
              { href: "/compare", label: "Compare" },
              { href: "/alerts", label: "Alerts" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-dash-muted transition-colors hover:bg-dash-elevated hover:text-dash-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-ink/10 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-ink"
        >
          SneakerPulse
        </Link>
        {subtitle ? (
          <div className="flex items-center gap-4">
            <p className="text-sm text-ink-soft">{subtitle}</p>
            <nav className="hidden items-center gap-4 text-sm font-medium text-ink-soft sm:flex">
              <Link href="/" className="hover:text-ink">
                Markets
              </Link>
              <Link href="/compare" className="hover:text-ink">
                Compare
              </Link>
              <Link href="/alerts" className="hover:text-ink">
                Alerts
              </Link>
            </nav>
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft">
            <Link href="/" className="hover:text-ink">
              Markets
            </Link>
            <Link href="/compare" className="hover:text-ink">
              Compare
            </Link>
            <Link href="/alerts" className="hover:text-ink">
              Alerts
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({
  variant = "light",
}: {
  variant?: ChromeVariant;
}) {
  if (variant === "dashboard") {
    return (
      <footer className="border-t border-dash-border bg-dash-surface px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 text-sm text-dash-muted">
          <span className="font-[family-name:var(--font-syne)] font-extrabold text-dash-text">
            SneakerPulse
          </span>
          <span className="font-[family-name:var(--font-plex-mono)] text-xs tracking-wide">
            StockX · KicksDB · Markets terminal
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-ink/10 bg-white px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
        <span className="font-[family-name:var(--font-syne)] font-extrabold text-ink">
          SneakerPulse
        </span>
        <span>StockX market view · TradingView / CoinMarketCap layout</span>
      </div>
    </footer>
  );
}
