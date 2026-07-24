# Deploy SPI Markets

**Live:** https://spimarkets.com  
**GitHub:** https://github.com/jscarpelli97/spi-markets  
**Vercel:** https://vercel.com/jscarpelli97/spi-markets

## Production checklist

- Custom domain `spimarkets.com` on Vercel
- Env: `KICKSDB_API_KEY`, `STATUS_TOKEN`, `NEXT_PUBLIC_SITE_URL=https://spimarkets.com`
- Contact form delivery: `CONTACT_INBOX_EMAIL` (or `PLUS_INTEREST_EMAIL`) — server-only, never shown on the site
- Cloud accounts: `DATABASE_URL` (Neon) + `AUTH_JWT_SECRET`, then `node scripts/migrate-users.mjs`
- GitHub Actions secret `KICKSDB_API_KEY` for `.github/workflows/daily-spi.yml`
- Keep `NEXT_PUBLIC_PLUS_PUBLIC` unset so Plus marketing and paywalls stay off

## Cloud accounts (Portfolio + Wardrobe)

Accounts sync across devices when Postgres is wired:

1. Accept Neon marketplace terms:  
   https://vercel.com/jscarpelli97/~/integrations/accept-terms/neon?source=cli
2. Provision and link to the project:
   ```bash
   npx vercel integration add neon -n spi-markets-db
   npx vercel env pull .env.local
   ```
3. Set a session secret (production + preview):
   ```bash
   openssl rand -base64 48
   # then: npx vercel env add AUTH_JWT_SECRET
   ```
4. Apply schema:
   ```bash
   node scripts/migrate-users.mjs
   ```
5. Redeploy. `/portfolio` and `/wardrobe` will show cloud login; device vaults import automatically when the cloud side is empty.

## Redeploy

```bash
npx vercel --prod --yes
```

## Connect GitHub → Vercel (auto-deploy on push)

1. Open https://vercel.com/jscarpelli97/spi-markets/settings/git  
2. Connect the GitHub account / install the Vercel GitHub app if prompted  
3. Link repo `jscarpelli97/spi-markets`, production branch `main`

## Plus (Stripe cards + OpenNode Bitcoin)

Keep Plus off for day one (`NEXT_PUBLIC_PLUS_PUBLIC` unset). When you're ready:

1. **Stripe** (cards) — https://dashboard.stripe.com  
   - Create test keys, then live keys  
   - Webhook endpoint: `https://spimarkets.com/api/plus/webhook/stripe`  
     Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`  
   - Optional: create Prices and set `STRIPE_PRICE_FOUNDING_YEARLY` / `STRIPE_PRICE_PLUS`  
2. **OpenNode** (BTC / Lightning) — optional second rail  
3. In Vercel set:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional for future Elements)
   - `OPENNODE_API_KEY` / `OPENNODE_ENV=dev` (optional)
   - `PLUS_JWT_SECRET` (long random string)
   - `PLUS_PRICE_USD=10` / `PLUS_TERM_DAYS=30` (post-founding standard plan)
   - `NEXT_PUBLIC_SITE_URL=https://spimarkets.com`
   - `NEXT_PUBLIC_PLUS_PUBLIC=1` only when checkout is ready to sell
4. Run `DATABASE_URL=… node scripts/migrate-users.mjs` so `plus_purchases` exists (founding 100 cap).
5. Redeploy. Without Stripe/OpenNode keys, `/plus` still works in **mock** mode when public.

Founding offer (first 100 paid): **$10 / first year**, tracked in Neon `plus_purchases`.

OpenNode webhook (BTC): `https://spimarkets.com/api/plus/webhook`  
Stripe webhook (cards): `https://spimarkets.com/api/plus/webhook/stripe`

## Daily SPI snapshots

Workflow: `.github/workflows/daily-spi.yml` (~13:05 UTC). After GitHub↔Vercel is linked, snapshot commits on `main` redeploy automatically.

## Rate limits

Rate-limit `/api/*` in Vercel Firewall or Cloudflare so scrapers do not burn KicksDB quota.
