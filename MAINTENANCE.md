# Keeping the site healthy (ongoing)

How to catch bugs continuously for as long as the site exists — without relying on luck.

## The two commands
| Command | When | What it catches |
|---|---|---|
| `npm run check` | **Before every deploy** (and on every push, via CI) | server.js syntax errors, broken JSON-LD schema, and **pricing drift** (homepage vs booking flow vs ops charging different prices) |
| `npm run smoke` | **After a deploy + daily** (via CI) | the live site or API being down / 404ing (e.g. the availability-endpoint outage we hit) |

Run `npm run smoke` against any environment: `SITE_URL=https://staging... API_URL=https://... npm run smoke`.

## Automations to set up (ranked by value)

### 1. ✅ GitHub Actions — already added (`.github/workflows/health.yml`)
- Runs `npm run check` on every push/PR to `main` (a red ❌ on the PR means don't merge).
- Runs `npm run smoke` **daily** and on-demand. If the live site is down, **GitHub emails you automatically**. No setup needed beyond pushing this file.

### 2. Render deploy notifications (2 min, free)
Render dashboard → service → Settings → Notifications → enable **deploy failed/succeeded** emails or a Slack webhook. You'll know immediately if a deploy breaks.

### 3. Uptime monitor (5 min, free — UptimeRobot)
Add two monitors:
- `https://slaquatics.com/` (every 5 min)
- `https://shoreline-aquatics-ops.onrender.com/api/public/integrations/status` (every 5 min)

This pings far more often than the daily CI smoke and texts/emails you within minutes of an outage. It also keeps the Render node service warm (no cold starts).

### 4. The built-in startup config check (already in server.js)
On boot, `validateAuthConfig()` logs warnings for missing `SESSION_SECRET`, weak default passwords, etc. Check the Render logs after a deploy. The developer **System page** in the ops tool shows the same live.

### 5. Error monitoring (optional, free tier — Sentry)
For catching *runtime* errors real users hit (not just outages), add Sentry to `server.js` and the homepage. Worth it once traffic grows.

## The routine (what to actually do)
1. Make a change on a branch → `npm run check` → if green, merge to `main`.
2. After Render deploys → `npm run smoke` (or trigger the GitHub "Health" workflow manually).
3. Monthly: skim Render logs + the ops System page for config warnings; check UptimeRobot history.

## Extending the checks
As the site grows, add assertions to `scripts/validate.js` (static, pre-deploy) and `scripts/smoke.js` (live). They're plain Node — e.g. add a new page to `smoke.js`, or a new invariant (like pricing) to `validate.js`. Keeping both green is the "consistent bug fix" guarantee.
