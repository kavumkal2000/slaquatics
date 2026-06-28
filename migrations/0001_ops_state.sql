CREATE TABLE IF NOT EXISTS ops_state (
  id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO ops_state (id, payload, version, updated_at)
VALUES (1, '{}', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
