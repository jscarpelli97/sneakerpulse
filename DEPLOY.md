# Deploy SPI Markets

**Live:** https://spimarkets.com  
**GitHub:** https://github.com/jscarpelli97/spi-markets  
**Vercel:** https://vercel.com/jscarpelli97/spi-markets

## Production checklist

- Custom domain `spimarkets.com` on Vercel
- Env: `KICKSDB_API_KEY`, `STATUS_TOKEN`, `NEXT_PUBLIC_SITE_URL=https://spimarkets.com`
- Contact form delivery: `CONTACT_INBOX_EMAIL` (or `PLUS_INTEREST_EMAIL`) — server-only, never shown on the site
- GitHub Actions secret `KICKSDB_API_KEY` for `.github/workflows/daily-spi.yml`
- Keep `NEXT_PUBLIC_PLUS_PUBLIC` unset so Plus marketing and paywalls stay off

## Redeploy

```bash
npx vercel --prod --yes
```

## Connect GitHub → Vercel (auto-deploy on push)

1. Open https://vercel.com/jscarpelli97/spi-markets/settings/git  
2. Connect the GitHub account / install the Vercel GitHub app if prompted  
3. Link repo `jscarpelli97/spi-markets`, production branch `main`

## Plus (later — Bitcoin / Lightning)

Checkout scaffolding uses [OpenNode](https://opennode.com). Keep Plus off for day one.

1. Create an OpenNode account and API key (start with **dev** keys).
2. In Vercel set:
   - `OPENNODE_API_KEY`
   - `OPENNODE_ENV=dev` (or `live`)
   - `PLUS_JWT_SECRET` (long random string)
   - `PLUS_PRICE_USD=10`
   - `PLUS_TERM_DAYS=30`
   - `NEXT_PUBLIC_SITE_URL=https://spimarkets.com`
   - `NEXT_PUBLIC_PLUS_PUBLIC=1` only when checkout is ready to sell
3. Redeploy. Without `OPENNODE_API_KEY`, `/plus` still works in **mock** mode when public.

Webhook URL: `https://spimarkets.com/api/plus/webhook`

## Daily SPI snapshots

Workflow: `.github/workflows/daily-spi.yml` (~13:05 UTC). After GitHub↔Vercel is linked, snapshot commits on `main` redeploy automatically.

## Rate limits

Rate-limit `/api/*` in Vercel Firewall or Cloudflare so scrapers do not burn KicksDB quota.
