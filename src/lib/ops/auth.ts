import crypto from 'node:crypto';
import { getOpsAuthStore, type OpsAuthUser, type OpsRole } from './auth-store.ts';

export const COOKIE_NAME = 'sla_ops_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const PBKDF2_ITERATIONS = 210000;
const PBKDF2_KEY_LENGTH = 32;
const loginAttempts = new Map<string, { count: number; firstAt: number; lockedUntil: number }>();

type SessionUser = OpsAuthUser & {
  sessionTokenHash?: string;
  authMethod?: string;
};

function normalizeUsername(username = '') {
  return String(username || '').trim().toLowerCase();
}

function clientIpFor(request: Request) {
  const cloudflareIp = request.headers.get('cf-connecting-ip');
  if (cloudflareIp) return cloudflareIp;
  const forwardedFor = String(request.headers.get('x-forwarded-for') || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwardedFor.length) return forwardedFor[forwardedFor.length - 1];
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

function userAgentFor(request: Request) {
  return String(request.headers.get('user-agent') || '').slice(0, 500);
}

export function loginRateKey(request: Request, username = '') {
  return `${clientIpFor(request)}|${normalizeUsername(username)}`;
}

export function loginLockRemainingMs(key: string) {
  const record = loginAttempts.get(key);
  if (record && record.lockedUntil > Date.now()) return record.lockedUntil - Date.now();
  return 0;
}

export function registerLoginFailure(key: string) {
  const now = Date.now();
  if (loginAttempts.size > 5000) {
    for (const [existingKey, record] of loginAttempts) {
      if (record.lockedUntil < now && (now - record.firstAt) > LOGIN_WINDOW_MS) loginAttempts.delete(existingKey);
    }
  }
  let record = loginAttempts.get(key);
  if (!record || (now - record.firstAt) > LOGIN_WINDOW_MS) record = { count: 0, firstAt: now, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= LOGIN_MAX_ATTEMPTS) record.lockedUntil = now + LOGIN_LOCK_MS;
  loginAttempts.set(key, record);
}

export function clearLoginFailures(key: string) {
  loginAttempts.delete(key);
}

export function timingSafeStringEqual(leftValue = '', rightValue = '') {
  const left = Buffer.from(String(leftValue));
  const right = Buffer.from(String(rightValue));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sha256Hex(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashAuthToken(token: string) {
  return sha256Hex(token);
}

function sessionCookieAttributes() {
  const attributes = ['Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  return attributes.join('; ');
}

function parseSessionToken(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function rolePermissions(role: string) {
  const normalized = String(role || '').toLowerCase();
  return {
    canAccessSystem: normalized === 'developer',
    canManageOps: ['developer', 'owner', 'employee'].includes(normalized),
    canManageMessaging: ['developer', 'owner'].includes(normalized),
    canAccessBusinessData: ['developer', 'owner'].includes(normalized),
    canAccessBookingsOnly: normalized === 'employee',
    canAccessCrewOnly: normalized === 'crew',
    canAccessWebsiteDevelopment: normalized === 'developer',
    hideMoney: ['employee', 'crew', 'client'].includes(normalized)
  };
}

export function sessionUserPayload(user: any) {
  if (!user) return null;
  const role = String(user.role || '');
  return {
    username: String(user.username || ''),
    role,
    displayName: String(user.displayName || ''),
    permissions: rolePermissions(role)
  };
}

function verifyLegacyPasswordHash(password: string, hash = '') {
  const normalized = String(hash || '').trim();
  if (!normalized) return false;
  const parts = normalized.split(':');
  if (parts[0] === 'sha256' && parts.length === 2) {
    return timingSafeStringEqual(sha256Hex(password), parts[1]);
  }
  if (parts[0] === 'sha256' && parts.length === 3) {
    return timingSafeStringEqual(sha256Hex(`${parts[1]}${password}`), parts[2]);
  }
  return false;
}

export function createPasswordHash(password: string, salt = crypto.randomBytes(16).toString('base64url')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256').toString('base64url');
  return `pbkdf2-sha256:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

export function passwordPolicyError(password = '') {
  const value = String(password || '');
  if (value.length < 6) return 'Password must be at least 6 characters and include an uppercase letter and a special character.';
  if (!/[A-Z]/.test(value)) return 'Password must be at least 6 characters and include an uppercase letter and a special character.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must be at least 6 characters and include an uppercase letter and a special character.';
  return '';
}

export function verifyPassword(password: string, storedHash = '') {
  const hash = String(storedHash || '').trim();
  const [algorithm, iterationsValue, salt, expected] = hash.split(':');
  if (algorithm === 'pbkdf2-sha256' && iterationsValue && salt && expected) {
    const iterations = Number(iterationsValue);
    if (!Number.isFinite(iterations) || iterations < 100000) return false;
    const actual = crypto.pbkdf2Sync(String(password), salt, iterations, PBKDF2_KEY_LENGTH, 'sha256').toString('base64url');
    return timingSafeStringEqual(actual, expected);
  }
  return verifyLegacyPasswordHash(password, hash);
}

export async function findOpsUser(username = '', password = '') {
  const store = await getOpsAuthStore();
  const user = await store.findUserForPasswordLogin(username);
  if (!user || !user.enabled || !user.passwordHash || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function publicAuthOrigin(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function createSessionCookie(user: OpsAuthUser | any, request?: Request, options: { authMethod?: string } = {}) {
  const store = await getOpsAuthStore();
  const resolvedUser = Number(user?.id)
    ? user as OpsAuthUser
    : await store.findUserForPasswordLogin(String(user?.username || user?.email || ''));
  if (!resolvedUser) throw new Error('Cannot create a session for an unknown user.');
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + (SESSION_TTL_SECONDS * 1000)).toISOString();
  await store.createSession({
    userId: resolvedUser.id,
    tokenHash: hashAuthToken(token),
    authMethod: options.authMethod || 'password',
    expiresAt,
    ip: request ? clientIpFor(request) : '',
    userAgent: request ? userAgentFor(request) : ''
  });
  await store.recordLogin(resolvedUser.id, new Date().toISOString());
  await store.audit({ event: `${options.authMethod || 'password'}_login_success`, username: resolvedUser.username, userId: resolvedUser.id, ip: request ? clientIpFor(request) : '', userAgent: request ? userAgentFor(request) : '' });
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; ${sessionCookieAttributes()}; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; ${sessionCookieAttributes()}; Max-Age=0`;
}

export async function clearCurrentSession(request: Request) {
  const token = parseSessionToken(request);
  if (token) {
    const store = await getOpsAuthStore();
    await store.revokeSession(hashAuthToken(token));
    await store.audit({ event: 'logout', detail: 'session revoked', ip: clientIpFor(request), userAgent: userAgentFor(request) });
  }
  return clearSessionCookie();
}

export async function getSession(request: Request): Promise<SessionUser | null> {
  const token = parseSessionToken(request);
  if (!token) return null;
  const store = await getOpsAuthStore();
  const session = await store.findSession(hashAuthToken(token));
  if (!session || session.revokedAt || Date.parse(session.expiresAt) <= Date.now() || !session.user.enabled) return null;
  return { ...session.user, sessionTokenHash: hashAuthToken(token), authMethod: session.authMethod };
}

export function magicLinkTtlMs() {
  return 15 * 60 * 1000;
}

export async function createClientMagicLink(input: { email: string; request: Request }) {
  const store = await getOpsAuthStore();
  const email = normalizeEmail(input.email);
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + magicLinkTtlMs()).toISOString();
  await store.createMagicLink({
    tokenHash: hashAuthToken(token),
    email,
    roleIntent: 'client',
    expiresAt,
    ip: clientIpFor(input.request),
    userAgent: userAgentFor(input.request)
  });
  await store.audit({
    event: 'magic_link_sent',
    username: email,
    detail: 'role=client',
    ip: clientIpFor(input.request),
    userAgent: userAgentFor(input.request)
  });
  return {
    email,
    token,
    expiresAt,
    url: `${publicAuthOrigin(input.request)}/api/auth/magic-link/consume?token=${encodeURIComponent(token)}`
  };
}

export async function consumeClientMagicLink(token: string, request: Request) {
  const store = await getOpsAuthStore();
  const tokenHash = hashAuthToken(token);
  const link = await store.findMagicLink(tokenHash);
  if (!link || link.consumedAt || Date.parse(link.expiresAt) <= Date.now() || link.roleIntent !== 'client') {
    await store.audit({ event: 'magic_link_rejected', detail: 'invalid-or-expired', ip: clientIpFor(request), userAgent: userAgentFor(request) });
    return null;
  }
  await store.consumeMagicLink(tokenHash);
  const user = await store.findOrCreateClientUser({ email: link.email, displayName: link.email, provider: 'magic-link' });
  await store.audit({ event: 'magic_link_login_success', username: user.username, userId: user.id, ip: clientIpFor(request), userAgent: userAgentFor(request) });
  return { user, cookie: await createSessionCookie(user, request, { authMethod: 'magic-link' }) };
}

export async function passkeyStatusForUser(user: OpsAuthUser | SessionUser | null) {
  if (!user) return { required: false, enrolled: false, shouldPrompt: false, graceEndsAt: '', count: 0 };
  const role = String(user.role || '').toLowerCase();
  const required = role === 'owner';
  if (!required) return { required: false, enrolled: false, shouldPrompt: false, graceEndsAt: '', count: 0 };
  const store = await getOpsAuthStore();
  const passkeys = await store.listPasskeysForUser(user.id);
  const graceSeconds = Number(process.env.OWNER_PASSKEY_GRACE_SECONDS || 60 * 60 * 24 * 7);
  const createdAt = Date.parse(user.createdAt || '') || Date.now();
  const graceEndsAt = new Date(createdAt + Math.max(0, graceSeconds) * 1000).toISOString();
  const enrolled = passkeys.length > 0;
  return {
    required,
    enrolled,
    shouldPrompt: !enrolled,
    graceEndsAt,
    count: passkeys.length
  };
}

export function clientPasswordStatusForUser(user: OpsAuthUser | SessionUser | null) {
  const role = String(user?.role || '').toLowerCase();
  if (role !== 'client') return { canSet: false, hasPassword: false, shouldPrompt: false };
  const hasPassword = Boolean(user?.passwordHash);
  return { canSet: true, hasPassword, shouldPrompt: !hasPassword };
}

export function authResendFromEmail() {
  return process.env.AUTH_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || '';
}

export function collectAuthConfigWarnings() {
  const warnings: string[] = [];
  const sessionSecret = process.env.SESSION_SECRET || '';
  const legacyPasswordKeys = ['OPS_PASSWORD', 'OPS_DEV_PASSWORD', 'OPS_OWNER_PASSWORD', 'OPS_EMPLOYEE_PASSWORD', 'OPS_CREW_PASSWORD']
    .filter((key) => Boolean(process.env[key]));

  if (!sessionSecret) {
    warnings.push('SESSION_SECRET is not set. Set a fixed random SESSION_SECRET before production rollout.');
  } else if (sessionSecret.length < 32) {
    warnings.push('SESSION_SECRET is short. Use a fixed random value with at least 32 characters.');
  }
  if (legacyPasswordKeys.length) {
    warnings.push(`Legacy env password fallback is present (${legacyPasswordKeys.join(', ')}). Rotate these users into D1 hashes and remove the env passwords before cutover.`);
  }
  if (!process.env.RESEND_API_KEY || !authResendFromEmail()) {
    warnings.push('Resend email is not configured yet. Client magic-link sign-in cannot send email until RESEND_API_KEY and AUTH_RESEND_FROM_EMAIL are set.');
  }
  if (!process.env.TURNSTILE_SECRET_KEY) {
    warnings.push('TURNSTILE_SECRET_KEY is not set. Auth spam protection is disabled until Cloudflare Turnstile is configured.');
  }
  return warnings;
}

export function isOpsRole(role: string): role is OpsRole {
  return ['developer', 'owner', 'employee', 'crew', 'client'].includes(role);
}
