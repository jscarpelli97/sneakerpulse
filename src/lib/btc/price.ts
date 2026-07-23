import { formatBtc, usdToBtc } from "@/lib/btc/format";

type BtcQuote = {
  usd: number;
  asOf: string;
  source: "coingecko" | "fallback";
};

let cache: { quote: BtcQuote; expiresAt: number } | null = null;
const TTL_MS = 5 * 60 * 1000;
/** Last-resort so the UI still shows BTC math if CoinGecko is down. */
const FALLBACK_USD = 95_000;

export async function getBitcoinUsdPrice(): Promise<BtcQuote> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.quote;
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      { next: { revalidate: 300 } },
    );
    if (res.ok) {
      const data = (await res.json()) as { bitcoin?: { usd?: number } };
      const usd = data.bitcoin?.usd;
      if (typeof usd === "number" && usd > 0) {
        const quote: BtcQuote = {
          usd,
          asOf: new Date().toISOString(),
          source: "coingecko",
        };
        cache = { quote, expiresAt: Date.now() + TTL_MS };
        return quote;
      }
    }
  } catch {
    /* fall through */
  }

  const quote: BtcQuote = {
    usd: cache?.quote.usd ?? FALLBACK_USD,
    asOf: new Date().toISOString(),
    source: "fallback",
  };
  cache = { quote, expiresAt: Date.now() + 60_000 };
  return quote;
}

export { formatBtc, usdToBtc };
