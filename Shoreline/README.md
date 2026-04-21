# Shoreline Aquatics — Launch Package

## What's included
| File | URL | Purpose |
|------|-----|---------|
| `index.html` | slaquatics.com | Public website |
| `ops.html` | slaquatics.com/ops.html | Internal ops app |
| `render.yaml` | — | Render deploy config |
| `CLAUDE.md` | — | Claude Code instructions |

## Deploy to Render (5 steps)
1. Create GitHub account at github.com
2. New repo → upload all 4 files
3. render.com → New → Static Site → connect repo
4. Publish directory: `.` → Create Static Site
5. Settings → Custom Domains → add `slaquatics.com`
   Then add the CNAME Render gives you in GoHighLevel DNS

## After deploy
- Website: `https://slaquatics.com`
- Ops app: `https://slaquatics.com/ops.html` ← bookmark this on your phone

## Making changes with Claude Code
```bash
cd slaquatics-launch
claude "update the Yamaha VX 2-hour price to $325"
claude "add a new FAQ question about cancellations"
claude "change the hero headline"
```

## What's been fixed for launch
- ✅ SEO meta description, OG tags, canonical URL
- ✅ LocalBusiness schema.org JSON-LD (helps Google rank you)
- ✅ All internal anchor links verified working
- ✅ Calculator handles all craft/duration combinations correctly
- ✅ Ops app JS bugs fixed (page navigation, reminder tabs)
- ✅ Ops app data persists via localStorage (survives page refresh)
- ✅ Back-to-top button on website
- ✅ Active nav highlight on scroll
- ✅ PWA meta tags on ops app (add to phone home screen)
- ✅ Google Maps embed with correct coordinates
- ✅ Noindex on ops.html (keeps it out of search results)
