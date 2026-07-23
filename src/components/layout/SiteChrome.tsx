import Link from "next/link";
import { SiteSearch } from "@/components/layout/SiteSearch";
import { PlusInterest } from "@/components/plus/PlusInterest";
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  FOUNDER_NAME,
} from "@/lib/brand";
import { plusPublicEnabled } from "@/lib/plus/config";

/** Site chrome uses the markets-terminal (homepage) look by default. */
type ChromeVariant = "dashboard" | "light";

const NAV_BASE = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "All markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/compare", label: "Compare" },
  { href: "/alerts", label: "Alerts" },
  { href: "/about", label: "About" },
] as const;

function navItems() {
  if (!plusPublicEnabled()) return [...NAV_BASE];
  return [
    ...NAV_BASE.slice(0, 5),
    { href: "/plus", label: "Plus" },
    ...NAV_BASE.slice(5),
  ];
}

export function SiteHeader({
  subtitle,
  variant = "dashboard",
}: {
  subtitle?: string;
  variant?: ChromeVariant;
}) {
  const nav = navItems();

  if (variant === "light") {
    return (
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 md:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-ink transition-opacity hover:opacity-80"
          >
            {BRAND_NAME}
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            {subtitle ? (
              <p className="hidden text-sm text-ink-soft sm:block">{subtitle}</p>
            ) : null}
            <nav className="flex items-center gap-1">
              {nav.map((item) => (
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

  return (
    <header className="sticky top-0 z-40 border-b border-dash-border/90 bg-dash-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="shrink-0 font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-dash-text transition-opacity hover:opacity-90 sm:text-xl"
          >
            {BRAND_NAME}
          </Link>
          {subtitle ? (
            <span className="hidden truncate font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-muted lg:inline">
              {subtitle}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <SiteSearch className="hidden sm:flex" />
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-dash-elevated sm:px-3 ${
                  item.href === "/plus"
                    ? "text-dash-accent hover:text-dash-accent"
                    : "text-dash-muted hover:text-dash-text"
                }`}
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
  variant = "dashboard",
}: {
  variant?: ChromeVariant;
}) {
  const publicPlus = plusPublicEnabled();
  const year = new Date().getFullYear();

  if (variant === "light") {
    return (
      <footer className="mt-auto border-t border-ink/8 bg-white px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
          <span className="font-[family-name:var(--font-syne)] font-extrabold text-ink">
            {BRAND_NAME}
          </span>
          <span className="text-xs sm:text-sm">
            Built by {FOUNDER_NAME} · Independent markets terminal
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-dash-border bg-dash-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4 text-sm text-dash-muted">
          <div className="max-w-md space-y-1.5">
            <span className="font-[family-name:var(--font-syne)] font-extrabold text-dash-text">
              {BRAND_NAME}
            </span>
            <p className="text-xs leading-relaxed text-dash-faint">
              Built by {FOUNDER_NAME} for the love of the game — sneakers &amp;
              streetwear asks plus the SPI index. Not affiliated with StockX.
            </p>
            <p className="text-xs text-dash-faint">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-dash-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            {publicPlus ? (
              <PlusInterest variant="footer" source="footer" />
            ) : null}
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em]">
            <Link href="/markets" className="hover:text-dash-text">
              All markets
            </Link>
            <Link href="/portfolio" className="hover:text-dash-text">
              Portfolio
            </Link>
            <Link href="/compare" className="hover:text-dash-text">
              Compare
            </Link>
            <Link href="/alerts" className="hover:text-dash-text">
              Alerts
            </Link>
            <Link href="/spi" className="hover:text-dash-text">
              SPI index
            </Link>
            <Link href="/about" className="hover:text-dash-text">
              About
            </Link>
            {publicPlus ? (
              <Link href="/plus" className="hover:text-dash-text">
                Plus
              </Link>
            ) : null}
          </nav>
        </div>
        <p className="border-t border-dash-border pt-3 text-xs leading-relaxed text-dash-faint">
          © {year} {FOUNDER_NAME} / {BRAND_NAME}. Not financial advice. Resale
          markets are volatile — do your own research. Data may be a daily
          snapshot depending on feed mode.
        </p>
      </div>
    </footer>
  );
}
