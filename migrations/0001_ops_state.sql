CREATE TABLE IF NOT EXISTS ops_state (
  id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO ops_state (id, payload, version, updated_at)
VALUES (1, '{}', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TABLE IF NOT EXISTS ops_auth_users (
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
);

CREATE INDEX IF NOT EXISTS idx_ops_auth_users_email ON ops_auth_users (email);

CREATE TABLE IF NOT EXISTS ops_auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES ops_auth_users(id) ON DELETE CASCADE,
  auth_method TEXT NOT NULL DEFAULT 'password',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_ip TEXT,
  created_user_agent TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_auth_sessions_user_id ON ops_auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_ops_auth_sessions_expires_at ON ops_auth_sessions (expires_at);

CREATE TABLE IF NOT EXISTS ops_auth_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  username TEXT,
  user_id INTEGER,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_auth_audit_created_at ON ops_auth_audit (created_at);

CREATE TABLE IF NOT EXISTS ops_auth_magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role_intent TEXT NOT NULL DEFAULT 'client',
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_ip TEXT,
  created_user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_auth_magic_links_email ON ops_auth_magic_links (email);
CREATE INDEX IF NOT EXISTS idx_ops_auth_magic_links_expires_at ON ops_auth_magic_links (expires_at);

CREATE TABLE IF NOT EXISTS ops_auth_passkeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES ops_auth_users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_auth_passkeys_user_id ON ops_auth_passkeys (user_id);

CREATE TABLE IF NOT EXISTS ops_auth_challenges (
  challenge_hash TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES ops_auth_users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  challenge TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ops_auth_challenges_user_id ON ops_auth_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_ops_auth_challenges_expires_at ON ops_auth_challenges (expires_at);
