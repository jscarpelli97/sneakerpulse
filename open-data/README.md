# SPI Index — open data

Daily **StockX sneaker market premium index** for anyone to chart, research, or build on.

**100 = at retail.** Above 100 = asking premiums. Below 100 = sitting under retail.

See `spi/latest.json` for the current tip and `spi/daily.csv` for the growing series.

## Files

```
spi/
  daily.csv      # append-only time series (easy for sheets / pandas)
  daily.json     # same series as JSON
  latest.json    # today only + basket stats
  basket.json    # current ChronoPulse-style brand × model basket
members/
  YYYY-MM-DD.csv # per-model ask / retail / weight for that day
```

### `spi/daily.csv` columns

| column | description |
| --- | --- |
| `date` | UTC calendar day (`YYYY-MM-DD`) |
| `spi` | Volume-weighted ask ÷ retail × 100 |
| `premium_pct` | `spi - 100` (percent vs retail) |
| `constituents` | Models included that day |
| `at_or_below_retail` | Count with ask ≤ retail |
| `brand_count` | Brands in the basket |

### Basket rules (ChronoPulse-style)

1. Up to **14** bestselling StockX sneaker brands in the current top-seller pool  
2. Up to **10** models per brand  
3. Weights = weekly StockX order flow (frozen until the next 6‑month rebalance)  
4. Index = volume-weighted **ask / retail × 100**

## Quick start

```bash
# After this folder is published to GitHub:
curl -sL https://raw.githubusercontent.com/<owner>/sneakerpulse-index/main/spi/daily.csv
curl -sL https://raw.githubusercontent.com/<owner>/sneakerpulse-index/main/spi/latest.json
```

```python
import pandas as pd
df = pd.read_csv("spi/daily.csv", parse_dates=["date"])
print(df.tail())
```

## How this is updated

The parent **SPI Markets** app runs `npm run snapshot` daily (GitHub Action `daily-spi.yml`, ~13:05 UTC). That job:

1. Pulls the current top StockX sellers via [KicksDB](https://kicks.dev)  
2. Measures the premium index + writes member rows  
3. Commits this `open-data/` folder  

To grow history yourself:

```bash
KICKSDB_API_KEY=... npm run snapshot
```

Publish this folder as its own public repo:

```bash
./scripts/publish-open-data-repo.sh yourname/sneakerpulse-index
```

## What this is not

- **Not** a continuous daily tape for 2022–mid‑2025 — that public feed does not exist here.  
- **Not** StockX’s official index. Asks are marketplace quotes, not cleared sale prints (sales history needs a paid KicksDB plan).  
- Boom-era (2020–2021) research series lives in the app under `src/data/index/stockx-premium-2020-2021.json` (Flurin17).

## License

Data in this folder is dedicated to the public domain under [CC0 1.0](LICENSE). Code that produces it remains under the parent project’s license.

## Citation

```
SPI Index (SPI), open daily premium series.
https://github.com/<owner>/sneakerpulse-index
```
