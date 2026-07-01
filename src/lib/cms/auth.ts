import type { CmsD1Database } from './storage.ts';
import type { CmsRole } from './core.ts';
import { cmsJson } from './security-headers.ts';

export type CmsUser = {
  id: string;
  email: string;
  role: CmsRole;
  name: string;
  active?: boolean;
  createdAt?: string;
};

type CmsUserRow = {
  id: string;
  email: string;
  role: CmsRole;
  name: string;
  active: number;
  created_at: string;
};

export type CmsPermission =
  | 'content.read'
  | 'content.write'
  | 'content.publish'
  | 'content.rollback'
  | 'media.read'
  | 'media.write'
  | 'revision.read'
  | 'users.manage'
  | 'site.export'
  | 'site.import';

const SESSION_COOKIE = 'cms_session';
const CMS_MUTATION_HEADER = 'x-cms-request';
const PASSWORD_ITERATIONS = 210000;

const rolePermissions: Record<CmsRole, CmsPermission[]> = {
  owner: ['content.read', 'content.write', 'content.publish', 'content.rollback', 'media.read', 'media.write', 'revision.read', 'users.manage', 'site.export', 'site.import'],
  admin: ['content.read', 'content.write', 'content.publish', 'content.rollback', 'media.read', 'media.write', 'revision.read', 'site.export', 'site.import'],
  editor: ['content.read', 'content.write', 'media.read', 'media.write', 'revision.read'],
  client: ['content.read', 'content.write', 'media.read', 'revision.read']
};

const CREATE_USERS_SQL = `
  CREATE TABLE IF NOT EXISTS cms_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT
  )
`;

const CREATE_SESSIONS_SQL = `
  CREATE TABLE IF NOT EXISTS cms_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

const CREATE_LOGIN_ATTEMPTS_SQL = `
  CREATE TABLE IF NOT EXISTS cms_login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip TEXT NOT NULL,
    ok INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )
`;

const CREATE_AUDIT_SQL = `
  CREATE TABLE IF NOT EXISTS cms_audit_log (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

export function cmsCookieDomainForHost(host: string): string | undefined {
  const normalized = host.split(':')[0].toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.workers.dev')) return undefined;
  return normalized;
}

export function readCmsSessionCookie(request: Request): string {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function createCmsSessionCookie(token: string, request: Request): string {
  const host = new URL(request.url).host;
  const domain = cmsCookieDomainForHost(host);
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=604800',
    domain ? `Domain=${domain}` : ''
  ].filter(Boolean).join('; ');
}

async function getCmsDb(): Promise<CmsD1Database> {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const context = await getCloudflareContext({ async: true });
  const env = context.env as Record<string, unknown>;
  const db = env.CMS_DB as CmsD1Database | undefined;
  if (!db) throw new Error('CMS_DB D1 binding is required');
  return db;
}

async function ensureAuthTables(db: CmsD1Database) {
  await db.prepare(CREATE_USERS_SQL).run();
  await addColumnIfMissing(db, 'ALTER TABLE cms_users ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
  await addColumnIfMissing(db, 'ALTER TABLE cms_users ADD COLUMN updated_at TEXT');
  await db.prepare(CREATE_SESSIONS_SQL).run();
  await db.prepare(CREATE_LOGIN_ATTEMPTS_SQL).run();
  await db.prepare(CREATE_AUDIT_SQL).run();
}

async function addColumnIfMissing(db: CmsD1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    if (!String(error).toLowerCase().includes('duplicate column')) throw error;
  }
}

async function sha256Hex(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Value(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bytesToBase64(salt);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function constantTimeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < maxLength; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }
  return diff === 0;
}

async function pbkdf2Hash(password: string, salt: string, iterations = PASSWORD_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(salt), iterations },
    key,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function createPasswordHash(password: string): Promise<string> {
  const salt = randomSalt();
  const hash = await pbkdf2Hash(password, salt);
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  const parts = storedHash.split('$');
  if (parts[0] === 'pbkdf2-sha256' && parts.length === 4) {
    const iterations = Number(parts[1]);
    const salt = parts[2] || '';
    const expected = parts[3] || '';
    if (!Number.isFinite(iterations) || iterations < 100000 || !salt || !expected) return { ok: false, needsUpgrade: false };
    const actual = await pbkdf2Hash(password, salt, iterations);
    return { ok: constantTimeEqual(actual, expected), needsUpgrade: iterations < PASSWORD_ITERATIONS };
  }
  const legacy = await sha256Hex(password);
  return { ok: constantTimeEqual(legacy, storedHash), needsUpgrade: true };
}

export async function requireCmsUser(request: Request): Promise<CmsUser | Response> {
  const db = await getCmsDb();
  await ensureAuthTables(db);
  const token = readCmsSessionCookie(request);
  if (!token) return cmsJson({ error: 'CMS login required.' }, { status: 401 });
  const row = await db
    .prepare('SELECT u.id, u.email, u.role, u.name, s.expires_at FROM cms_sessions s JOIN cms_users u ON u.id = s.user_id WHERE s.token = ? AND u.active = 1')
    .bind(await sessionTokenHash(token))
    .first<CmsUser & { expires_at: string }>();
  if (!row || Date.parse(row.expires_at) <= Date.now()) {
    return cmsJson({ error: 'CMS login required.' }, { status: 401 });
  }
  return { id: row.id, email: row.email, role: row.role, name: row.name };
}

export function userHasCmsPermission(user: CmsUser, permission: CmsPermission): boolean {
  return rolePermissions[user.role]?.includes(permission) || false;
}

export async function requireCmsPermission(request: Request, permission: CmsPermission): Promise<CmsUser | Response> {
  const user = await requireCmsUser(request);
  if (user instanceof Response) return user;
  if (!userHasCmsPermission(user, permission)) {
    return cmsJson({ error: 'CMS permission denied.' }, { status: 403 });
  }
  return user;
}

export function requireCmsMutationRequest(request: Request, options: { requireHeader?: boolean } = {}): Response | null {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      return cmsJson({ error: 'Invalid CMS request origin.' }, { status: 403 });
    }
    if (originHost !== url.host) {
      return cmsJson({ error: 'CMS request origin is not allowed.' }, { status: 403 });
    }
  }
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) {
    return cmsJson({ error: 'Cross-site CMS mutation rejected.' }, { status: 403 });
  }
  if (options.requireHeader && request.headers.get(CMS_MUTATION_HEADER) !== '1') {
    return cmsJson({ error: 'CMS mutation header is required.' }, { status: 403 });
  }
  return null;
}

export async function loginCmsUser(request: Request, email: string, password: string): Promise<Response> {
  const db = await getCmsDb();
  await ensureAuthTables(db);
  const normalizedEmail = email.trim().toLowerCase();
  const ip = clientIp(request);
  if (await loginIsRateLimited(db, normalizedEmail, ip)) {
    await recordCmsAuthAudit(db, 'anonymous', 'auth.rateLimited', normalizedEmail, request, { ip });
    return cmsJson({ error: 'Too many CMS login attempts. Try again later.' }, { status: 429 });
  }
  const user = await db
    .prepare('SELECT id, email, role, name, password_hash FROM cms_users WHERE lower(email) = lower(?) AND active = 1')
    .bind(normalizedEmail)
    .first<CmsUser & { password_hash: string }>();
  const verification = user ? await verifyPassword(password, user.password_hash) : { ok: false, needsUpgrade: false };
  if (!user || !verification.ok) {
    await recordLoginAttempt(db, normalizedEmail, ip, false);
    await recordCmsAuthAudit(db, 'anonymous', 'auth.loginFailed', normalizedEmail, request, { ip });
    return cmsJson({ error: 'Invalid CMS login.' }, { status: 401 });
  }
  if (verification.needsUpgrade) {
    await db
      .prepare('UPDATE cms_users SET password_hash = ? WHERE id = ?')
      .bind(await createPasswordHash(password), user.id)
      .run();
  }
  await recordLoginAttempt(db, normalizedEmail, ip, true);
  const token = await createSessionToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db
    .prepare('INSERT INTO cms_sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(await sessionTokenHash(token), user.id, expiresAt, now)
    .run();
  await recordCmsAuthAudit(db, user.id, 'auth.loginSucceeded', user.id, request, { ip });
  return cmsJson(
    { ok: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } },
    { headers: { 'set-cookie': createCmsSessionCookie(token, request) } }
  );
}

export async function cmsPasswordHashForSetup(password: string): Promise<string> {
  return createPasswordHash(password);
}

export async function listCmsUsers(): Promise<CmsUser[]> {
  const db = await getCmsDb();
  await ensureAuthTables(db);
  const { results = [] } = await db
    .prepare('SELECT id, email, role, name, active, created_at FROM cms_users ORDER BY created_at DESC LIMIT 200')
    .bind()
    .all<CmsUserRow>();
  return results.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    active: Boolean(user.active),
    createdAt: user.created_at
  }));
}

export function userCanCreateCmsRole(actor: CmsUser, role: CmsRole): boolean {
  if (actor.role !== 'owner') return false;
  return role !== 'owner';
}

export async function createManagedCmsUser(input: { email: string; name: string; role: CmsRole; password: string }, actor: CmsUser, request: Request): Promise<CmsUser | Response> {
  const db = await getCmsDb();
  await ensureAuthTables(db);
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 160);
  const role = input.role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name || !['owner', 'admin', 'editor', 'client'].includes(role)) {
    return cmsJson({ error: 'Valid CMS user email, name, and role are required.' }, { status: 400 });
  }
  if (!userCanCreateCmsRole(actor, role)) {
    return cmsJson({ error: 'CMS role cannot create that user role.' }, { status: 403 });
  }
  if (input.password.length < 12) {
    return cmsJson({ error: 'CMS user password must be at least 12 characters.' }, { status: 400 });
  }
  const now = new Date().toISOString();
  const user: CmsUser = {
    id: crypto.randomUUID(),
    email,
    role,
    name,
    active: true,
    createdAt: now
  };
  try {
    await db
      .prepare('INSERT INTO cms_users (id, email, role, name, password_hash, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
      .bind(user.id, user.email, user.role, user.name, await createPasswordHash(input.password), now, now)
      .run();
  } catch {
    return cmsJson({ error: 'CMS user could not be created. The email may already exist.' }, { status: 409 });
  }
  await recordCmsAuthAudit(db, actor.id, 'auth.userCreated', user.id, request, { email: user.email, role: user.role });
  return user;
}

export async function deactivateCmsUser(id: string, actor: CmsUser, request: Request): Promise<CmsUser | Response> {
  const db = await getCmsDb();
  await ensureAuthTables(db);
  const existing = await db
    .prepare('SELECT id, email, role, name, active, created_at FROM cms_users WHERE id = ?')
    .bind(id)
    .first<CmsUserRow>();
  if (!existing) return cmsJson({ error: 'CMS user not found.' }, { status: 404 });
  if (existing.role === 'owner' && actor.role !== 'owner') {
    return cmsJson({ error: 'Only owners can deactivate owner accounts.' }, { status: 403 });
  }
  const now = new Date().toISOString();
  await db
    .prepare('UPDATE cms_users SET active = 0, updated_at = ? WHERE id = ?')
    .bind(now, id)
    .run();
  await db
    .prepare('DELETE FROM cms_sessions WHERE user_id = ?')
    .bind(id)
    .run();
  await recordCmsAuthAudit(db, actor.id, 'auth.userDeactivated', id, request, { email: existing.email, role: existing.role });
  return {
    id: existing.id,
    email: existing.email,
    role: existing.role,
    name: existing.name,
    active: false,
    createdAt: existing.created_at
  };
}

export async function logoutCmsUser(request: Request): Promise<Response> {
  const db = await getCmsDb();
  await ensureAuthTables(db);
  const token = readCmsSessionCookie(request);
  if (token) {
    await db
      .prepare('DELETE FROM cms_sessions WHERE token = ?')
      .bind(await sessionTokenHash(token))
      .run();
  }
  await recordCmsAuthAudit(db, 'session', 'auth.logout', 'session', request, { ip: clientIp(request) });
  const expired = createCmsSessionCookie('', request).replace('Max-Age=604800', 'Max-Age=0');
  return cmsJson({ ok: true }, { headers: { 'set-cookie': expired } });
}

async function createSessionToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sessionTokenHash(token: string): Promise<string> {
  return `sha256:${await sha256Value(token)}`;
}

function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function loginIsRateLimited(db: CmsD1Database, email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const row = await db
    .prepare('SELECT COUNT(*) as count FROM cms_login_attempts WHERE ok = 0 AND created_at > ? AND (email = ? OR ip = ?)')
    .bind(since, email, ip)
    .first<{ count: number }>();
  return Number(row?.count || 0) >= 8;
}

async function recordLoginAttempt(db: CmsD1Database, email: string, ip: string, ok: boolean): Promise<void> {
  await db
    .prepare('INSERT INTO cms_login_attempts (id, email, ip, ok, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), email, ip, ok ? 1 : 0, new Date().toISOString())
    .run();
}

async function recordCmsAuthAudit(db: CmsD1Database, actorId: string, action: string, targetId: string, request: Request, payload: Record<string, unknown>): Promise<void> {
  await db
    .prepare('INSERT INTO cms_audit_log (id, actor_id, action, target_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(
      crypto.randomUUID(),
      actorId,
      action,
      targetId,
      JSON.stringify({
        ...payload,
        host: new URL(request.url).host,
        ray: request.headers.get('cf-ray') || ''
      }),
      new Date().toISOString()
    )
    .run();
}
