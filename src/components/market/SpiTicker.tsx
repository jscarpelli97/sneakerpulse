import Link from "next/link";
import { Suspense } from "react";
import { INDEX_NAME } from "@/lib/brand";
import { getSpiTickerQuote } from "@/services/market/getSpiTicker";
import { changeClass } from "@/utils/format";

function formatIndexLevel(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDayPercent(percent: number | null | undefined) {
  if (percent == null || !Number.isFinite(percent)) return "—";
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

async function SpiTickerInner({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const quote = await getSpiTickerQuote();
  if (!quote) return null;

  const percent = quote.changeToday?.percent ?? null;
  const percentLabel = formatDayPercent(percent);

  return (
    <Link
      href="/spi"
      className={`inline-flex items-center gap-1.5 font-[family-name:var(--font-plex-mono)] text-xs tabular-nums transition-opacity hover:opacity-90 sm:text-sm ${className}`}
      title={`${INDEX_NAME} · as of ${quote.asOf}`}
      aria-label={`${INDEX_NAME} ${formatIndexLevel(quote.level)}, day change ${percentLabel}`}
    >
      <span className="font-semibold text-dash-text">{quote.ticker}</span>
      {!compact ? <span className="text-dash-faint">·</span> : null}
      <span className="font-semibold text-dash-text">
        {formatIndexLevel(quote.level)}
      </span>
      <span className="text-dash-faint">·</span>
      <span className={`font-semibold ${changeClass(percent)}`}>
        {percentLabel}
      </span>
    </Link>
  );
}

function SpiTickerFallback({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-4 w-[7.5rem] items-center ${className}`}
      aria-hidden
    />
  );
}

/** Sticky-chrome SPI quote — ticker · level · day %. */
export function SpiTicker({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
} = {}) {
  return (
    <Suspense fallback={<SpiTickerFallback className={className} />}>
      <SpiTickerInner className={className} compact={compact} />
    </Suspense>
  );
}
