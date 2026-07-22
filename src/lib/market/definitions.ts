/**
 * Canonical metric definitions for the SneakerPulse market view.
 * Keep UI labels and mapper logic aligned with these meanings.
 */
export const METRIC_DEFINITIONS = {
  price: {
    label: "Current price",
    definition:
      "Live StockX lowest ask across available sizes (USD). Not last sale.",
  },
  changeToday: {
    label: "Today’s change",
    definition:
      "Change vs the prior day from StockX daily average sales, or from accumulated lowest-ask snapshots when sales history is unavailable. Never derived from bootstrap.",
  },
  change30d: {
    label: "30-day change",
    definition:
      "Change vs ~30 days earlier from StockX daily average sales, or from ask snapshots when sales history is unavailable. Never derived from bootstrap.",
  },
  volume24h: {
    label: "24h volume",
    definition:
      "Pairs and notional from StockX daily sales for the latest day. Requires sales history.",
  },
  volumeSnapshot: {
    label: "Snapshot volume",
    definition:
      "Estimated pairs/notional from the latest lowest-ask snapshot point when sales history is unavailable.",
  },
  volumeWeekly: {
    label: "Weekly volume",
    definition:
      "StockX weekly order count when daily sales history is unavailable.",
  },
  volume30d: {
    label: "30d volume",
    definition:
      "Pairs/notional from daily sales when available; otherwise sum of variant 30-day sale counts.",
  },
  high30d: {
    label: "30d high",
    definition:
      "Highest daily average sale or ask snapshot in the last ~30 days, or StockX last-90-day range high as fallback.",
  },
  low30d: {
    label: "30d low",
    definition:
      "Lowest daily average sale or ask snapshot in the last ~30 days, or StockX last-90-day range low as fallback.",
  },
  chartBootstrap: {
    label: "Chart (bootstrap)",
    definition:
      "Illustrative series anchored to StockX range/average stats. Not official daily sales history.",
  },
  chartSales: {
    label: "Chart (sales)",
    definition: "StockX daily average sale prices from KicksDB sales history.",
  },
  chartSnapshot: {
    label: "Chart (snapshots)",
    definition:
      "Periodic StockX lowest-ask snapshots accumulated by the daily snapshot job. Prefer sales history when available.",
  },
} as const;

export type MetricKey = keyof typeof METRIC_DEFINITIONS;
