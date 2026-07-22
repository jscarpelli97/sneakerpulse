/**
 * Page views should not burn third-party quota.
 * Set KICKSDB_LIVE_READS=1 only for intentional live refresh environments.
 * Daily snapshot jobs call the API directly and ignore this flag.
 */
export function kicksLiveReadsEnabled() {
  return process.env.KICKSDB_LIVE_READS?.trim() === "1";
}

export function getDataModeLabel(input: {
  liveCount: number;
  cachedCount: number;
  total: number;
  asOf?: string | null;
}) {
  const { liveCount, cachedCount, total, asOf } = input;
  if (liveCount > 0) {
    return {
      mode: "live" as const,
      badge: "Live",
      subtitle: `${liveCount}/${total} top sellers live`,
      detail: "Asks refreshed from upstream market data.",
    };
  }
  if (cachedCount > 0) {
    return {
      mode: "cached" as const,
      badge: "Cached",
      subtitle: `${cachedCount}/${total} cached · free mode`,
      detail: asOf
        ? `Last catalog snapshot ${asOf}. Not affiliated with StockX.`
        : "Serving the committed offline catalog. Not affiliated with StockX.",
    };
  }
  return {
    mode: "offline" as const,
    badge: "Offline",
    subtitle: `${total} markets offline`,
    detail: "No priced catalog available yet.",
  };
}
