import crypto from 'node:crypto';

export const COOKIE_NAME = 'sla_ops_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; firstAt: number; lockedUntil: number }>();

type OpsUser = {
  username: string;
  role: 'developer' | 'owner' | 'employee' | 'crew';
  displayName: string;
  password: string;
  passwordHash: string;
};

function secret() {
  return process.env.SESSION_SECRET || '';
}

function configuredPassword(primaryKey: string) {
  return process.env[primaryKey] || process.env.OPS_PASSWORD || '';
}

function configuredPasswordHash(primaryKey: string) {
  return process.env[`${primaryKey}_HASH`] || '';
}

function normalizeUsername(username = '') {
  return String(username || '').trim().toLowerCase();
}

function clientIpFor(request: Request) {
  const forwardedFor = String(request.headers.get('x-forwarded-for') || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwardedFor.length) return forwardedFor[forwardedFor.length - 1];
  return request.headers.get('cf-connecting-ip') || 'unknown';
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

export function collectAuthConfigWarnings() {
  const warnings: string[] = [];
  const legacyOpsPassword = process.env.OPS_PASSWORD || '';
  const devPassword = process.env.OPS_DEV_PASSWORD || legacyOpsPassword;
  const ownerPassword = process.env.OPS_OWNER_PASSWORD || legacyOpsPassword;
  const employeePassword = process.env.OPS_EMPLOYEE_PASSWORD || legacyOpsPassword;
  const sessionSecret = process.env.SESSION_SECRET || '';

  if (!sessionSecret) {
    warnings.push('SESSION_SECRET is not set — sessions reset on every restart/deploy (everyone gets logged out). Set a fixed random SESSION_SECRET.');
  } else if (sessionSecret.length < 32) {
    warnings.push('SESSION_SECRET is short — use a fixed random value with at least 32 characters.');
  }
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.OPS_OWNER_PASSWORD && !process.env.OPS_OWNER_PASSWORD_HASH) {
      warnings.push('No owner password configured — set OPS_OWNER_PASSWORD_HASH (preferred) or OPS_OWNER_PASSWORD.');
    }
    if (employeePassword === 'default') {
      warnings.push("Employee password is the weak default 'default' — set OPS_EMPLOYEE_PASSWORD.");
    }
    if (legacyOpsPassword && (devPassword === legacyOpsPassword || ownerPassword === legacyOpsPassword)) {
      warnings.push('A role is using the shared OPS_PASSWORD fallback — give each role its own password so one leak does not expose all accounts.');
    }
  }
  return warnings;
}

function users(): OpsUser[] {
  return [
    {
      username: String(process.env.OPS_DEV_USERNAME || 'developer').toLowerCase(),
      role: 'developer',
      displayName: 'Developer',
      password: configuredPassword('OPS_DEV_PASSWORD'),
      passwordHash: configuredPasswordHash('OPS_DEV_PASSWORD')
    },
    {
      username: String(process.env.OPS_OWNER_USERNAME || 'owner').toLowerCase(),
      role: 'owner',
      displayName: 'Owner',
      password: configuredPassword('OPS_OWNER_PASSWORD'),
      passwordHash: configuredPasswordHash('OPS_OWNER_PASSWORD')
    },
    {
      username: String(process.env.OPS_EMPLOYEE_USERNAME || 'hugoprado').toLowerCase(),
      role: 'employee',
      displayName: 'Employee',
      password: configuredPassword('OPS_EMPLOYEE_PASSWORD'),
      passwordHash: configuredPasswordHash('OPS_EMPLOYEE_PASSWORD')
    },
    {
      username: String(process.env.OPS_CREW_USERNAME || 'crew').toLowerCase(),
      role: 'crew',
      displayName: 'Crew',
      password: configuredPassword('OPS_CREW_PASSWORD'),
      passwordHash: configuredPasswordHash('OPS_CREW_PASSWORD')
    }
  ];
}

function timingSafeStringEqual(leftValue = '', rightValue = '') {
  const left = Buffer.from(String(leftValue));
  const right = Buffer.from(String(rightValue));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sha256Hex(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function verifyPasswordHash(password: string, hash = '') {
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

function sign(payload: string) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function encode(value: Record<string, unknown>) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decode(value = '') {
  if (!secret()) return null;
  const [payload = '', signature = ''] = value.split('.');
  if (!payload || !signature || !timingSafeStringEqual(signature, sign(payload))) return null;
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (Number(parsed.expiresAt || 0) < Date.now()) return null;
  return parsed;
}

export function findOpsUser(username = '', password = '') {
  if (!process.env.SESSION_SECRET) return null;
  const normalized = normalizeUsername(username);
  return users().find((user) => {
    if (user.username !== normalized) return false;
    if (user.passwordHash) return verifyPasswordHash(password, user.passwordHash);
    return Boolean(user.password) && timingSafeStringEqual(user.password, password);
  }) || null;
}

export function sessionUserPayload(user: any) {
  if (!user) return null;
  return {
    username: String(user.username || ''),
    role: String(user.role || ''),
    displayName: String(user.displayName || ''),
    permissions: {
      canAccessSystem: user.role === 'developer',
      canManageOps: ['developer', 'owner', 'employee'].includes(user.role),
      canManageMessaging: ['developer', 'owner'].includes(user.role)
    }
  };
}

export function createSessionCookie(user: OpsUser) {
  const value = encode({
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    expiresAt: Date.now() + (SESSION_TTL_SECONDS * 1000)
  });
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; ${sessionCookieAttributes()}; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; ${sessionCookieAttributes()}; Max-Age=0`;
}

function sessionCookieAttributes() {
  const attributes = ['Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  return attributes.join('; ');
}

export function getSession(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decode(decodeURIComponent(match[1])) : null;
}
