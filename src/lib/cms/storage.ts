import { contentIsPublished, type CmsAuditEvent, type CmsChangeRequest, type CmsContent, type CmsContentStatus, type CmsContentType, type CmsMediaAsset, type CmsRevision, type CmsRole } from './core.ts';
import { userCanReadCmsContent } from './policy.ts';
import { ensureCmsAuditTables, recordCmsAudit } from './audit.ts';

type CmsRoleHolder = {
  id?: string;
  role: CmsRole;
};

export type CmsD1Database = {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<{ meta?: { changes?: number }; changes?: number }>;
      all<T = unknown>(): Promise<{ results?: T[] }>;
    };
    first<T = unknown>(): Promise<T | null>;
    run(): Promise<{ meta?: { changes?: number }; changes?: number }>;
  };
};

export type CmsStore = {
  init(): Promise<void>;
  listContent(options?: CmsContentListOptions): Promise<CmsContent[]>;
  getPublishedContent(slug: string): Promise<CmsContent | null>;
  getDraftContent(slug: string): Promise<CmsContent | null>;
  getContentById(id: string): Promise<CmsContent | null>;
  getPreviewContent(token: string, slug: string, user: CmsRoleHolder): Promise<CmsContent | null>;
  listRevisions(contentId: string, limit?: number): Promise<CmsRevisionSummary[]>;
  getRevision(contentId: string, revisionId: string): Promise<CmsRevision | null>;
  saveDraft(content: CmsContent, userId: string): Promise<CmsContent>;
  publishContent(id: string, userId: string): Promise<CmsContent | null>;
  archiveContent(id: string, userId: string): Promise<CmsContent | null>;
  duplicateContent(id: string, input: { title?: string; slug?: string }, userId: string): Promise<CmsContent | null>;
  rollbackContent(id: string, revisionId: string, userId: string): Promise<CmsContent | null>;
  listChangeRequests(contentId: string): Promise<CmsChangeRequest[]>;
  createChangeRequest(input: { contentId: string; blockId: string; note: string }, userId: string): Promise<CmsChangeRequest | null>;
  resolveChangeRequest(contentId: string, requestId: string, userId: string): Promise<CmsChangeRequest | null>;
  createPreviewToken(contentId: string, userId: string): Promise<string>;
  saveMediaAsset(asset: CmsMediaAsset): Promise<CmsMediaAsset>;
  updateMediaAsset(asset: CmsMediaAsset): Promise<CmsMediaAsset>;
  replaceMediaAsset(id: string, replacement: CmsMediaAsset, userId: string): Promise<CmsMediaAsset | null>;
  deleteMediaAsset(id: string, userId: string): Promise<CmsMediaAsset | null>;
  listMediaAssets(limit?: number): Promise<CmsMediaAsset[]>;
  recordAuditEvent(event: CmsAuditEvent): Promise<CmsAuditEvent>;
};

export type CmsContentListOptions = {
  contentType?: CmsContentType;
  status?: CmsContentStatus;
  query?: string;
  limit?: number;
  publishedOnly?: boolean;
};

export type CmsRevisionSummary = {
  id: string;
  contentId: string;
  status: CmsContentStatus;
  createdAt: string;
  createdBy: string;
};

type CmsContentRow = {
  id?: string;
  slug?: string;
  status?: CmsContentStatus;
  payload: string;
  draft_payload?: string | null;
};

type CmsRevisionRow = {
  payload: string;
};

type CmsMediaAssetRow = {
  payload: string;
};

type CmsChangeRequestRow = {
  payload: string;
};

type CmsRevisionListRow = {
  id: string;
  content_id: string;
  status: CmsContentStatus;
  created_at: string;
  created_by: string;
};

const CREATE_CONTENT_SQL = `
  CREATE TABLE IF NOT EXISTS cms_content (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    payload TEXT NOT NULL,
    draft_payload TEXT,
    draft_updated_at TEXT,
    updated_at TEXT NOT NULL
  )
`;

const CREATE_REVISIONS_SQL = `
  CREATE TABLE IF NOT EXISTS cms_revisions (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    status TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL
  )
`;

const CREATE_PREVIEW_SQL = `
  CREATE TABLE IF NOT EXISTS cms_preview_tokens (
    token TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_by TEXT NOT NULL
  )
`;

const CREATE_MEDIA_SQL = `
  CREATE TABLE IF NOT EXISTS cms_media_assets (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    content_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    uploaded_by TEXT NOT NULL
  )
`;

const CREATE_CHANGE_REQUESTS_SQL = `
  CREATE TABLE IF NOT EXISTS cms_change_requests (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    block_id TEXT NOT NULL,
    status TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    resolved_at TEXT
  )
`;

const CREATE_CHANGE_REQUESTS_CONTENT_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_cms_change_requests_content_status_created
    ON cms_change_requests (content_id, status, created_at)
`;

const CREATE_CHANGE_REQUESTS_BLOCK_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_cms_change_requests_block
    ON cms_change_requests (block_id)
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

function parseContent(row: CmsContentRow | null): CmsContent | null {
  if (!row?.payload) return null;
  return JSON.parse(row.payload) as CmsContent;
}

function parseDraftContent(row: CmsContentRow | null): CmsContent | null {
  if (!row?.payload && !row?.draft_payload) return null;
  return JSON.parse(row.draft_payload || row.payload) as CmsContent;
}

function changed(result: { meta?: { changes?: number }; changes?: number }) {
  const count = result.meta?.changes ?? result.changes;
  return count === undefined || Number(count) > 0;
}

function publicStatusIsStored(content: CmsContent): boolean {
  return content.status === 'published' || content.status === 'scheduled';
}

export class D1CmsStore implements CmsStore {
  private readonly db: CmsD1Database;

  constructor(db: CmsD1Database) {
    this.db = db;
  }

  async init(): Promise<void> {
    await this.db.prepare(CREATE_CONTENT_SQL).run();
    await addColumnIfMissing(this.db, 'ALTER TABLE cms_content ADD COLUMN draft_payload TEXT');
    await addColumnIfMissing(this.db, 'ALTER TABLE cms_content ADD COLUMN draft_updated_at TEXT');
    await this.db.prepare(CREATE_REVISIONS_SQL).run();
    await this.db.prepare(CREATE_PREVIEW_SQL).run();
    await this.db.prepare(CREATE_MEDIA_SQL).run();
    await this.db.prepare(CREATE_CHANGE_REQUESTS_SQL).run();
    await this.db.prepare(CREATE_CHANGE_REQUESTS_CONTENT_INDEX_SQL).run();
    await this.db.prepare(CREATE_CHANGE_REQUESTS_BLOCK_INDEX_SQL).run();
    await this.db.prepare(CREATE_AUDIT_SQL).run();
    await ensureCmsAuditTables(this.db);
  }

  async listContent(options: CmsContentListOptions = {}): Promise<CmsContent[]> {
    await this.init();
    const cappedLimit = Math.min(Math.max(options.limit || 100, 1), 200);
    const clauses: string[] = [];
    const bindings: unknown[] = [];
    if (options.publishedOnly) {
      clauses.push('status IN (?, ?)');
      bindings.push('published', 'scheduled');
    } else if (options.status) {
      clauses.push('status = ?');
      bindings.push(options.status);
    }
    const { results = [] } = await this.db
      .prepare(`SELECT payload, draft_payload FROM cms_content${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY updated_at DESC LIMIT ?`)
      .bind(...bindings, cappedLimit)
      .all<CmsContentRow>();
    const query = (options.query || '').trim().toLowerCase();
    return results
      .map((row) => JSON.parse(options.publishedOnly ? row.payload : row.draft_payload || row.payload) as CmsContent)
      .filter((content) => !options.publishedOnly || contentIsPublished(content))
      .filter((content) => !options.contentType || content.contentType === options.contentType)
      .filter((content) => !query || `${content.title} ${content.slug} ${content.contentType} ${content.status}`.toLowerCase().includes(query));
  }

  async getPublishedContent(slug: string): Promise<CmsContent | null> {
    await this.init();
    const content = parseContent(await this.db
      .prepare('SELECT payload FROM cms_content WHERE slug = ? AND status IN (?, ?)')
      .bind(slug, 'published', 'scheduled')
      .first<CmsContentRow>());
    return content && contentIsPublished(content) ? content : null;
  }

  async getDraftContent(slug: string): Promise<CmsContent | null> {
    await this.init();
    return parseDraftContent(await this.db
      .prepare('SELECT payload, draft_payload FROM cms_content WHERE slug = ? OR json_extract(draft_payload, \'$.slug\') = ?')
      .bind(slug, slug)
      .first<CmsContentRow>());
  }

  async getContentById(id: string): Promise<CmsContent | null> {
    await this.init();
    return parseDraftContent(await this.db
      .prepare('SELECT payload, draft_payload FROM cms_content WHERE id = ?')
      .bind(id)
      .first<CmsContentRow>());
  }

  private async getStoredContentById(id: string): Promise<{ published: CmsContent; draft: CmsContent | null } | null> {
    const row = await this.db
      .prepare('SELECT payload, draft_payload FROM cms_content WHERE id = ?')
      .bind(id)
      .first<CmsContentRow>();
    const published = parseContent(row);
    if (!published) return null;
    return { published, draft: row?.draft_payload ? JSON.parse(row.draft_payload) as CmsContent : null };
  }

  async getPreviewContent(token: string, slug: string, user: CmsRoleHolder): Promise<CmsContent | null> {
    await this.init();
    const tokenRow = await this.db
      .prepare('SELECT content_id, expires_at FROM cms_preview_tokens WHERE token = ?')
      .bind(token)
      .first<{ content_id: string; expires_at: string }>();
    if (!tokenRow || Date.parse(tokenRow.expires_at) <= Date.now()) return null;
    const content = parseDraftContent(await this.db
      .prepare('SELECT payload, draft_payload FROM cms_content WHERE id = ?')
      .bind(tokenRow.content_id)
      .first<CmsContentRow>());
    if (!content || content.slug !== slug) return null;
    return userCanReadCmsContent(user, content) ? content : null;
  }

  async listRevisions(contentId: string, limit = 20): Promise<CmsRevisionSummary[]> {
    await this.init();
    const cappedLimit = Math.min(Math.max(limit, 1), 50);
    const { results = [] } = await this.db
      .prepare('SELECT id, content_id, status, created_at, created_by FROM cms_revisions WHERE content_id = ? ORDER BY created_at DESC LIMIT ?')
      .bind(contentId, cappedLimit)
      .all<CmsRevisionListRow>();
    return results.map((row) => ({
      id: row.id,
      contentId: row.content_id,
      status: row.status,
      createdAt: row.created_at,
      createdBy: row.created_by
    }));
  }

  async getRevision(contentId: string, revisionId: string): Promise<CmsRevision | null> {
    await this.init();
    const row = await this.db
      .prepare('SELECT payload FROM cms_revisions WHERE content_id = ? AND id = ?')
      .bind(contentId, revisionId)
      .first<CmsRevisionRow>();
    return row?.payload ? JSON.parse(row.payload) as CmsRevision : null;
  }

  async saveDraft(content: CmsContent, userId: string): Promise<CmsContent> {
    await this.init();
    const now = new Date().toISOString();
    const draftBase: CmsContent = { ...content, status: 'draft', updatedAt: now };
    const revision = createRevision(draftBase, 'draft', userId, now);
    const draft: CmsContent = { ...draftBase, draftRevisionId: revision.id };
    revision.content = structuredClone(draft);
    const current = await this.getStoredContentById(draft.id);
    if (current && publicStatusIsStored(current.published)) {
      await this.db
        .prepare('UPDATE cms_content SET draft_payload = ?, draft_updated_at = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(draft), now, now, draft.id)
        .run();
    } else {
      await this.db
        .prepare('INSERT INTO cms_content (id, slug, status, payload, draft_payload, draft_updated_at, updated_at) VALUES (?, ?, ?, ?, NULL, NULL, ?) ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, status = excluded.status, payload = excluded.payload, draft_payload = NULL, draft_updated_at = NULL, updated_at = excluded.updated_at')
        .bind(draft.id, draft.slug, draft.status, JSON.stringify(draft), now)
        .run();
    }
    await this.insertRevision(revision);
    await this.pruneRevisions(draft.id, 100);
    await this.recordAuditEvent(createAuditEvent(userId, 'content.saveDraft', draft.id, { slug: draft.slug, contentType: draft.contentType }));
    return draft;
  }

  async publishContent(id: string, userId: string): Promise<CmsContent | null> {
    await this.init();
    const stored = await this.getStoredContentById(id);
    const current = stored?.draft || stored?.published || null;
    if (!current) return null;
    const now = new Date().toISOString();
    const scheduledAt = current.publish?.scheduledAt ? Date.parse(current.publish.scheduledAt) : NaN;
    const nextStatus: CmsContentStatus = Number.isFinite(scheduledAt) && scheduledAt > Date.now() ? 'scheduled' : 'published';
    const publishedBase: CmsContent = {
      ...current,
      status: nextStatus,
      updatedAt: now,
      publishedAt: nextStatus === 'published' ? now : current.publishedAt
    };
    const revision = createRevision(publishedBase, nextStatus, userId, now);
    const published: CmsContent = {
      ...publishedBase,
      publishedRevisionId: revision.id
    };
    revision.content = structuredClone(published);
    const result = await this.db
      .prepare('UPDATE cms_content SET slug = ?, status = ?, payload = ?, draft_payload = NULL, draft_updated_at = NULL, updated_at = ? WHERE id = ?')
      .bind(published.slug, published.status, JSON.stringify(published), now, id)
      .run();
    if (!changed(result)) return null;
    await this.insertRevision(revision);
    await this.pruneRevisions(published.id, 100);
    await this.recordAuditEvent(createAuditEvent(userId, nextStatus === 'scheduled' ? 'content.schedule' : 'content.publish', published.id, { slug: published.slug, contentType: published.contentType }));
    return published;
  }

  async archiveContent(id: string, userId: string): Promise<CmsContent | null> {
    await this.init();
    const stored = await this.getStoredContentById(id);
    const current = stored?.draft || stored?.published || null;
    if (!current) return null;
    const now = new Date().toISOString();
    const archivedBase: CmsContent = {
      ...current,
      status: 'archived',
      updatedAt: now
    };
    const revision = createRevision(archivedBase, 'archived', userId, now);
    const archived: CmsContent = {
      ...archivedBase,
      draftRevisionId: revision.id
    };
    revision.content = structuredClone(archived);
    const result = await this.db
      .prepare('UPDATE cms_content SET status = ?, payload = ?, draft_payload = NULL, draft_updated_at = NULL, updated_at = ? WHERE id = ?')
      .bind(archived.status, JSON.stringify(archived), now, id)
      .run();
    if (!changed(result)) return null;
    await this.insertRevision(revision);
    await this.pruneRevisions(archived.id, 100);
    await this.recordAuditEvent(createAuditEvent(userId, 'content.archive', archived.id, { slug: archived.slug, contentType: archived.contentType }));
    return archived;
  }

  async duplicateContent(id: string, input: { title?: string; slug?: string }, userId: string): Promise<CmsContent | null> {
    await this.init();
    const stored = await this.getStoredContentById(id);
    const source = stored?.draft || stored?.published || null;
    if (!source) return null;
    const slug = input.slug || await this.nextCopySlug(source.slug);
    if (!slug || await this.slugExists(slug)) return null;
    const now = new Date().toISOString();
    const duplicate: CmsContent = {
      ...structuredClone(source),
      id: `${source.id}-copy-${crypto.randomUUID().slice(0, 8)}`,
      slug,
      title: input.title || `${source.title} Copy`,
      status: 'draft',
      publishedAt: undefined,
      publishedRevisionId: undefined,
      draftRevisionId: undefined,
      createdAt: now,
      updatedAt: now
    };
    const saved = await this.saveDraft(duplicate, userId);
    await this.recordAuditEvent(createAuditEvent(userId, 'content.duplicate', saved.id, { sourceId: source.id, slug: saved.slug, contentType: saved.contentType }));
    return saved;
  }

  async rollbackContent(id: string, revisionId: string, userId: string): Promise<CmsContent | null> {
    await this.init();
    const revision = await this.db
      .prepare('SELECT payload FROM cms_revisions WHERE id = ? AND content_id = ?')
      .bind(revisionId, id)
      .first<CmsRevisionRow>();
    if (!revision) return null;
    const content = JSON.parse(revision.payload) as CmsRevision;
    const rolledBack = await this.saveDraft({ ...content.content, status: 'draft' }, userId);
    await this.recordAuditEvent(createAuditEvent(userId, 'content.rollback', id, { revisionId }));
    return rolledBack;
  }

  async listChangeRequests(contentId: string): Promise<CmsChangeRequest[]> {
    await this.init();
    const { results = [] } = await this.db
      .prepare('SELECT payload FROM cms_change_requests WHERE content_id = ? ORDER BY created_at DESC LIMIT 100')
      .bind(contentId)
      .all<CmsChangeRequestRow>();
    return results.map((row) => JSON.parse(row.payload) as CmsChangeRequest);
  }

  async createChangeRequest(input: { contentId: string; blockId: string; note: string }, userId: string): Promise<CmsChangeRequest | null> {
    await this.init();
    const content = await this.getContentById(input.contentId);
    if (!content || !content.blocks.some((block) => block.id === input.blockId)) return null;
    const now = new Date().toISOString();
    const request: CmsChangeRequest = {
      id: crypto.randomUUID(),
      contentId: input.contentId,
      blockId: input.blockId,
      note: input.note,
      status: 'open',
      createdAt: now,
      createdBy: userId
    };
    await this.db
      .prepare('INSERT INTO cms_change_requests (id, content_id, block_id, status, payload, created_at, created_by, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)')
      .bind(request.id, request.contentId, request.blockId, request.status, JSON.stringify(request), request.createdAt, request.createdBy)
      .run();
    await this.recordAuditEvent(createAuditEvent(userId, 'content.changeRequest.create', input.contentId, { blockId: input.blockId, requestId: request.id }));
    return request;
  }

  async resolveChangeRequest(contentId: string, requestId: string, userId: string): Promise<CmsChangeRequest | null> {
    await this.init();
    const row = await this.db
      .prepare('SELECT payload FROM cms_change_requests WHERE id = ? AND content_id = ?')
      .bind(requestId, contentId)
      .first<CmsChangeRequestRow>();
    if (!row?.payload) return null;
    const now = new Date().toISOString();
    const request: CmsChangeRequest = {
      ...JSON.parse(row.payload) as CmsChangeRequest,
      status: 'resolved',
      resolvedAt: now,
      resolvedBy: userId
    };
    const result = await this.db
      .prepare('UPDATE cms_change_requests SET status = ?, payload = ?, resolved_at = ? WHERE id = ? AND content_id = ?')
      .bind(request.status, JSON.stringify(request), now, requestId, contentId)
      .run();
    if (!changed(result)) return null;
    await this.recordAuditEvent(createAuditEvent(userId, 'content.changeRequest.resolve', contentId, { blockId: request.blockId, requestId }));
    return request;
  }

  async createPreviewToken(contentId: string, userId: string): Promise<string> {
    await this.init();
    await this.db
      .prepare('DELETE FROM cms_preview_tokens WHERE expires_at <= ?')
      .bind(new Date().toISOString())
      .run();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await this.db
      .prepare('INSERT INTO cms_preview_tokens (token, content_id, expires_at, created_by) VALUES (?, ?, ?, ?)')
      .bind(token, contentId, expiresAt, userId)
      .run();
    return token;
  }

  async saveMediaAsset(asset: CmsMediaAsset): Promise<CmsMediaAsset> {
    await this.init();
    await this.db
      .prepare('INSERT INTO cms_media_assets (id, key, content_type, payload, uploaded_at, uploaded_by) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET content_type = excluded.content_type, payload = excluded.payload, uploaded_at = excluded.uploaded_at, uploaded_by = excluded.uploaded_by')
      .bind(asset.id, asset.key, asset.contentType, JSON.stringify(asset), asset.uploadedAt, asset.uploadedBy)
      .run();
    await this.recordAuditEvent(createAuditEvent(asset.uploadedBy, 'media.save', asset.id, { key: asset.key, contentType: asset.contentType }));
    return asset;
  }

  async updateMediaAsset(asset: CmsMediaAsset): Promise<CmsMediaAsset> {
    await this.init();
    const current = await this.getMediaAsset(asset.id);
    if (!current) throw new Error('CMS media asset was not found.');
    const updated: CmsMediaAsset = {
      ...current,
      alt: asset.alt,
      caption: asset.caption,
      image: asset.image
    };
    const result = await this.db
      .prepare('UPDATE cms_media_assets SET payload = ? WHERE id = ?')
      .bind(JSON.stringify(updated), asset.id)
      .run();
    if (!changed(result)) throw new Error('CMS media asset was not found.');
    await this.recordAuditEvent(createAuditEvent(asset.uploadedBy, 'media.update', asset.id, { key: updated.key }));
    return updated;
  }

  async replaceMediaAsset(id: string, replacement: CmsMediaAsset, userId: string): Promise<CmsMediaAsset | null> {
    await this.init();
    const current = await this.getMediaAsset(id);
    if (!current) return null;
    const updated: CmsMediaAsset = {
      ...current,
      key: replacement.key,
      url: replacement.url,
      contentType: replacement.contentType,
      alt: replacement.alt || current.alt,
      caption: replacement.caption ?? current.caption,
      uploadedBy: userId,
      uploadedAt: replacement.uploadedAt,
      image: replacement.image
    };
    const result = await this.db
      .prepare('UPDATE cms_media_assets SET key = ?, content_type = ?, payload = ?, uploaded_at = ?, uploaded_by = ? WHERE id = ?')
      .bind(updated.key, updated.contentType, JSON.stringify(updated), updated.uploadedAt, updated.uploadedBy, id)
      .run();
    if (!changed(result)) return null;
    await this.recordAuditEvent(createAuditEvent(userId, 'media.replace', id, { previousKey: current.key, key: updated.key, contentType: updated.contentType }));
    return updated;
  }

  async deleteMediaAsset(id: string, userId: string): Promise<CmsMediaAsset | null> {
    await this.init();
    const current = await this.getMediaAsset(id);
    if (!current) return null;
    const result = await this.db
      .prepare('DELETE FROM cms_media_assets WHERE id = ?')
      .bind(id)
      .run();
    if (!changed(result)) return null;
    await this.recordAuditEvent(createAuditEvent(userId, 'media.delete', id, { key: current.key, contentType: current.contentType }));
    return current;
  }

  private async getMediaAsset(id: string): Promise<CmsMediaAsset | null> {
    const row = await this.db
      .prepare('SELECT payload FROM cms_media_assets WHERE id = ?')
      .bind(id)
      .first<CmsMediaAssetRow>();
    return row?.payload ? JSON.parse(row.payload) as CmsMediaAsset : null;
  }

  async listMediaAssets(limit = 50): Promise<CmsMediaAsset[]> {
    await this.init();
    const cappedLimit = Math.min(Math.max(limit, 1), 100);
    const { results = [] } = await this.db
      .prepare('SELECT payload FROM cms_media_assets ORDER BY uploaded_at DESC LIMIT ?')
      .bind(cappedLimit)
      .all<CmsMediaAssetRow>();
    return results.map((row) => JSON.parse(row.payload) as CmsMediaAsset);
  }

  private async insertRevision(revision: CmsRevision) {
    await this.db
      .prepare('INSERT INTO cms_revisions (id, content_id, status, payload, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(revision.id, revision.contentId, revision.status, JSON.stringify(revision), revision.createdAt, revision.createdBy)
      .run();
  }

  private async pruneRevisions(contentId: string, keep: number) {
    await this.db
      .prepare('DELETE FROM cms_revisions WHERE content_id = ? AND id NOT IN (SELECT id FROM cms_revisions WHERE content_id = ? ORDER BY created_at DESC LIMIT ?)')
      .bind(contentId, contentId, keep)
      .run();
  }

  private async slugExists(slug: string): Promise<boolean> {
    const row = await this.db
      .prepare('SELECT id FROM cms_content WHERE slug = ? OR json_extract(draft_payload, \'$.slug\') = ? LIMIT 1')
      .bind(slug, slug)
      .first<{ id: string }>();
    return Boolean(row?.id);
  }

  private async nextCopySlug(slug: string): Promise<string> {
    const base = `${slug}-copy`;
    if (!await this.slugExists(base)) return base;
    for (let index = 2; index <= 100; index += 1) {
      const candidate = `${base}-${index}`;
      if (!await this.slugExists(candidate)) return candidate;
    }
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }

  async recordAuditEvent(event: CmsAuditEvent): Promise<CmsAuditEvent> {
    return recordCmsAudit({
      actorId: event.actorId,
      actorRole: event.actorRole,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      status: event.status || 'succeeded',
      metadata: event.payload
    });
  }
}

async function addColumnIfMissing(db: CmsD1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    if (!String(error).toLowerCase().includes('duplicate column')) throw error;
  }
}

function createRevision(content: CmsContent, status: CmsContentStatus, userId: string, now: string): CmsRevision {
  return {
    id: `${content.id}-${status}-${Date.now()}`,
    contentId: content.id,
    status,
    content: structuredClone(content),
    createdAt: now,
    createdBy: userId
  };
}

function createAuditEvent(actorId: string, action: string, targetId: string, payload: Record<string, unknown>): CmsAuditEvent {
  return {
    id: crypto.randomUUID(),
    actorId,
    action,
    targetId,
    payload,
    createdAt: new Date().toISOString()
  };
}

export async function getCmsStore(): Promise<CmsStore> {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const context = await getCloudflareContext({ async: true });
  const env = context.env as Record<string, unknown>;
  const db = env.CMS_DB as CmsD1Database | undefined;
  if (!db) throw new Error('CMS_DB D1 binding is required');
  return new D1CmsStore(db);
}
