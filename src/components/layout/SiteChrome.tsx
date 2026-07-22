import Link from "next/link";

type ChromeVariant = "light" | "dashboard";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/compare", label: "Compare" },
  { href: "/alerts", label: "Alerts" },
] as const;

export function SiteHeader({
  subtitle,
  variant = "light",
}: {
  subtitle?: string;
  variant?: ChromeVariant;
}) {
  if (variant === "dashboard") {
    return (
      <header className="sticky top-0 z-40 border-b border-dash-border/90 bg-dash-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/"
              className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-dash-text transition-opacity hover:opacity-90 sm:text-xl"
            >
              SneakerPulse
            </Link>
            {subtitle ? (
              <span className="hidden truncate font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-muted md:inline">
                {subtitle}
              </span>
            ) : null}
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text sm:px-3"
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
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 md:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-ink transition-opacity hover:opacity-80"
        >
          SneakerPulse
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          {subtitle ? (
            <p className="hidden text-sm text-ink-soft sm:block">{subtitle}</p>
          ) : null}
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
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
      <footer className="mt-auto border-t border-dash-border bg-dash-surface px-4 py-6 sm:px-6 lg:px-8">
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
    <footer className="mt-auto border-t border-ink/8 bg-white px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
        <span className="font-[family-name:var(--font-syne)] font-extrabold text-ink">
          SneakerPulse
        </span>
        <span className="text-xs sm:text-sm">
          StockX market view · TradingView / CoinMarketCap layout
        </span>
      </div>
    </footer>
  );
}
