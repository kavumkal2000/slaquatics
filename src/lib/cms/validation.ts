import type { CmsBlock, CmsContent, CmsContentStatus, CmsSiteConfig } from './core.ts';
import { normalizeCmsSlug } from './core.ts';

export type CmsValidationResult = {
  ok: true;
  content: CmsContent;
} | {
  ok: false;
  error: string;
};

const allowedStatuses: CmsContentStatus[] = ['draft', 'published', 'scheduled', 'archived'];
const textLimit = 12000;
const collectionLimit = 80;
const depthLimit = 8;
const allowedUrlProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function validateAndSanitizeCmsContent(content: unknown, siteConfig: CmsSiteConfig): CmsValidationResult {
  if (!isRecord(content)) return { ok: false, error: 'Valid CMS content is required.' };

  const id = cleanToken(content.id, 180);
  const slug = normalizeCmsSlug(stringValue(content.slug));
  const title = cleanText(content.title, 240);
  const status = stringValue(content.status) as CmsContentStatus;
  const contentType = stringValue(content.contentType) as CmsContent['contentType'];
  if (!id || !slug || !title || !allowedStatuses.includes(status) || !contentType) {
    return { ok: false, error: 'CMS content id, slug, title, contentType, and valid status are required.' };
  }

  const allowedBlocks = new Set(siteConfig.blocks.map((block) => block.type));
  const blocksInput = Array.isArray(content.blocks) ? content.blocks : [];
  if (blocksInput.length > 120) return { ok: false, error: 'CMS content has too many blocks.' };

  const blocks: CmsBlock[] = [];
  for (const [index, block] of blocksInput.entries()) {
    if (!isRecord(block)) return { ok: false, error: `CMS block ${index + 1} is invalid.` };
    const type = cleanToken(block.type, 80);
    if (!allowedBlocks.has(type)) return { ok: false, error: `CMS block type "${type}" is not allowed for this site.` };
    const sanitizedBlock = sanitizeBlock(block, type, index);
    const unsafe = findUnsafeValue(sanitizedBlock.props, '', siteConfig);
    if (unsafe) return { ok: false, error: unsafe };
    blocks.push(sanitizedBlock);
  }

  const sanitized: CmsContent = {
    id,
    slug,
    title,
    contentType,
    status,
    blocks,
    template: cleanToken(content.template, 120) || undefined,
    taxonomies: sanitizeTaxonomies(content.taxonomies),
    metadata: sanitizeMetadata(content.metadata),
    publish: sanitizePublish(content.publish),
    seo: sanitizeSeo(content.seo),
    publishedRevisionId: cleanToken(content.publishedRevisionId, 220) || undefined,
    draftRevisionId: cleanToken(content.draftRevisionId, 220) || undefined,
    createdAt: cleanIsoDate(content.createdAt) || new Date().toISOString(),
    updatedAt: cleanIsoDate(content.updatedAt) || new Date().toISOString(),
    publishedAt: cleanIsoDate(content.publishedAt) || undefined
  };

  if (sanitized.status === 'scheduled' && !sanitized.publish?.scheduledAt) {
    return { ok: false, error: 'Scheduled CMS content requires a scheduled publish date.' };
  }

  return { ok: true, content: sanitized };
}

export function safeCmsUrl(value: unknown): string {
  const raw = cleanText(value, 2048);
  if (!raw) return '';
  if (raw.startsWith('/') || raw.startsWith('#')) return raw;
  if (/^(cms|site|brand)\//i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return allowedUrlProtocols.has(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

export function safeCmsMediaUrl(value: unknown, siteConfig: CmsSiteConfig): string {
  const raw = cleanText(value, 2048);
  if (!raw) return '';
  if (raw.startsWith('/') || /^(cms|site|brand)\//i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const allowedHosts = new Set(siteConfig.media.allowedExternalHosts || []);
    return allowedHosts.has(url.hostname.toLowerCase()) ? url.toString() : '';
  } catch {
    return '';
  }
}

export function safeCmsEmbedUrl(value: unknown): string {
  const url = safeCmsUrl(value);
  if (!url || url.startsWith('/') || url.startsWith('#')) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const allowed = (host === 'www.google.com' && parsed.pathname.startsWith('/maps/embed'))
      || (host === 'maps.google.com' && parsed.pathname.startsWith('/maps/embed'))
      || (host === 'www.youtube.com' && parsed.pathname.startsWith('/embed/'))
      || (host === 'youtube.com' && parsed.pathname.startsWith('/embed/'))
      || (host === 'player.vimeo.com' && parsed.pathname.startsWith('/video/'));
    return allowed ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeBlock(block: Record<string, unknown>, type: string, index: number): CmsBlock {
  const id = cleanToken(block.id, 180) || `${type}-${index + 1}`;
  const label = cleanText(block.label, 160) || type;
  const props = sanitizeValue(block.props, 0) as Record<string, unknown>;
  return {
    id,
    type,
    label,
    props,
    visibility: isRecord(block.visibility) ? { hidden: Boolean(block.visibility.hidden) } : undefined
  };
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > depthLimit) return '';
  if (typeof value === 'string') return cleanText(value, textLimit);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, collectionLimit).map((item) => sanitizeValue(item, depth + 1));
  if (!isRecord(value)) return value == null ? '' : cleanText(String(value), textLimit);
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, collectionLimit)
      .map(([key, item]) => [cleanToken(key, 80), sanitizeValue(item, depth + 1)])
      .filter(([key]) => Boolean(key))
  );
}

function findUnsafeValue(value: unknown, key = '', siteConfig?: CmsSiteConfig): string {
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (/<\/?\s*script|on\w+\s*=|javascript:|data:text\/html/i.test(value)) {
      return `Unsafe CMS content was rejected in ${key || 'content'}.`;
    }
    if (key === 'mapEmbedUrl' || key === 'embedUrl') {
      if (value && !safeCmsEmbedUrl(value)) return `Unsafe embed URL was rejected in ${key}.`;
    } else if (isMediaUrlField(key) && value && siteConfig && !safeCmsMediaUrl(value, siteConfig)) {
      return `Unsafe media URL was rejected in ${key}.`;
    } else if (isUrlLikeField(key) && value && !safeCmsUrl(value)) {
      return `Unsafe URL was rejected in ${key}.`;
    }
    if (lowered.startsWith('data:')) return `Unsafe data URL was rejected in ${key || 'content'}.`;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const unsafe = findUnsafeValue(item, key, siteConfig);
      if (unsafe) return unsafe;
    }
  }
  if (isRecord(value)) {
    for (const [childKey, childValue] of Object.entries(value)) {
      const unsafe = findUnsafeValue(childValue, childKey, siteConfig);
      if (unsafe) return unsafe;
    }
  }
  return '';
}

function isMediaUrlField(field: string) {
  return ['src', 'poster', 'image', 'videoSrc', 'moduleSrc', 'socialImage', 'featuredImage'].includes(field);
}

function isUrlLikeField(field: string) {
  return ['href', 'src', 'poster', 'image', 'videoSrc', 'moduleSrc', 'socialImage', 'featuredImage', 'mapsUrl', 'mapEmbedUrl', 'embedUrl'].includes(field);
}

function sanitizeSeo(value: unknown): CmsContent['seo'] | undefined {
  if (!isRecord(value)) return undefined;
  return {
    title: cleanText(value.title, 160),
    description: cleanText(value.description, 320)
  };
}

function sanitizeTaxonomies(value: unknown): CmsContent['taxonomies'] | undefined {
  if (!isRecord(value)) return undefined;
  return {
    categories: cleanStringList(value.categories, 20),
    tags: cleanStringList(value.tags, 50)
  };
}

function sanitizeMetadata(value: unknown): CmsContent['metadata'] | undefined {
  if (!isRecord(value)) return undefined;
  const custom = isRecord(value.custom)
    ? Object.fromEntries(Object.entries(value.custom).slice(0, 30).map(([key, item]) => [cleanToken(key, 80), cleanText(item, 500)]).filter(([key]) => key))
    : undefined;
  return {
    featuredImage: safeCmsUrl(value.featuredImage) || undefined,
    socialImage: safeCmsUrl(value.socialImage) || undefined,
    parentSlug: normalizeCmsSlug(stringValue(value.parentSlug)) || undefined,
    sortOrder: finiteNumber(value.sortOrder),
    excerpt: cleanText(value.excerpt, 500) || undefined,
    readTimeMinutes: finiteNumber(value.readTimeMinutes),
    access: sanitizeAccess(value.access),
    custom
  };
}

function sanitizeAccess(value: unknown): NonNullable<NonNullable<CmsContent['metadata']>['access']> | undefined {
  if (!isRecord(value)) return undefined;
  const ownerUserId = cleanAccessToken(value.ownerUserId, 180) || undefined;
  const assignedUserIds = cleanTokenList(value.assignedUserIds, 50);
  const locked = Boolean(value.locked);
  if (!ownerUserId && !assignedUserIds.length && !locked) return undefined;
  return {
    ownerUserId,
    assignedUserIds,
    locked
  };
}

function sanitizePublish(value: unknown): CmsContent['publish'] | undefined {
  if (!isRecord(value)) return undefined;
  const reviewStatus = ['draft', 'needsReview', 'approved'].includes(stringValue(value.reviewStatus))
    ? stringValue(value.reviewStatus) as 'draft' | 'needsReview' | 'approved'
    : undefined;
  return {
    scheduledAt: cleanIsoDate(value.scheduledAt) || undefined,
    expiresAt: cleanIsoDate(value.expiresAt) || undefined,
    reviewStatus
  };
}

function cleanStringList(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? value.slice(0, limit).map((item) => cleanText(item, 80)).filter(Boolean)
    : [];
}

function cleanTokenList(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? value.slice(0, limit).map((item) => cleanAccessToken(item, 180)).filter(Boolean)
    : [];
}

function cleanText(value: unknown, maxLength: number): string {
  return stringValue(value)
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .slice(0, maxLength);
}

function cleanToken(value: unknown, maxLength: number): string {
  return cleanText(value, maxLength).replace(/[^a-z0-9:._/-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function cleanAccessToken(value: unknown, maxLength: number): string {
  return cleanText(value, maxLength).replace(/[^a-z0-9:._-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function cleanIsoDate(value: unknown): string {
  const raw = stringValue(value);
  if (!raw) return '';
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time).toISOString() : '';
}

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
