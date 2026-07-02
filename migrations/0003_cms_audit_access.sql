ALTER TABLE cms_sessions ADD COLUMN id TEXT;
ALTER TABLE cms_sessions ADD COLUMN host TEXT;
ALTER TABLE cms_sessions ADD COLUMN ip_hash TEXT;
ALTER TABLE cms_sessions ADD COLUMN user_agent_hash TEXT;

UPDATE cms_users
SET active = 0,
    updated_at = datetime('now')
WHERE role = 'editor'
  AND active = 1;

ALTER TABLE cms_audit_log ADD COLUMN site_id TEXT;
ALTER TABLE cms_audit_log ADD COLUMN environment TEXT;
ALTER TABLE cms_audit_log ADD COLUMN actor_role TEXT;
ALTER TABLE cms_audit_log ADD COLUMN target_type TEXT;
ALTER TABLE cms_audit_log ADD COLUMN status TEXT NOT NULL DEFAULT 'succeeded';
ALTER TABLE cms_audit_log ADD COLUMN method TEXT;
ALTER TABLE cms_audit_log ADD COLUMN path TEXT;
ALTER TABLE cms_audit_log ADD COLUMN host TEXT;
ALTER TABLE cms_audit_log ADD COLUMN ip_hash TEXT;
ALTER TABLE cms_audit_log ADD COLUMN cf_ray TEXT;
ALTER TABLE cms_audit_log ADD COLUMN user_agent_hash TEXT;
ALTER TABLE cms_audit_log ADD COLUMN request_id TEXT;
ALTER TABLE cms_audit_log ADD COLUMN r2_key TEXT;
ALTER TABLE cms_audit_log ADD COLUMN r2_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE cms_audit_log ADD COLUMN r2_error TEXT;
ALTER TABLE cms_audit_log ADD COLUMN r2_stored_at TEXT;

CREATE INDEX IF NOT EXISTS idx_cms_audit_log_created_action_status
  ON cms_audit_log (created_at, action, status);

CREATE INDEX IF NOT EXISTS idx_cms_audit_log_target
  ON cms_audit_log (target_type, target_id, created_at);

CREATE TABLE IF NOT EXISTS cms_audit_outbox (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TEXT NOT NULL
);
