# Deploy SneakerPulse

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

## Environment variables

| Name | Required | Where |
| --- | --- | --- |
| `KICKSDB_API_KEY` | yes | Vercel + GitHub Actions |
| `STATUS_TOKEN` | no | Vercel (detailed `/api/status` via `x-status-token`) |

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
