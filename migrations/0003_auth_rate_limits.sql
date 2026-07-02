CREATE TABLE IF NOT EXISTS ops_auth_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ops_auth_rate_limits_reset_at ON ops_auth_rate_limits (reset_at);
