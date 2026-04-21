# Shoreline Aquatics — slaquatics.com

## Files
- `index.html` — Public website (slaquatics.com)
- `ops.html` — Internal operations app (slaquatics.com/ops.html)
- `render.yaml` — Render deployment config

## Business
- Phone: (469) 693-7164
- Address: 2000 Main St, Hickory Creek, TX 75065
- Hours: Mon–Sun 8:30 AM – 8:30 PM
- Booking: https://slaquatics.com/jetski-booking

## Fleet & Pricing
| Craft | 2hr | 3hr | 4hr | 6hr | 8hr |
|-------|-----|-----|-----|-----|-----|
| Yamaha VX (2 skis) | $300 | $450 | $560 | $680 | $800 |
| SeaDoo TRIXX (4 skis) | $600 | $900 | $1,120 | $1,360 | $1,600 |
| Boat Rental | — | — | $500 | $750 | $1,000 |
Drone add-on: free shoot, $50 full video

## Design system
Colors: --navy:#08111f --sky:#1a9ed4 --wave:#0fb8e0
Fonts: Bebas Neue (headings) + DM Sans (body)

## Website sections (index.html)
Nav → Hero → Trust bar → Fleet → Calculator → Reviews →
Groups → Drone → Why Us → Map → FAQ → Instagram → CTA → Footer

## Ops app sections (ops.html)
Dashboard → Bookings → CRM → Margins → Fuel Log → Maintenance → Re-engagement
Data persists via localStorage. Connect to Supabase for multi-device sync.

## Deploy
Push to GitHub → connect to Render → Static Site → publish dir: .
Custom domain: add CNAME in GoHighLevel DNS settings.

## SEO
Schema.org LocalBusiness JSON-LD included in index.html.
Meta description, OG tags, canonical URL, robots meta all set.
