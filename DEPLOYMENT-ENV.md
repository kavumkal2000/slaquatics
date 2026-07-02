# Deployment environment variables (Cloudflare Workers)

All runtime config for the Shoreline Aquatics Worker. Set non-secret values as Worker vars and sensitive values as Worker secrets in both development and production Cloudflare environments.

## 🔒 Security (set these first)
| Variable | What | Set to |
|---|---|---|
| `SESSION_SECRET` | Reserved app secret used for runtime health checks and future session key rotation. | A long random string (e.g. `openssl rand -hex 48`) |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Enables Cloudflare Turnstile checks before password and magic-link sign-in. | A Turnstile widget for `slaquatics.com`, `dev.slaquatics.com`, and local dev hostnames. |
| `OWNER_PASSKEY_GRACE_SECONDS` | Owner passkey prompt/enforcement grace window after password login. | `604800` for 7 days unless you want immediate enforcement. |
| D1 `ops_auth_users.password_hash` | Developer/owner/employee/crew password hashes. | Generate with `npm run ops-auth:hash -- --username owner --env production`, then run the printed D1 update and session revoke commands manually. |
| Legacy `OPS_*_PASSWORD*` vars | Local/test fallback only before D1 auth rows are seeded. | Remove from production after D1 auth users are created. |

## 🗄️ Data store (production)
| Variable | What |
|---|---|
| `OPS_DB` | D1 binding declared in `wrangler.toml`; do not set this as a text env var. |
| `NODE_ENV` | Set to `production`. |

## 🔐 Native auth setup blockers

Before client magic-link and owner passkey auth can work in production:

- Seed privileged users in D1 `ops_auth_users` with PBKDF2 password hashes.
- Configure Resend and set `RESEND_API_KEY` plus `AUTH_RESEND_FROM_EMAIL` for auth magic links.
- Configure Turnstile and set both keys before exposing auth endpoints to production traffic.
- Have the owner sign in with their password and complete passkey setup during the grace window.

## ✉️ Email (Resend) — activates booking alerts + the weekly owner digest
| Variable | What |
|---|---|
| `RESEND_API_KEY` | Your Resend API key. |
| `RESEND_FROM_EMAIL` | Verified sender address (e.g. `bookings@slaquatics.com`). |
| `AUTH_RESEND_FROM_EMAIL` | Verified sender address used only for auth magic links (e.g. `auth@slaquatics.com`). Falls back to `RESEND_FROM_EMAIL` if unset. |
| `RESEND_FROM_NAME` | Defaults to `Shoreline Aquatics`. |
| `OWNER_UPDATE_EMAILS` | Comma-separated owner email(s) — receives the **weekly digest** + owner updates. |
| `BOOKING_ALERT_EMAILS` | Who gets new-booking alerts (falls back to OWNER_UPDATE_EMAILS). |

## 📅 Weekly owner digest (already built — just needs the email vars above)
| Variable | Default | What |
|---|---|---|
| `OWNER_WEEKLY_DIGEST_ENABLED` | `true` | Sends a weekly revenue/bookings/upcoming summary email. |
| `OWNER_WEEKLY_DIGEST_TIMEZONE` | `America/New_York` | Set to `America/Chicago` for TX. |
| `OWNER_WEEKLY_DIGEST_WEEKDAY` | `1` (Mon) | 0=Sun … 6=Sat. |
| `OWNER_WEEKLY_DIGEST_HOUR` / `_MINUTE` | `9` / `0` | Send time. |
| `OWNER_WEEKLY_CRON_SECRET` | none | Required for the Worker scheduled handler to invoke the internal weekly digest route. |

## 🚤 Booking behavior
| Variable | Default | What |
|---|---|---|
| `ALLOW_DOUBLE_BOOKING` | `true` | Every time slot stays bookable (you manage overlaps). Set `false` to block by fleet availability. |

## 📞 Optional integrations
| Variable | What |
|---|---|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Enables SMS sending from the ops tool. |
| `GOOGLE_REVIEW_URL` | Your Google review short-link (used by the Reviews automation). |
| `PUBLIC_SITE_URL` | Defaults to `https://slaquatics.com`. |
| `PUBLIC_MEDIA_BASE_URL` | Development: `https://cdn.dev.slaquatics.com`; production: `https://cdn.slaquatics.com`. Declared in `wrangler.toml` with the matching `MEDIA_BUCKET` R2 binding. |
| `PUBLIC_CORS_ALLOWED_ORIGINS` | Optional comma-separated list of allowed API origins. Leave unset only when legacy callers still require reflected CORS. |

---

### Minimum to be "secure + emailing":
Seed D1 `ops_auth_users`, remove production `OPS_*_PASSWORD*` fallbacks, set `SESSION_SECRET`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `AUTH_RESEND_FROM_EMAIL`, `OWNER_UPDATE_EMAILS`, and `OWNER_WEEKLY_CRON_SECRET`. The System page in the ops tool flags missing runtime config.
