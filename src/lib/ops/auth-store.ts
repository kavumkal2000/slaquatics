import { getCloudflareContext } from '@opennextjs/cloudflare';
import crypto from 'node:crypto';
import type { D1DatabaseLike } from '../cloudflare/ops-state-store.ts';

export type OpsRole = 'developer' | 'owner' | 'employee' | 'crew' | 'client';

export type OpsAuthUser = {
  id: number;
  username: string;
  email: string;
  role: OpsRole;
  displayName: string;
  passwordHash: string;
  authProvider: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

export type CreateSessionInput = {
  userId: number;
  tokenHash: string;
  authMethod?: string;
  expiresAt: string;
  ip?: string;
  userAgent?: string;
};

export type MagicLinkInput = {
  tokenHash: string;
  email: string;
  roleIntent: 'client';
  expiresAt: string;
  ip?: string;
  userAgent?: string;
};

export type AuthAuditInput = {
  event: string;
  username?: string;
  userId?: number;
  detail?: string;
  ip?: string;
  userAgent?: string;
};

export type OpsAuthStore = {
  kind: 'd1' | 'memory';
  ensureReady(): Promise<void>;
  findUserForPasswordLogin(username: string): Promise<OpsAuthUser | null>;
  findUserById(id: number): Promise<OpsAuthUser | null>;
  findOrCreateClientUser(identity: { email: string; displayName?: string; provider?: string }): Promise<OpsAuthUser>;
  createSession(input: CreateSessionInput): Promise<void>;
  findSession(tokenHash: string): Promise<{ user: OpsAuthUser; expiresAt: string; revokedAt: string; authMethod: string } | null>;
  createMagicLink(input: MagicLinkInput): Promise<void>;
  findMagicLink(tokenHash: string): Promise<{ tokenHash: string; email: string; roleIntent: 'client'; expiresAt: string; consumedAt: string } | null>;
  consumeMagicLink(tokenHash: string): Promise<void>;
  updateUserPassword(userId: number, passwordHash: string, authProvider?: string): Promise<void>;
  listPasskeysForUser(userId: number): Promise<OpsPasskey[]>;
  findPasskeyByCredentialId(credentialId: string): Promise<OpsPasskey | null>;
  createPasskey(input: CreatePasskeyInput): Promise<void>;
  updatePasskeyCounter(credentialId: string, counter: number): Promise<void>;
  createChallenge(input: CreateChallengeInput): Promise<void>;
  findChallenge(challengeHash: string): Promise<OpsChallenge | null>;
  consumeChallenge(challengeHash: string): Promise<void>;
  revokeSession(tokenHash: string): Promise<void>;
  revokeUserSessions(userId: number): Promise<void>;
  recordLogin(userId: number, at: string): Promise<void>;
  audit(input: AuthAuditInput): Promise<void>;
  authReady(): Promise<boolean>;
};

export type OpsPasskey = {
  id: number;
  userId: number;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string;
  createdAt: string;
  lastUsedAt: string;
};

export type CreatePasskeyInput = {
  userId: number;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string;
};

export type OpsChallenge = {
  challengeHash: string;
  userId: number;
  purpose: string;
  challenge: string;
  expiresAt: string;
  consumedAt: string;
};

export type CreateChallengeInput = {
  challengeHash: string;
  userId?: number;
  purpose: string;
  challenge: string;
  expiresAt: string;
};

type OpsAuthUserRow = {
  id: number;
  username: string;
  email?: string | null;
  role: OpsRole;
  display_name: string;
  password_hash?: string | null;
  auth_provider?: string | null;
  enabled: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
};

type SessionRow = OpsAuthUserRow & {
  expires_at: string;
  revoked_at?: string | null;
  auth_method?: string | null;
};

type MagicLinkRow = {
  token_hash: string;
  email: string;
  role_intent: 'client';
  expires_at: string;
  consumed_at?: string | null;
};

type PasskeyRow = {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string;
  counter: number;
  transports?: string | null;
  created_at: string;
  last_used_at?: string | null;
};

type ChallengeRow = {
  challenge_hash: string;
  user_id?: number | null;
  purpose: string;
  challenge: string;
  expires_at: string;
  consumed_at?: string | null;
};

const CREATE_AUTH_SQL = [
  `CREATE TABLE IF NOT EXISTS ops_auth_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('developer', 'owner', 'employee', 'crew', 'client')),
    display_name TEXT NOT NULL,
    password_hash TEXT,
    auth_provider TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_login_at TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_users_email ON ops_auth_users (email)',
  `CREATE TABLE IF NOT EXISTS ops_auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES ops_auth_users(id) ON DELETE CASCADE,
    auth_method TEXT NOT NULL DEFAULT 'password',
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_ip TEXT,
    created_user_agent TEXT,
    revoked_at TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_sessions_user_id ON ops_auth_sessions (user_id)',
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_sessions_expires_at ON ops_auth_sessions (expires_at)',
  `CREATE TABLE IF NOT EXISTS ops_auth_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    username TEXT,
    user_id INTEGER,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ip TEXT,
    user_agent TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_audit_created_at ON ops_auth_audit (created_at)',
  `CREATE TABLE IF NOT EXISTS ops_auth_magic_links (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    role_intent TEXT NOT NULL DEFAULT 'client',
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_ip TEXT,
    created_user_agent TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_magic_links_email ON ops_auth_magic_links (email)',
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_magic_links_expires_at ON ops_auth_magic_links (expires_at)',
  `CREATE TABLE IF NOT EXISTS ops_auth_passkeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES ops_auth_users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    transports TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_used_at TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_passkeys_user_id ON ops_auth_passkeys (user_id)',
  `CREATE TABLE IF NOT EXISTS ops_auth_challenges (
    challenge_hash TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES ops_auth_users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    challenge TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_challenges_user_id ON ops_auth_challenges (user_id)',
  'CREATE INDEX IF NOT EXISTS idx_ops_auth_challenges_expires_at ON ops_auth_challenges (expires_at)'
];

const OPTIONAL_AUTH_SQL = [
  "ALTER TABLE ops_auth_sessions ADD COLUMN auth_method TEXT NOT NULL DEFAULT 'password'",
  'ALTER TABLE ops_auth_users ADD COLUMN auth_provider TEXT'
];

function normalizeUsername(value = '') {
  return String(value || '').trim().toLowerCase();
}

function userFromRow(row: OpsAuthUserRow): OpsAuthUser {
  return {
    id: Number(row.id),
    username: String(row.username || ''),
    email: String(row.email || ''),
    role: row.role,
    displayName: String(row.display_name || ''),
    passwordHash: String(row.password_hash || ''),
    authProvider: String(row.auth_provider || ''),
    enabled: Number(row.enabled) === 1,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
    lastLoginAt: String(row.last_login_at || '')
  };
}

function passkeyFromRow(row: PasskeyRow): OpsPasskey {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    credentialId: String(row.credential_id || ''),
    publicKey: String(row.public_key || ''),
    counter: Number(row.counter || 0),
    transports: String(row.transports || ''),
    createdAt: String(row.created_at || ''),
    lastUsedAt: String(row.last_used_at || '')
  };
}

function serverStoreRequired() {
  return /^true$/i.test(process.env.REQUIRE_SERVER_STORE || '') || process.env.NODE_ENV === 'production';
}

export async function getOpsAuthDb(): Promise<D1DatabaseLike | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as Record<string, unknown>;
    return (env.OPS_DB as D1DatabaseLike | undefined) || null;
  } catch {
    return null;
  }
}

function createD1AuthStore(db: D1DatabaseLike): OpsAuthStore {
  async function ensureReady() {
    for (const sql of CREATE_AUTH_SQL) await db.prepare(sql).bind().run();
    for (const sql of OPTIONAL_AUTH_SQL) {
      try {
        await db.prepare(sql).bind().run();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/duplicate column|already exists/i.test(message)) throw error;
      }
    }
  }

  async function firstUser(sql: string, ...params: unknown[]) {
    await ensureReady();
    const row = await db.prepare(sql).bind(...params).first<OpsAuthUserRow>();
    return row ? userFromRow(row) : null;
  }

  return {
    kind: 'd1',
    ensureReady,
    async authReady() {
      try {
        await ensureReady();
        return true;
      } catch {
        return false;
      }
    },
    async findUserForPasswordLogin(username) {
      return firstUser('SELECT * FROM ops_auth_users WHERE username = ? OR email = ? LIMIT 1', normalizeUsername(username), normalizeUsername(username));
    },
    async findUserById(id) {
      return firstUser('SELECT * FROM ops_auth_users WHERE id = ? LIMIT 1', id);
    },
    async findOrCreateClientUser(identity) {
      const email = normalizeUsername(identity.email);
      const existing = await firstUser('SELECT * FROM ops_auth_users WHERE email = ? LIMIT 1', email);
      if (existing) return existing;
      await ensureReady();
      const displayName = String(identity.displayName || email || 'Client').trim();
      const username = `client:${email}`;
      await db.prepare(
        `INSERT INTO ops_auth_users (username, email, role, display_name, auth_provider, enabled)
         VALUES (?, ?, 'client', ?, ?, 1)`
      ).bind(username, email, displayName, identity.provider || 'magic-link').run();
      const created = await firstUser('SELECT * FROM ops_auth_users WHERE email = ? LIMIT 1', email);
      if (!created) throw new Error('Could not create client login.');
      return created;
    },
    async createSession(input) {
      await ensureReady();
      await db.prepare(
        'INSERT INTO ops_auth_sessions (token_hash, user_id, auth_method, expires_at, created_ip, created_user_agent) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(input.tokenHash, input.userId, input.authMethod || 'password', input.expiresAt, input.ip || '', input.userAgent || '').run();
    },
    async findSession(tokenHash) {
      await ensureReady();
      const row = await db.prepare(
        `SELECT u.*, s.expires_at, s.revoked_at, s.auth_method
         FROM ops_auth_sessions s
         JOIN ops_auth_users u ON u.id = s.user_id
         WHERE s.token_hash = ?
         LIMIT 1`
      ).bind(tokenHash).first<SessionRow>();
      return row ? { user: userFromRow(row), expiresAt: row.expires_at, revokedAt: String(row.revoked_at || ''), authMethod: String(row.auth_method || 'password') } : null;
    },
    async createMagicLink(input) {
      await ensureReady();
      await db.prepare(
        'INSERT INTO ops_auth_magic_links (token_hash, email, role_intent, expires_at, created_ip, created_user_agent) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(input.tokenHash, normalizeUsername(input.email), input.roleIntent, input.expiresAt, input.ip || '', input.userAgent || '').run();
    },
    async findMagicLink(tokenHash) {
      await ensureReady();
      const row = await db.prepare('SELECT * FROM ops_auth_magic_links WHERE token_hash = ? LIMIT 1').bind(tokenHash).first<MagicLinkRow>();
      return row ? {
        tokenHash: String(row.token_hash || ''),
        email: normalizeUsername(row.email || ''),
        roleIntent: row.role_intent,
        expiresAt: String(row.expires_at || ''),
        consumedAt: String(row.consumed_at || '')
      } : null;
    },
    async consumeMagicLink(tokenHash) {
      await ensureReady();
      await db.prepare(
        "UPDATE ops_auth_magic_links SET consumed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE token_hash = ? AND consumed_at IS NULL"
      ).bind(tokenHash).run();
    },
    async updateUserPassword(userId, passwordHash, authProvider = 'password') {
      await ensureReady();
      await db.prepare(
        "UPDATE ops_auth_users SET password_hash = ?, auth_provider = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?"
      ).bind(passwordHash, authProvider, userId).run();
    },
    async listPasskeysForUser(userId) {
      await ensureReady();
      const result = await db.prepare('SELECT * FROM ops_auth_passkeys WHERE user_id = ?').bind(userId).all<PasskeyRow>();
      return (result.results || []).map(passkeyFromRow);
    },
    async findPasskeyByCredentialId(credentialId) {
      await ensureReady();
      const row = await db.prepare('SELECT * FROM ops_auth_passkeys WHERE credential_id = ? LIMIT 1').bind(credentialId).first<PasskeyRow>();
      return row ? passkeyFromRow(row) : null;
    },
    async createPasskey(input) {
      await ensureReady();
      await db.prepare(
        'INSERT INTO ops_auth_passkeys (user_id, credential_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)'
      ).bind(input.userId, input.credentialId, input.publicKey, input.counter, input.transports || '').run();
    },
    async updatePasskeyCounter(credentialId, counter) {
      await ensureReady();
      await db.prepare(
        "UPDATE ops_auth_passkeys SET counter = ?, last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE credential_id = ?"
      ).bind(counter, credentialId).run();
    },
    async createChallenge(input) {
      await ensureReady();
      await db.prepare(
        'INSERT INTO ops_auth_challenges (challenge_hash, user_id, purpose, challenge, expires_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(input.challengeHash, input.userId || null, input.purpose, input.challenge, input.expiresAt).run();
    },
    async findChallenge(challengeHash) {
      await ensureReady();
      const row = await db.prepare('SELECT * FROM ops_auth_challenges WHERE challenge_hash = ? LIMIT 1').bind(challengeHash).first<ChallengeRow>();
      return row ? {
        challengeHash: String(row.challenge_hash || ''),
        userId: Number(row.user_id || 0),
        purpose: String(row.purpose || ''),
        challenge: String(row.challenge || ''),
        expiresAt: String(row.expires_at || ''),
        consumedAt: String(row.consumed_at || '')
      } : null;
    },
    async consumeChallenge(challengeHash) {
      await ensureReady();
      await db.prepare(
        "UPDATE ops_auth_challenges SET consumed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE challenge_hash = ? AND consumed_at IS NULL"
      ).bind(challengeHash).run();
    },
    async revokeSession(tokenHash) {
      await ensureReady();
      await db.prepare(
        "UPDATE ops_auth_sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE token_hash = ? AND revoked_at IS NULL"
      ).bind(tokenHash).run();
    },
    async revokeUserSessions(userId) {
      await ensureReady();
      await db.prepare(
        "UPDATE ops_auth_sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ? AND revoked_at IS NULL"
      ).bind(userId).run();
    },
    async recordLogin(userId, at) {
      await ensureReady();
      await db.prepare('UPDATE ops_auth_users SET last_login_at = ?, updated_at = ? WHERE id = ?').bind(at, at, userId).run();
    },
    async audit(input) {
      await ensureReady();
      await db.prepare('INSERT INTO ops_auth_audit (event, username, user_id, detail, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(input.event, input.username || '', input.userId || null, input.detail || '', input.ip || '', input.userAgent || '')
        .run();
    }
  };
}

const memory = {
  users: [] as OpsAuthUser[],
  sessions: new Map<string, { userId: number; expiresAt: string; revokedAt: string; authMethod: string }>(),
  magicLinks: new Map<string, { email: string; roleIntent: 'client'; expiresAt: string; consumedAt: string }>(),
  passkeys: [] as OpsPasskey[],
  challenges: new Map<string, OpsChallenge>(),
  audit: [] as AuthAuditInput[],
  seedSignature: ''
};

function legacyHash(password: string) {
  return `sha256:${crypto.createHash('sha256').update(password).digest('hex')}`;
}

function addMemoryUser(user: Partial<OpsAuthUser> & { username: string; role: OpsRole; displayName: string }) {
  const now = new Date().toISOString();
  memory.users.push({
    id: memory.users.length + 1,
    username: normalizeUsername(user.username),
    email: normalizeUsername(user.email || ''),
    role: user.role,
    displayName: user.displayName,
    passwordHash: user.passwordHash || '',
    authProvider: user.authProvider || '',
    enabled: user.enabled !== false,
    createdAt: user.createdAt || now,
    updatedAt: user.updatedAt || now,
    lastLoginAt: user.lastLoginAt || ''
  });
}

function seedMemoryUsersFromEnv() {
  const clientUsers = memory.users.filter((user) => user.role === 'client');
  const existingPrivilegedUsers = memory.users.filter((user) => user.role !== 'client');
  const legacyOpsPassword = process.env.OPS_PASSWORD || '';
  const configs = [
    ['OPS_DEV', 'developer', 'Developer', 'developer'],
    ['OPS_OWNER', 'owner', 'Owner', 'owner'],
    ['OPS_EMPLOYEE', 'employee', 'Employee', 'hugoprado'],
    ['OPS_CREW', 'crew', 'Crew', 'crew']
  ] as const;
  const seedSignature = JSON.stringify(configs.map(([prefix, role, , fallbackUsername]) => ({
    prefix,
    role,
    username: process.env[`${prefix}_USERNAME`] || fallbackUsername,
    passwordHash: process.env[`${prefix}_PASSWORD_HASH`] || '',
    password: process.env[`${prefix}_PASSWORD`] || '',
    legacyOpsPassword
  })));
  const preserveExplicitPasswordUpdates = memory.seedSignature === seedSignature;
  memory.seedSignature = seedSignature;
  memory.users = [];
  configs.forEach(([prefix, role, displayName, fallbackUsername]) => {
    const username = process.env[`${prefix}_USERNAME`] || fallbackUsername;
    const passwordHash = process.env[`${prefix}_PASSWORD_HASH`] || (process.env[`${prefix}_PASSWORD`] || legacyOpsPassword ? legacyHash(process.env[`${prefix}_PASSWORD`] || legacyOpsPassword) : '');
    const existing = preserveExplicitPasswordUpdates
      ? existingPrivilegedUsers.find((user) => user.username === normalizeUsername(username) && user.authProvider === 'password')
      : null;
    addMemoryUser({
      username,
      role,
      displayName,
      passwordHash: existing?.passwordHash || passwordHash,
      authProvider: existing?.authProvider || ''
    });
  });
  clientUsers.forEach((user) => {
    user.id = memory.users.length + 1;
    memory.users.push(user);
  });
}

function createMemoryAuthStore(): OpsAuthStore {
  return {
    kind: 'memory',
    async ensureReady() {
      seedMemoryUsersFromEnv();
    },
    async authReady() {
      return true;
    },
    async findUserForPasswordLogin(username) {
      seedMemoryUsersFromEnv();
      const normalized = normalizeUsername(username);
      return memory.users.find((user) => user.username === normalized || user.email === normalized) || null;
    },
    async findUserById(id) {
      seedMemoryUsersFromEnv();
      return memory.users.find((user) => user.id === Number(id)) || null;
    },
    async findOrCreateClientUser(identity) {
      seedMemoryUsersFromEnv();
      const email = normalizeUsername(identity.email || '');
      const existing = memory.users.find((user) => email && user.email === email) || null;
      if (existing) return existing;
      addMemoryUser({
        username: `client:${normalizeUsername(identity.email)}`,
        email: identity.email,
        role: 'client',
        displayName: identity.displayName || identity.email,
        authProvider: identity.provider || 'magic-link'
      });
      const created = memory.users.find((user) => email && user.email === email) || null;
      if (!created) throw new Error('Could not create client login.');
      return created;
    },
    async createSession(input) {
      seedMemoryUsersFromEnv();
      memory.sessions.set(input.tokenHash, { userId: input.userId, expiresAt: input.expiresAt, revokedAt: '', authMethod: input.authMethod || 'password' });
    },
    async findSession(tokenHash) {
      seedMemoryUsersFromEnv();
      const session = memory.sessions.get(tokenHash);
      if (!session) return null;
      const user = memory.users.find((item) => item.id === session.userId);
      return user ? { user, expiresAt: session.expiresAt, revokedAt: session.revokedAt, authMethod: session.authMethod || 'password' } : null;
    },
    async createMagicLink(input) {
      memory.magicLinks.set(input.tokenHash, {
        email: normalizeUsername(input.email),
        roleIntent: input.roleIntent,
        expiresAt: input.expiresAt,
        consumedAt: ''
      });
    },
    async findMagicLink(tokenHash) {
      const link = memory.magicLinks.get(tokenHash);
      return link ? { tokenHash, email: link.email, roleIntent: link.roleIntent, expiresAt: link.expiresAt, consumedAt: link.consumedAt } : null;
    },
    async consumeMagicLink(tokenHash) {
      const link = memory.magicLinks.get(tokenHash);
      if (link && !link.consumedAt) link.consumedAt = new Date().toISOString();
    },
    async updateUserPassword(userId, passwordHash, authProvider = 'password') {
      const user = memory.users.find((item) => item.id === Number(userId));
      if (user) {
        user.passwordHash = passwordHash;
        user.authProvider = authProvider;
        user.updatedAt = new Date().toISOString();
      }
    },
    async listPasskeysForUser(userId) {
      return memory.passkeys.filter((passkey) => passkey.userId === Number(userId));
    },
    async findPasskeyByCredentialId(credentialId) {
      return memory.passkeys.find((passkey) => passkey.credentialId === credentialId) || null;
    },
    async createPasskey(input) {
      const now = new Date().toISOString();
      memory.passkeys.push({
        id: memory.passkeys.length + 1,
        userId: input.userId,
        credentialId: input.credentialId,
        publicKey: input.publicKey,
        counter: input.counter,
        transports: input.transports || '',
        createdAt: now,
        lastUsedAt: ''
      });
    },
    async updatePasskeyCounter(credentialId, counter) {
      const passkey = memory.passkeys.find((item) => item.credentialId === credentialId);
      if (passkey) {
        passkey.counter = counter;
        passkey.lastUsedAt = new Date().toISOString();
      }
    },
    async createChallenge(input) {
      memory.challenges.set(input.challengeHash, {
        challengeHash: input.challengeHash,
        userId: Number(input.userId || 0),
        purpose: input.purpose,
        challenge: input.challenge,
        expiresAt: input.expiresAt,
        consumedAt: ''
      });
    },
    async findChallenge(challengeHash) {
      return memory.challenges.get(challengeHash) || null;
    },
    async consumeChallenge(challengeHash) {
      const challenge = memory.challenges.get(challengeHash);
      if (challenge && !challenge.consumedAt) challenge.consumedAt = new Date().toISOString();
    },
    async revokeSession(tokenHash) {
      const session = memory.sessions.get(tokenHash);
      if (session) session.revokedAt = new Date().toISOString();
    },
    async revokeUserSessions(userId) {
      for (const session of memory.sessions.values()) {
        if (session.userId === Number(userId)) session.revokedAt = new Date().toISOString();
      }
    },
    async recordLogin(userId, at) {
      const user = memory.users.find((item) => item.id === Number(userId));
      if (user) user.lastLoginAt = at;
    },
    async audit(input) {
      memory.audit.push(input);
    }
  };
}

export async function getOpsAuthStore(): Promise<OpsAuthStore> {
  const db = await getOpsAuthDb();
  if (db) return createD1AuthStore(db);
  if (serverStoreRequired()) throw new Error('Persistent ops auth store is required, but OPS_DB is not available.');
  return createMemoryAuthStore();
}
