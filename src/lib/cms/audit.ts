import type { CmsAuditEvent, CmsRole } from './core.ts';
import type { CmsD1Database } from './storage.ts';

type D1Result = { meta?: { changes?: number }; changes?: number };

type CmsAuditBucket = {
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
};

export type CmsAuditListFilters = {
  action?: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  status?: CmsAuditEvent['status'];
  slug?: string;
  from?: string;
  to?: string;
  limit?: number;
};

type CmsAuditContext = {
  db: CmsD1Database;
  bucket?: CmsAuditBucket;
  environment: string;
  siteId: string;
};

const CREATE_AUDIT_SQL = `
  CREATE TABLE IF NOT EXISTS cms_audit_log (
    id TEXT PRIMARY KEY,
    site_id TEXT,
    environment TEXT,
    actor_id TEXT NOT NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'succeeded',
    method TEXT,
    path TEXT,
    host TEXT,
    ip_hash TEXT,
    cf_ray TEXT,
    user_agent_hash TEXT,
    request_id TEXT,
    payload TEXT NOT NULL,
    r2_key TEXT,
    r2_status TEXT NOT NULL DEFAULT 'pending',
    r2_error TEXT,
    r2_stored_at TEXT,
    created_at TEXT NOT NULL
  )
`;

const CREATE_AUDIT_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_cms_audit_log_created_action_status
    ON cms_audit_log (created_at, action, status)
`;

const CREATE_AUDIT_TARGET_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_cms_audit_log_target
    ON cms_audit_log (target_type, target_id, created_at)
`;

const CREATE_AUDIT_OUTBOX_SQL = `
  CREATE TABLE IF NOT EXISTS cms_audit_outbox (
    id TEXT PRIMARY KEY,
    audit_id TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    updated_at TEXT NOT NULL
  )
`;

export async function recordCmsAudit(input: {
  actorId?: string;
  actorRole?: CmsRole | 'anonymous' | 'system';
  action: string;
  targetType?: string;
  targetId?: string;
  status?: CmsAuditEvent['status'];
  request?: Request;
  metadata?: Record<string, unknown>;
}): Promise<CmsAuditEvent> {
  const context = await getCmsAuditContext();
  await ensureCmsAuditTables(context.db);
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const url = input.request ? new URL(input.request.url) : null;
  const keyDate = createdAt.slice(0, 10).replace(/-/g, '/');
  const r2Key = `audit/${keyDate}/${id}.json`;
  const event: CmsAuditEvent = {
    id,
    siteId: context.siteId,
    environment: context.environment,
    actorId: input.actorId || 'anonymous',
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType || 'system',
    targetId: input.targetId || input.action,
    status: input.status || 'succeeded',
    method: input.request?.method || '',
    path: url ? `${url.pathname}${url.search}` : '',
    host: url?.host || '',
    ipHash: input.request ? await hashHeader(clientIp(input.request)) : '',
    cfRay: input.request?.headers.get('cf-ray') || '',
    userAgentHash: input.request ? await hashHeader(input.request.headers.get('user-agent') || '') : '',
    requestId: input.request?.headers.get('cf-ray') || crypto.randomUUID(),
    payload: sanitizeAuditMetadata(input.metadata || {}),
    r2Key,
    r2Status: context.bucket ? 'pending' : 'failed',
    createdAt
  };

  await insertAuditRow(context.db, event, context.bucket ? 'pending' : 'failed', context.bucket ? '' : 'CMS_AUDIT_BUCKET is not configured.');
  if (!context.bucket) return event;

  try {
    await context.bucket.put(r2Key, JSON.stringify(event, null, 2), {
      httpMetadata: { contentType: 'application/json' }
    });
    await markAuditStored(context.db, event.id);
    event.r2Status = 'stored';
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error).slice(0, 500);
    await markAuditFailed(context.db, event.id, event.r2Key || r2Key, message);
    event.r2Status = 'failed';
  }
  return event;
}

export async function listCmsAuditEvents(filters: CmsAuditListFilters = {}): Promise<CmsAuditEvent[]> {
  const context = await getCmsAuditContext();
  await ensureCmsAuditTables(context.db);
  const limit = Math.min(Math.max(filters.limit || 100, 1), 250);
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  if (filters.action) {
    clauses.push('action LIKE ?');
    bindings.push(`%${filters.action}%`);
  }
  if (filters.actorId) {
    clauses.push('actor_id = ?');
    bindings.push(filters.actorId);
  }
  if (filters.targetId) {
    clauses.push('target_id = ?');
    bindings.push(filters.targetId);
  }
  if (filters.targetType) {
    clauses.push('target_type = ?');
    bindings.push(filters.targetType);
  }
  if (filters.status) {
    clauses.push('status = ?');
    bindings.push(filters.status);
  }
  if (filters.from) {
    clauses.push('created_at >= ?');
    bindings.push(filters.from);
  }
  if (filters.to) {
    clauses.push('created_at <= ?');
    bindings.push(filters.to);
  }
  if (filters.slug) {
    clauses.push('payload LIKE ?');
    bindings.push(`%"slug":"%${filters.slug.replace(/[%_]/g, '')}%`);
  }
  const { results = [] } = await context.db
    .prepare(`SELECT * FROM cms_audit_log${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ?`)
    .bind(...bindings, limit)
    .all<Record<string, unknown>>();
  return results.map(rowToAuditEvent);
}

export async function retryCmsAuditR2Write(id: string, actor: { id: string; role: CmsRole }, request: Request): Promise<CmsAuditEvent | null> {
  const context = await getCmsAuditContext();
  await ensureCmsAuditTables(context.db);
  const row = await context.db.prepare('SELECT * FROM cms_audit_log WHERE id = ?').bind(id).first<Record<string, unknown>>();
  if (!row) return null;
  const event = rowToAuditEvent(row);
  if (!context.bucket || !event.r2Key) {
    await markAuditFailed(context.db, id, event.r2Key || `audit/retry-missing-key/${id}.json`, 'CMS_AUDIT_BUCKET is not configured.');
    return event;
  }
  try {
    await context.bucket.put(event.r2Key, JSON.stringify(event, null, 2), {
      httpMetadata: { contentType: 'application/json' }
    });
    await markAuditStored(context.db, id);
  } catch (error) {
    await markAuditFailed(context.db, id, event.r2Key, String(error instanceof Error ? error.message : error).slice(0, 500));
  }
  await recordCmsAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'audit.retryR2',
    targetType: 'audit',
    targetId: id,
    request,
    metadata: { r2Key: event.r2Key }
  });
  return event;
}

export async function ensureCmsAuditTables(db: CmsD1Database): Promise<void> {
  await db.prepare(CREATE_AUDIT_SQL).run();
  for (const sql of [
    'ALTER TABLE cms_audit_log ADD COLUMN site_id TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN environment TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN actor_role TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN target_type TEXT',
    "ALTER TABLE cms_audit_log ADD COLUMN status TEXT NOT NULL DEFAULT 'succeeded'",
    'ALTER TABLE cms_audit_log ADD COLUMN method TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN path TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN host TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN ip_hash TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN cf_ray TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN user_agent_hash TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN request_id TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN r2_key TEXT',
    "ALTER TABLE cms_audit_log ADD COLUMN r2_status TEXT NOT NULL DEFAULT 'pending'",
    'ALTER TABLE cms_audit_log ADD COLUMN r2_error TEXT',
    'ALTER TABLE cms_audit_log ADD COLUMN r2_stored_at TEXT'
  ]) {
    await addColumnIfMissing(db, sql);
  }
  await db.prepare(CREATE_AUDIT_INDEX_SQL).run();
  await db.prepare(CREATE_AUDIT_TARGET_INDEX_SQL).run();
  await db.prepare(CREATE_AUDIT_OUTBOX_SQL).run();
}

async function getCmsAuditContext(): Promise<CmsAuditContext> {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const context = await getCloudflareContext({ async: true });
  const env = context.env as Record<string, unknown>;
  const db = env.CMS_DB as CmsD1Database | undefined;
  if (!db) throw new Error('CMS_DB D1 binding is required');
  return {
    db,
    bucket: env.CMS_AUDIT_BUCKET as CmsAuditBucket | undefined,
    environment: String(env.CMS_ENVIRONMENT || env.ENVIRONMENT || 'development'),
    siteId: String(env.CMS_SITE_ID || 'site')
  };
}

async function insertAuditRow(db: CmsD1Database, event: CmsAuditEvent, r2Status: string, r2Error: string): Promise<D1Result> {
  return db
    .prepare(`
      INSERT INTO cms_audit_log (
        id, site_id, environment, actor_id, actor_role, action, target_type, target_id, status,
        method, path, host, ip_hash, cf_ray, user_agent_hash, request_id, payload,
        r2_key, r2_status, r2_error, r2_stored_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      event.id,
      event.siteId || '',
      event.environment || '',
      event.actorId,
      event.actorRole || '',
      event.action,
      event.targetType || '',
      event.targetId,
      event.status || 'succeeded',
      event.method || '',
      event.path || '',
      event.host || '',
      event.ipHash || '',
      event.cfRay || '',
      event.userAgentHash || '',
      event.requestId || '',
      JSON.stringify(event.payload || {}),
      event.r2Key || '',
      r2Status,
      r2Error,
      '',
      event.createdAt
    )
    .run();
}

async function markAuditStored(db: CmsD1Database, id: string): Promise<void> {
  await db.prepare('UPDATE cms_audit_log SET r2_status = ?, r2_error = ?, r2_stored_at = ? WHERE id = ?')
    .bind('stored', '', new Date().toISOString(), id)
    .run();
  await db.prepare('DELETE FROM cms_audit_outbox WHERE audit_id = ?').bind(id).run();
}

async function markAuditFailed(db: CmsD1Database, id: string, r2Key: string, error: string): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare('UPDATE cms_audit_log SET r2_status = ?, r2_error = ? WHERE id = ?').bind('failed', error, id).run();
  await db.prepare('INSERT INTO cms_audit_outbox (id, audit_id, r2_key, status, attempts, last_error, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?) ON CONFLICT(id) DO UPDATE SET status = excluded.status, attempts = attempts + 1, last_error = excluded.last_error, updated_at = excluded.updated_at')
    .bind(`audit-outbox-${id}`, id, r2Key, 'failed', error, now)
    .run();
}

function rowToAuditEvent(row: Record<string, unknown>): CmsAuditEvent {
  return {
    id: String(row.id || ''),
    siteId: String(row.site_id || ''),
    environment: String(row.environment || ''),
    actorId: String(row.actor_id || ''),
    actorRole: String(row.actor_role || '') as CmsAuditEvent['actorRole'],
    action: String(row.action || ''),
    targetType: String(row.target_type || ''),
    targetId: String(row.target_id || ''),
    status: String(row.status || 'succeeded') as CmsAuditEvent['status'],
    method: String(row.method || ''),
    path: String(row.path || ''),
    host: String(row.host || ''),
    ipHash: String(row.ip_hash || ''),
    cfRay: String(row.cf_ray || ''),
    userAgentHash: String(row.user_agent_hash || ''),
    requestId: String(row.request_id || ''),
    payload: safeJson(row.payload),
    r2Key: String(row.r2_key || ''),
    r2Status: String(row.r2_status || 'pending') as CmsAuditEvent['r2Status'],
    createdAt: String(row.created_at || '')
  };
}

function safeJson(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function sanitizeAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (/password|secret|token|cookie/i.test(key)) continue;
    if (typeof value === 'string') safe[key] = value.slice(0, 1000);
    else if (typeof value === 'number' || typeof value === 'boolean' || value == null) safe[key] = value;
    else {
      try {
        safe[key] = JSON.parse(JSON.stringify(value)) as unknown;
      } catch {
        safe[key] = String(value).slice(0, 1000);
      }
    }
  }
  return safe;
}

function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function hashHeader(value: string): Promise<string> {
  if (!value) return '';
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return `sha256:${Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function addColumnIfMissing(db: CmsD1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    if (!String(error).toLowerCase().includes('duplicate column')) throw error;
  }
}
