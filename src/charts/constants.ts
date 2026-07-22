export const CHART_RANGES = ["1D", "7D", "1M", "3M", "1Y", "ALL"] as const;

export type ChartRange = (typeof CHART_RANGES)[number];
