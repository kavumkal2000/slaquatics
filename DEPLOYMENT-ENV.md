# Deployment environment variables (Cloudflare Workers)

All runtime config for the Shoreline Aquatics Worker. Set non-secret values as Worker vars and sensitive values as Worker secrets in both development and production Cloudflare environments.

## 🔒 Security (set these first)
| Variable | What | Set to |
|---|---|---|
| `SESSION_SECRET` | Signs login sessions. **Without it, every deploy logs everyone out.** | A long random string (e.g. `openssl rand -hex 48`) |
| `OPS_OWNER_PASSWORD_HASH` | Owner login (hashed, preferred). | `sha256:<salt>:<hash>` or `sha256:<hash>` |
| `OPS_EMPLOYEE_PASSWORD` | Hugo's login (plaintext). | A strong password you give Hugo |
| `OPS_OWNER_USERNAME` / `OPS_EMPLOYEE_USERNAME` / `OPS_DEV_USERNAME` | Login usernames (optional). | Defaults: `owner` / `hugoprado` / `developer` |

## 🗄️ Data store (production)
| Variable | What |
|---|---|
| `OPS_DB` | D1 binding declared in `wrangler.toml`; do not set this as a text env var. |
| `NODE_ENV` | Set to `production`. |

## ✉️ Email (Resend) — activates booking alerts + the weekly owner digest
| Variable | What |
|---|---|
| `RESEND_API_KEY` | Your Resend API key. |
| `RESEND_FROM_EMAIL` | Verified sender address (e.g. `bookings@slaquatics.com`). |
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
| `PUBLIC_CORS_ALLOWED_ORIGINS` | Optional comma-separated list of allowed API origins. Leave unset only when legacy callers still require reflected CORS. |

---

### Minimum to be "secure + emailing":
`SESSION_SECRET`, `OPS_OWNER_PASSWORD_HASH`, `OPS_EMPLOYEE_PASSWORD`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OWNER_UPDATE_EMAILS`, `OWNER_WEEKLY_CRON_SECRET` — then the weekly digest can run from the Worker scheduled handler. The System page in the ops tool flags missing runtime config.
