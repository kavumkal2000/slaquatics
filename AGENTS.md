# AGENTS.md

## Repository Operating Rules

- Work from the `development` branch unless the user explicitly asks for another branch.
- Do not commit automatically. Leave changes unstaged unless the user asks to stage or commit.
- Before broad edits, inspect the actual owning files and keep changes narrowly scoped.
- Do not begin major modernization or infrastructure migration work without an explicit implementation request.
- Prefer read-only discovery for infrastructure questions until a concrete migration plan is approved.
- Do not add placeholder or fake production content. Public pages, ops surfaces, emails, seed data, fixtures intended for runtime use, and checked-in operational data must not introduce fake customers, fake reviews, invented business claims, filler copy, fake media, or demo operational records. Use verified business facts, supplied real assets, existing system state, or neutral functional copy; omit unknown details instead of inventing them.

## Current Architecture Snapshot

- The active app is a Next.js/OpenNext Cloudflare Worker application.
- Public pages and ops surfaces live under `src/app` and `src/features`.
- API routes, auth, Stripe, email/SMS dispatch, social webhooks, and ops state persistence now live in typed modules under `src/lib` and `src/app/api`.
- `wrangler.toml` is the Cloudflare Worker/D1 deployment definition.
- Production state is expected to use the `OPS_DB` D1 binding and the `ops_state` compatibility table.
- Legacy Render/static source is archived under `legacy/`; verify before editing anything there.

## Current Infrastructure Direction

Two major modernization goals are planned but not yet implemented:

1. Continue reducing remaining generated/imperative frontend runtime code inside the existing TypeScript/React/Tailwind structure without changing visual output.
2. Finish Cloudflare production cutover tasks that require account-side changes, such as DNS/domain routing and secret parity verification.

## Cloudflare Migration Notes

- Treat Cloudflare Workers Static Assets, OpenNext for Cloudflare, D1, Workers secrets, and Cron Triggers as the likely target primitives.
- Do not use deprecated Workers Sites for new migration work.
- Do not reintroduce hardcoded `shoreline-aquatics-ops.onrender.com` references into active source.
- Preserve current public booking, waiver, Stripe checkout, ops login, and iOS wrapper behavior during any migration.

## Validation

- For current code, run `npm run check` after changes that touch API routes, pricing, JSON-LD, booking flow, ops UI, or validation scripts.
- Run `npm run smoke` only when live endpoint checks are appropriate.
- For Cloudflare work, run local Wrangler/OpenNext validation before any production deploy.
