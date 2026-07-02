# SLAquatics Media CDN

Active website media is published to Cloudflare R2 and served through environment-specific CDN hostnames. The `legacy/` folder is archive/reference-only and is never a CDN publishing input.

## Buckets And Domains

| Environment | R2 bucket | CDN domain | App variable |
| --- | --- | --- | --- |
| Development | `slaquatics-media-development` | `cdn.dev.slaquatics.com` | `PUBLIC_MEDIA_BASE_URL=https://cdn.dev.slaquatics.com` |
| Production | `slaquatics-media-production` | `cdn.slaquatics.com` | `PUBLIC_MEDIA_BASE_URL=https://cdn.slaquatics.com` |

The Worker binding name is `MEDIA_BUCKET` in both Wrangler environments. The binding points at the matching bucket for each environment.

## Object Layout

- `site/images/`: optimized public page images.
- `site/videos/`: optimized public page videos.
- `brand/`: shared brand assets, including `brand/shoreline-logo.webp`.
- `ops/`: ops/PWA media, including install icons.
- `originals/`: optional source/original retention. Upload only when explicitly needed with `--include-originals`.
- `manifests/media-manifest.json`: generated upload manifest with local path, CDN key, content type, byte size, and SHA-256 for each uploaded object.

R2 is the active store for deployed media. Do not commit CDN image or video binaries to this repository, and do not place media under `public/assets`; OpenNext copies `public/` into Worker Static Assets and Cloudflare Workers rejects individual static assets over 25 MiB. Local media files are temporary staging only under ignored `media-source/images/` and `media-source/videos/`.

## Commands

Create buckets once:

```bash
npm run media:bucket:create:dev
npm run media:bucket:create:prod
```

Attach CDN domains once:

```bash
CLOUDFLARE_ZONE_ID=<slaquatics-zone-id> npm run media:domain:dev
CLOUDFLARE_ZONE_ID=<slaquatics-zone-id> npm run media:domain:prod
```

The underlying Wrangler command requires the zone ID for the `slaquatics.com` zone. The package scripts pass it from `CLOUDFLARE_ZONE_ID`.

```bash
npx wrangler r2 bucket domain add slaquatics-media-development --domain cdn.dev.slaquatics.com --zone-id "$CLOUDFLARE_ZONE_ID"
npx wrangler r2 bucket domain add slaquatics-media-production --domain cdn.slaquatics.com --zone-id "$CLOUDFLARE_ZONE_ID"
```

Publish development media:

```bash
npm run media:publish
```

Preview the upload commands without writing objects:

```bash
npm run media:publish -- --dry-run
```

Publish production media only after development CDN verification:

```bash
npm run media:publish -- --env production
```

Include original/source retention only when needed:

```bash
npm run media:publish -- --env production --include-originals
```

## Promotion Flow

1. Add or replace image files under ignored `media-source/images` and video files under ignored `media-source/videos`.
2. Update active app references through `src/lib/media.ts`; do not hardcode CDN or third-party media URLs in components.
3. Run `npm run media:publish` and verify `https://cdn.dev.slaquatics.com/manifests/media-manifest.json`.
4. Render-check the development site pages that use changed media.
5. Run `npm run media:publish -- --env production`.
6. Deploy the production Worker after media is available on `https://cdn.slaquatics.com`.

## Rollback

R2 objects use long-lived immutable cache headers. Roll forward by publishing a new filename/key and updating `src/lib/media.ts` or the component media key. For urgent rollback, restore the previous code reference and redeploy the Worker. If an old binary is needed, fetch it from the current R2 object or from an external asset archive into ignored `media-source/` and republish.

## Legacy Archive Rule

The publisher only reads images from `media-source/images` and videos from `media-source/videos`. It refuses any path under `legacy/`. Archived Render/static media stays in `legacy/` strictly for migration reference and must not be imported by active app code or uploaded as Cloudflare CDN media.
