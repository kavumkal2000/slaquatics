# Infrastructure Inventory and Migration Direction

Last updated: 2026-06-28

This document records the current cloud/service dependencies and the remaining migration tasks.

## Current Hosting and Runtime

### Cloudflare Worker and static assets

- Defined in: `wrangler.toml`
- Runtime: Next.js via OpenNext for Cloudflare.
- Worker entrypoint: `src/worker.ts`, delegating to OpenNext output and owning the scheduled handler.
- Current role: serves the public site, private ops app, and `/api/*` routes from the same Worker.
- Current routes include:
  - `/`
  - `/jetski-booking/`
  - `/jetski-booking-confirmation/`
  - `/booking-thank-you/`
  - `/waiver/`
  - `/privacy-policy/`
  - `/jet-ski-rental-denton/`
  - `/jet-ski-rental-frisco/`
  - `/jet-ski-rental-lewisville/`
- Static assets are served by the OpenNext/Workers assets pipeline.
- Search controls for private ops surfaces remain enforced in the app routes.
- Legacy `.html` ops URLs are compatibility redirects only and are handled at the Worker boundary; they are not App Router pages or Next middleware.

### Cloudflare API and ops runtime

- Current role:
  - Serves private ops login/app routes.
  - Serves API routes under `/api/*`.
  - Owns auth/session cookies.
  - Owns booking, waiver, availability, checkout, Stripe webhook, CRM, messaging, reviews, social dispatch, and ops state sync.
  - Runs owner weekly digest dispatch from a Worker Cron Trigger through the internal cron route.

### Cloudflare D1

- Binding: `OPS_DB`
- Defined in: `wrangler.toml`
- Current role: persistent production storage for the single JSON compatibility table `ops_state`.
- Local/test fallback: in-memory state when no Cloudflare request context or D1 binding exists.
- Migration helper: `scripts/transfer-ops-state.mjs` can export legacy Postgres/file state, sanitize it, and import it into D1 when explicitly run with `--apply`.

## Current External Service Dependencies

### Stripe

- Env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Current role:
  - Creates checkout sessions for booking deposits.
  - Verifies checkout session status.
  - Handles Stripe webhooks at `/api/webhooks/stripe`.

### Resend

- Env vars:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `RESEND_FROM_NAME`
  - `RESEND_REPLY_TO_EMAIL`
- Current role:
  - Booking request emails.
  - Owner booking alerts.
  - Booking confirmation emails.
  - Mass email from ops.
  - Weekly owner digest.
  - Review request emails.

### Twilio

- Env vars:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
- Current role:
  - SMS messaging from ops.
  - SMS review requests.

### Google and GoHighLevel assets

- Google Fonts are used by public and ops pages.
- Google review/search/maps links are embedded in public pages and server-generated messaging.
- Several images are loaded from `images.leadconnectorhq.com`.
- The main hero video is loaded from `storage.googleapis.com/msgsndr/...`.
- These are content/runtime dependencies but not app hosting dependencies.

### Social automation webhooks

- Env vars:
  - `SOCIAL_AUTOMATION_WEBHOOK_URL`
  - `SOCIAL_AUTOMATION_WEBHOOK_SECRET`
  - `SOCIAL_FACEBOOK_WEBHOOK_URL`
  - `SOCIAL_INSTAGRAM_WEBHOOK_URL`
  - `SOCIAL_X_WEBHOOK_URL`
  - `SOCIAL_TIKTOK_WEBHOOK_URL`
- Current role:
  - Optional outbound dispatch for social post payloads from ops.

### GitHub Actions

- No active GitHub Actions workflow owns Cloudflare Worker deployment in this repository.
- Cloudflare's connected build/deploy path runs the project validation command.

### Legacy archive

- Location: `legacy/`
- Current role: migration accuracy and historical reference only.
- The active Cloudflare app must not import from `legacy/` or `src/lib/legacy`.
- `npm run start:legacy` is retained only as a local reference command for the archived Render-era app, not as a Cloudflare build, validation, or deployment surface.

### iOS native wrapper

- Location: `iOS/ShorelineOpsNative`
- Current role: SwiftUI `WKWebView` shell for the private ops app.
- Current hardcoded start URL: `https://slaquatics.com/ops-login`.
- Allowed hosts: `slaquatics.com` and `www.slaquatics.com`.

## Hardcoded Render Hostname Usage

The active source should not contain hardcoded `shoreline-aquatics-ops.onrender.com` references. Historical copies may still exist under `legacy/` for archive purposes only.

New public and ops API calls should use same-origin `/api/...` routes unless a specific cross-origin integration requires otherwise.

## Major Modernization Goals

### Goal 1: Continue TypeScript application cleanup

Current direction:

- TypeScript-first application code.
- React component model.
- Tailwind CSS for styling.
- Centralized pricing, craft, holiday, booking, and availability rules.
- Clear separation between public website, booking flow, ops app, and backend domain logic.
- Tests around quote-vs-charge parity, booking state transitions, auth/session behavior, Stripe webhook handling, and ops state permissions.

### Goal 2: Finish Cloudflare serverless cutover

Current direction:

- Next.js on Cloudflare using OpenNext for Cloudflare.
- SSR/SEO pages without managing traditional servers.
- Cloudflare Workers Static Assets for static/client assets.
- Cloudflare D1 for the current JSON compatibility state store.
- Cloudflare Cron Triggers for scheduled jobs such as the weekly owner digest.
- Cloudflare Workers secrets/env vars for Stripe, Twilio, Resend, ops credentials, and webhook secrets.

Current reference points from official docs:

- OpenNext for Cloudflare adapts Next.js output to run on Cloudflare Workers.
- Cloudflare Workers Static Assets serves HTML, CSS, images, and other files as part of a Worker deployment.
- Cloudflare D1 is Cloudflare's managed serverless SQL database with SQLite semantics.
- Cloudflare Cron Triggers run Worker `scheduled()` handlers on a cron schedule.

## Render Replacement Map

| Current Render responsibility | Likely Cloudflare replacement |
| --- | --- |
| Static site hosting | Workers Static Assets / Next.js OpenNext static assets |
| Node API service | Cloudflare Worker routes / Next.js route handlers via OpenNext |
| Render Postgres `ops_state` | D1 `ops_state` compatibility table |
| In-process weekly digest timer | Worker Cron Trigger |
| Render env vars | Worker secrets and vars |
| Render keep-warm workflow | Removed; Workers do not need Render-style keep-warm |
| `onrender.com` API hostname | Same-origin Cloudflare routes on the canonical domain |

## Migration Constraints

- Do not lose existing ops state during migration.
- Preserve public booking, waiver, checkout, thank-you, and ops workflows.
- Keep Stripe webhook idempotency behavior.
- Keep role-based ops access: developer, owner, employee, crew.
- Keep customer-facing SEO routes and canonical URLs stable.
- Update the iOS wrapper endpoint as part of hostname migration.
- Preserve `npm run check` coverage or replace it with equivalent tests in the new stack.

## Recommended Discovery Before Implementation

1. Confirm Cloudflare DNS/domain routing for `slaquatics.com`.
2. Verify dev and production Worker secret parity from Cloudflare, without printing secret values.
3. Verify D1 row count/hash against the migrated source backup using read-only checks.
4. Verify Stripe webhook configuration points at the Cloudflare `/api/webhooks/stripe` endpoint.
5. Verify Resend sender/domain status for the Worker runtime.
6. Decide whether external media should stay on GoHighLevel/Google-hosted URLs or move to Cloudflare R2/Images later.
