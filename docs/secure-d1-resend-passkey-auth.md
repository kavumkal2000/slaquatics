# Secure D1 + Resend + Passkey Authentication Blueprint

This blueprint describes the native authentication system used for SLAquatics and how to rebuild it for another small-business web app without Supabase, Clerk, or OAuth.

## Security Model

- Keep the application database as the authority for users, roles, sessions, passkeys, revocation, and audit.
- Use opaque browser cookies only. Never store role claims, user IDs, JWTs, or permissions in client-readable state.
- Store only hashes of session tokens and magic-link tokens.
- Use Resend only to deliver single-use client magic links.
- Use password login for privileged staff/owner accounts, and allow clients to add an optional password after magic-link sign-in.
- Require the business owner to enroll passkeys after password login. Developer/admin accounts do not get self-service passkey or password management.
- Protect auth entrypoints with Cloudflare Turnstile in production.
- Revoke sessions server-side by updating D1.

## D1 Schema

Create these tables in the same D1 database as the app state:

- `ops_auth_users`: privileged users and client users.
  - `username TEXT UNIQUE NOT NULL`
  - `email TEXT UNIQUE`
  - `role TEXT CHECK role IN ('developer', 'owner', 'employee', 'crew', 'client')`
  - `display_name TEXT NOT NULL`
  - `password_hash TEXT`
  - `auth_provider TEXT`
  - `enabled INTEGER NOT NULL DEFAULT 1`
  - timestamps and `last_login_at`

- `ops_auth_sessions`: revokable server sessions.
  - `token_hash TEXT PRIMARY KEY`
  - `user_id INTEGER REFERENCES ops_auth_users(id) ON DELETE CASCADE`
  - `auth_method TEXT NOT NULL DEFAULT 'password'`
  - `expires_at TEXT NOT NULL`
  - `created_ip`, `created_user_agent`
  - `revoked_at`

- `ops_auth_magic_links`: single-use client sign-in links.
  - `token_hash TEXT PRIMARY KEY`
  - `email TEXT NOT NULL`
  - `role_intent TEXT NOT NULL DEFAULT 'client'`
  - `expires_at TEXT NOT NULL`
  - `consumed_at`
  - `created_ip`, `created_user_agent`

- `ops_auth_passkeys`: WebAuthn credentials.
  - `user_id INTEGER REFERENCES ops_auth_users(id) ON DELETE CASCADE`
  - `credential_id TEXT UNIQUE NOT NULL`
  - `public_key TEXT NOT NULL`
  - `counter INTEGER NOT NULL DEFAULT 0`
  - `transports TEXT`
  - `created_at`, `last_used_at`

- `ops_auth_challenges`: short-lived WebAuthn challenges.
  - `challenge_hash TEXT PRIMARY KEY`
  - `user_id INTEGER`
  - `purpose TEXT NOT NULL`
  - `challenge TEXT NOT NULL`
  - `expires_at TEXT NOT NULL`
  - `consumed_at`

## Cookie Contract

- Cookie name: app-specific, for SLAquatics `sla_ops_session`.
- Value: 32 random bytes encoded as base64url.
- Database: store `sha256(token)` only.
- Attributes: `HttpOnly`, `SameSite=Strict`, `Path=/`, `Secure` in production.
- TTL: 12 hours by default.
- Logout: set `revoked_at` for the current token hash and clear the cookie.
- Password rotation: update `password_hash` and revoke all sessions for that user.

## Password Login

Use password login for privileged staff roles, plus optional client passwords after magic-link signup.

- Hash passwords with PBKDF2-SHA256, at least 210,000 iterations, 32-byte output, random salt.
- For this implementation, accepted passwords must be 6+ characters and include at least one uppercase letter and one special character.
- Do not allow production to depend on env-var passwords.
- Keep env password fallback local/test-only while bootstrapping.
- Rate-limit by username plus Cloudflare client IP.
- Audit success and failure events.
- Return passkey state with successful owner login:
  - `required`
  - `enrolled`
  - `shouldPrompt`
  - `graceEndsAt`
  - `count`

## Client Magic Links

Endpoint shape:

- `POST /api/auth/client/magic-link`
  - Requires a valid email.
  - Requires Turnstile when configured.
  - Generates a random 32-byte token.
  - Stores `sha256(token)` with 15-minute expiry.
  - Sends a Resend email containing `/api/auth/magic-link/consume?token=...`.
  - Returns `{ ok: true }` without exposing account existence.

- `GET /api/auth/magic-link/consume?token=...`
  - Hashes the submitted token.
  - Rejects missing, expired, consumed, or unknown tokens.
  - Consumes the token before creating the session.
  - Finds or creates a user with role `client`.
  - Issues the same opaque session cookie as password/passkey auth.

- `POST /api/auth/client/password`
  - Requires an authenticated `client` session.
  - Requires same-origin mutation headers when present.
  - Stores a PBKDF2 password hash on the client user.
  - Leaves magic-link sign-in available as the primary signup/sign-in path.

Client users must never be allowed into ops APIs.

## Passkeys

Use `@simplewebauthn/server` and `@simplewebauthn/browser`.

Registration:

- Owner signs in with password.
- Developer/admin accounts cannot self-register passkeys.
- Enforce a maximum of 10 owner passkeys.
- Server generates registration options with RP name, RP ID, user ID, username, and existing credentials to exclude.
- Store the challenge hash and raw challenge in `ops_auth_challenges`.
- Browser calls `startRegistration`.
- Server verifies origin, RP ID, challenge, and user verification.
- Store credential ID, public key, counter, and transports in D1.

Authentication:

- Server generates authentication options with `userVerification: 'required'`.
- Store the challenge hash and raw challenge.
- Browser calls `startAuthentication`.
- Server finds the credential by ID.
- Server verifies origin, RP ID, challenge, public key, and counter.
- Update the counter and `last_used_at`.
- Issue the same opaque session cookie with `auth_method = 'passkey'`.

Owner password changes:

- Only the `owner` role can use the owner password-change endpoint.
- A password-authenticated owner must prove the current password.
- A passkey-authenticated owner may change the password without retyping the old password because the active session was created by WebAuthn.
- Developer/admin accounts must be changed through the database/seed path, not CRM self-service.

## Turnstile

- If `TURNSTILE_SECRET_KEY` is set, auth routes must reject missing/invalid Turnstile tokens.
- Production should set both `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
- Include remote IP from `cf-connecting-ip` when available.

## Authorization

- Session lookup resolves the current user from D1 on every request.
- Permissions are derived from the current D1 role, not from the cookie.
- `client` role is explicitly blocked from ops APIs.
- Mutating authenticated routes require same-origin `Origin` or `Referer` when those headers are present.

## Audit Events

Record at least:

- `password_login_success`
- `login_failure`
- `logout`
- `magic_link_sent`
- `magic_link_rejected`
- `magic_link_login_success`
- `passkey_registration_options`
- `passkey_registered`
- `passkey_login_success`
- `owner_password_changed`
- session revocation and password rotation events

## Production Secrets

Required:

- `SESSION_SECRET`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `AUTH_RESEND_FROM_EMAIL`
- D1 binding for auth tables

Optional:

- `OWNER_PASSKEY_GRACE_SECONDS`

Never add Supabase, OAuth provider secrets, or service-role keys for this pattern.

## Rollout

1. Deploy schema.
2. Seed owner/developer users with PBKDF2 hashes.
3. Set Resend and Turnstile secrets.
4. Remove production env password fallbacks.
5. Owner signs in with password and registers a passkey.
6. Verify client magic-link login and session revocation.
7. Confirm health checks show no auth warnings.

## Required Tests

- Password login works with PBKDF2 hashes.
- Legacy/default credentials are rejected.
- Repeated bad logins lock out the username/IP pair.
- Turnstile blocks auth requests when configured and missing.
- Client magic links are sent through Resend.
- Magic-link tokens are hashed, expire, and are single-use.
- Consumed client magic link creates only a `client` user.
- Client session is opaque, persists, and can be revoked.
- Client role cannot access ops APIs.
- Owner password login returns passkey prompt state.
- Passkey registration options require an owner password session.
- Passkey registration rejects developer/admin sessions and enforces the 10-passkey owner limit.
- Passkey registration persists credential metadata.
- Owner password change requires owner role plus current-password or passkey session proof.
- Passkey login verifies challenge, origin, RP ID, and counter.
- Cross-origin authenticated mutations are rejected.
