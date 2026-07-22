export function usdToBtc(usd: number, btcUsd: number) {
  if (!(btcUsd > 0) || !(usd >= 0)) return null;
  return usd / btcUsd;
}

export function formatBtc(amount: number | null | undefined) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  if (amount >= 1) return `${amount.toFixed(4)} BTC`;
  if (amount >= 0.01) return `${amount.toFixed(5)} BTC`;
  return `${amount.toFixed(8)} BTC`;
}
