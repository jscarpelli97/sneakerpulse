import Link from "next/link";
import { MobileNavMenu } from "@/components/layout/MobileNavMenu";
import { SiteSearch } from "@/components/layout/SiteSearch";
import { SpiTicker } from "@/components/market/SpiTicker";
import { PlusInterest } from "@/components/plus/PlusInterest";
import { BRAND_NAME, BRAND_SHORT, FOUNDER_NAME, PRODUCT_FOOTNOTE } from "@/lib/brand";
import { plusPublicEnabled } from "@/lib/plus/config";

/** Primary chrome — three doors + about. */
const NAV_PRIMARY = [
  { href: "/about", label: "About" },
  { href: "/markets", label: "Markets" },
  { href: "/mine", label: "Mine" },
  { href: "/plus", label: "Plus" },
] as const;

/** Secondary — tools live under Markets story. */
const NAV_TOOLS = [
  { href: "/alerts", label: "Alerts" },
  { href: "/compare", label: "Compare" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/spi", label: "SPI index" },
  { href: "/wardrobe", label: "Wardrobe" },
] as const;

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-dash-border/90 bg-dash-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="shrink-0 font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-dash-text transition-opacity hover:opacity-90 sm:text-xl"
          >
            <span className="sm:hidden">{BRAND_SHORT}</span>
            <span className="hidden sm:inline">{BRAND_NAME}</span>
          </Link>
          <SpiTicker className="min-w-0 truncate" />
          {subtitle ? (
            <span className="hidden truncate font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-muted xl:inline">
              {subtitle}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SiteSearch className="hidden md:flex" />
          <nav className="hidden items-center gap-0.5 md:flex md:gap-1">
            {NAV_PRIMARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-dash-elevated sm:px-3 ${
                  item.href === "/plus"
                    ? "text-dash-accent hover:text-dash-accent"
                    : "text-dash-muted hover:text-dash-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <MobileNavMenu />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const publicPlus = plusPublicEnabled();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-dash-border bg-dash-surface px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4 text-sm text-dash-muted">
          <div className="max-w-md space-y-1.5">
            <span className="font-[family-name:var(--font-syne)] font-extrabold text-dash-text">
              {BRAND_NAME}
            </span>
            <p className="text-xs leading-relaxed text-dash-faint">
              {`Built by ${FOUNDER_NAME}. ${PRODUCT_FOOTNOTE} Not affiliated with StockX.`}
            </p>
            <p className="text-xs text-dash-faint">
              <Link href="/about#contact" className="text-dash-accent hover:underline">
                Contact me
              </Link>
              {" · "}
              feedback, shoes to add, thoughts
            </p>
            {publicPlus ? (
              <PlusInterest variant="footer" source="footer" />
            ) : null}
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em]">
            {NAV_PRIMARY.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-dash-text">
                {item.label}
              </Link>
            ))}
            {NAV_TOOLS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-dash-text">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="border-t border-dash-border pt-3 text-xs leading-relaxed text-dash-faint">
          {`© ${year} ${FOUNDER_NAME} / ${BRAND_NAME}. Not financial advice. Secondary markets are volatile — do your own research. Data may be a daily snapshot depending on feed mode.`}
        </p>
      </div>
    </footer>
  );
}
