export type SignalDirection = "up" | "down" | "flat" | "unknown";

export type MarketTone = "bullish" | "bearish" | "neutral" | "mixed" | "insufficient";

export type MarketSignals = {
  price: SignalDirection;
  inventory: SignalDirection;
  /** Price change used for the price signal, when known */
  priceChangePercent: number | null;
  /** Asks per weekly order — lower means tighter floating supply */
  supplyPressure: number | null;
  askCount: number;
  weeklyOrders: number | null;
};

export type MarketSummary = {
  headline: string;
  body: string;
  tone: MarketTone;
  ruleId: string;
  signals: MarketSignals;
  /** Honest label: rule engine today; swap for LLM later */
  generator: "rules" | "llm";
  generatedAt: string;
};
