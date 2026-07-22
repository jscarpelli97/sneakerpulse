export const sneaker = {
  id: "jordan-1-high-dark-mocha-2020",
  name: "Jordan 1 High Dark Mocha",
  year: 2020,
  ticker: "J1-DMCH",
  styleCode: "555088-105",
  brand: "Jordan",
  colorway: "Sail / Dark Mocha / Black",
  retail: 170,
  image:
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
} as const;

export const market = {
  price: 412.5,
  currency: "USD",
  changeToday: {
    absolute: 18.4,
    percent: 4.67,
  },
  change30d: {
    absolute: -24.1,
    percent: -5.52,
  },
  volume24h: {
    pairs: 1284,
    notional: 529640,
  },
  volume30d: {
    pairs: 18420,
    notional: 7618450,
  },
  stats: {
    marketCap: 41250000,
    circulatingSupply: 100000,
    ath: 980.0,
    athDate: "Apr 12, 2021",
    atl: 210.0,
    atlDate: "Jan 08, 2023",
    high24h: 428.0,
    low24h: 389.25,
    high30d: 455.0,
    low30d: 378.5,
    avgSale30d: 404.8,
    lastSale: 415.0,
    lastSaleSize: "10.5 US",
    volatility30d: 11.4,
    bidAskSpread: 2.8,
    liquidityScore: 86,
  },
} as const;

/** Dummy OHLC-style closes for the chart placeholder (90 days). */
export const chartSeries = [
  438, 441, 436, 429, 432, 425, 420, 418, 422, 428, 431, 427, 424, 419, 415,
  410, 408, 412, 417, 421, 416, 413, 409, 405, 401, 398, 402, 407, 411, 408,
  404, 400, 396, 392, 395, 399, 403, 400, 397, 394, 390, 388, 391, 395, 399,
  402, 406, 410, 407, 403, 400, 397, 401, 405, 409, 412, 408, 404, 400, 398,
  402, 406, 410, 414, 418, 415, 411, 407, 404, 400, 397, 401, 405, 408, 412,
  416, 420, 417, 413, 409, 406, 402, 398, 395, 399, 403, 407, 410, 414, 412.5,
] as const;

export const ranges = ["1D", "7D", "1M", "3M", "1Y", "ALL"] as const;
