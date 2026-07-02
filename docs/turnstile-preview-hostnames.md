# Turnstile Preview Hostname Automation

Cloudflare Turnstile widgets only work on configured hostnames. Cloudflare supports updating the widget hostnames through the Turnstile widget API, so branch previews can be added and removed automatically.

## Required Secrets

Set these only in the CI/deploy system that is allowed to manage the development Turnstile widget:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `TURNSTILE_WIDGET_ID`

The API token needs Cloudflare `Account:Turnstile:Edit` permission. Use the development Turnstile widget for preview branches, not the production widget.

## Add A Preview Hostname

```bash
npm run turnstile:hostnames -- \
  --base slaquatics.com,dev.slaquatics.com,localhost,127.0.0.1 \
  --add "$PREVIEW_HOSTNAME"
```

## Remove A Preview Hostname

```bash
npm run turnstile:hostnames -- \
  --base slaquatics.com,dev.slaquatics.com,localhost,127.0.0.1 \
  --remove "$PREVIEW_HOSTNAME"
```

## GitHub Action Shape

If GitHub becomes the branch-preview orchestrator, wire it like this:

```yaml
name: Sync preview Turnstile hostname

on:
  pull_request:
    types: [opened, reopened, synchronize, closed]

jobs:
  turnstile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - name: Add preview hostname
        if: github.event.action != 'closed'
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TURNSTILE_WIDGET_ID: ${{ secrets.DEV_TURNSTILE_WIDGET_ID }}
          PREVIEW_HOSTNAME: ${{ vars.PREVIEW_HOSTNAME }}
        run: npm run turnstile:hostnames -- --base slaquatics.com,dev.slaquatics.com,localhost,127.0.0.1 --add "$PREVIEW_HOSTNAME"
      - name: Remove preview hostname
        if: github.event.action == 'closed'
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TURNSTILE_WIDGET_ID: ${{ secrets.DEV_TURNSTILE_WIDGET_ID }}
          PREVIEW_HOSTNAME: ${{ vars.PREVIEW_HOSTNAME }}
        run: npm run turnstile:hostnames -- --base slaquatics.com,dev.slaquatics.com,localhost,127.0.0.1 --remove "$PREVIEW_HOSTNAME"
```

Replace `PREVIEW_HOSTNAME` with the exact hostname emitted by the branch-preview system.

## Limits

Free Turnstile widgets are limited to 10 hostnames. Prefer a parent hostname such as `preview.slaquatics.com` when all previews are subdomains below it, because Cloudflare authorizes subdomains beneath a configured hostname. Do not add an unrestricted production root hostname to a development-only widget unless that is intentional.
