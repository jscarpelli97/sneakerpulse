import Link from "next/link";

export function SiteHeader({
  subtitle,
}: {
  subtitle?: string;
}) {
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
          <p className="text-sm text-ink-soft">{subtitle}</p>
        ) : (
          <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft">
            <Link href="/" className="hover:text-ink">
              Markets
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
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
