# Deploy SPI Markets

**Live production:** https://sneakerpulse.vercel.app  
**GitHub:** https://github.com/jscarpelli97/sneakerpulse  
**Vercel project:** https://vercel.com/jscarpelli97/sneakerpulse

## What’s already set up

- Public GitHub repo (`main` + feature branch)
- Vercel production deploy with `KICKSDB_API_KEY` + `STATUS_TOKEN`
- GitHub Actions secret `KICKSDB_API_KEY` for `.github/workflows/daily-spi.yml`

## Redeploy from CLI

```bash
npx vercel --prod --yes
```

## Connect GitHub → Vercel (auto-deploy on push)

CLI deploy works today. For push-to-deploy, link GitHub in the Vercel dashboard:

1. Open https://vercel.com/jscarpelli97/sneakerpulse/settings/git  
2. Connect the GitHub account / install the Vercel GitHub app if prompted  
3. Link repo `jscarpelli97/sneakerpulse`, production branch `main`

## Plus (Bitcoin / Lightning)

Checkout uses [OpenNode](https://opennode.com) (Lightning + on-chain in one invoice).

1. Create an OpenNode account and API key (start with **dev** keys).
2. In Vercel → Environment Variables set:
   - `OPENNODE_API_KEY`
   - `OPENNODE_ENV=dev` (or `live`)
   - `PLUS_JWT_SECRET` (long random string)
   - `PLUS_PRICE_USD=10`
   - `PLUS_TERM_DAYS=30`
   - `NEXT_PUBLIC_SITE_URL=https://sneakerpulse.vercel.app`
   - `NEXT_PUBLIC_PLUS_PUBLIC=1` **only after** StockX API access is approved/denied and you want Plus marketing live (off by default)
3. Redeploy. Without `OPENNODE_API_KEY`, `/plus` still works in **mock** mode (simulate payment) when public.

Webhook URL to allow in OpenNode: `https://sneakerpulse.vercel.app/api/plus/webhook`


## Daily SPI snapshots

Workflow: `.github/workflows/daily-spi.yml` (~13:05 UTC). Secret `KICKSDB_API_KEY` is already on the repo.

After the GitHub↔Vercel link exists, snapshot commits on `main` will trigger redeploys automatically. Until then, run `npx vercel --prod --yes` after important data updates.

## Rate limits

Rate-limit `/api/*` in Vercel Firewall or Cloudflare so scrapers do not burn KicksDB quota.

## Temporary agent preview

```bash
npm run build && npm run start -- -H 0.0.0.0 -p 3000
npx cloudflared tunnel --url http://127.0.0.1:3000
```

Prefer https://sneakerpulse.vercel.app for anything you share.
