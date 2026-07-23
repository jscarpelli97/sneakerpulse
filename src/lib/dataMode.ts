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
      heroSource: "StockX via KicksDB",
    };
  }
  if (cachedCount > 0) {
    return {
      mode: "cached" as const,
      /** Softer than "Cached" for day-1 visitors. */
      badge: "Snapshot",
      subtitle: asOf
        ? `Daily snapshot · updated ${asOf}`
        : `${cachedCount}/${total} in daily catalog`,
      detail: asOf
        ? `Catalog last refreshed ${asOf}. Independent project — not affiliated with StockX.`
        : "Serving the committed daily catalog. Independent project — not affiliated with StockX.",
      heroSource: "Daily catalog",
    };
  }
  return {
    mode: "offline" as const,
    badge: "Offline",
    subtitle: `${total} markets offline`,
    detail: "No priced catalog available yet.",
    heroSource: "Offline",
  };
}
