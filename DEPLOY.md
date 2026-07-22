# Deploy SneakerPulse

## Permanent host (recommended): Vercel

This Cloud Agent environment has **no GitHub or Vercel login**, so the lasting public site must be created from your machine once.

### 1. Push the repo

```bash
cd /path/to/sneakerpulse
gh auth login
gh repo create YOUR_GITHUB_USER/sneakerpulse --private --source=. --remote=origin --push
# or: git push -u origin main
```

Use branch `main` (or merge `cursor/index-2020-to-present-ab26` into it).

### 2. Deploy

```bash
npx vercel login
npx vercel --prod
```

Or: [vercel.com/new](https://vercel.com/new) → import the GitHub repo → Deploy.

### 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Required | Notes |
| --- | --- | --- |
| `KICKSDB_API_KEY` | yes | from [kicks.dev/register](https://kicks.dev/register) |
| `STATUS_TOKEN` | no | unlocks detailed `/api/status` via `x-status-token` header |

Apply to **Production** and **Preview**, then **Redeploy**.

### 4. Daily SPI snapshots

In the GitHub repo: Settings → Secrets and variables → Actions → `KICKSDB_API_KEY`.

Workflow: `.github/workflows/daily-spi.yml` (13:05 UTC).

### 5. Rate limits

Rate-limit `/api/*` in Vercel Firewall or Cloudflare so scrapers do not burn KicksDB quota.

---

## Temporary public preview (this agent)

Production server + Cloudflare quick tunnel:

```bash
npm run build
npm run start -- -H 0.0.0.0 -p 3000
npx cloudflared tunnel --url http://127.0.0.1:3000
```

The printed `https://*.trycloudflare.com` URL is temporary and dies when the agent/tunnel stops. Use Vercel for anything you share as “the site.”
