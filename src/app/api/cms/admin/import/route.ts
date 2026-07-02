import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../lib/cms/auth.ts';
import { recordCmsAudit } from '../../../../../lib/cms/audit.ts';
import type { CmsContent, CmsMediaAsset, CmsSiteConfig } from '../../../../../lib/cms/core.ts';
import { cmsJson } from '../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../lib/cms/storage.ts';
import { validateAndSanitizeCmsContent } from '../../../../../lib/cms/validation.ts';
import { activeCmsSiteAdapter } from '../../../../../lib/site-cms/active.ts';

type CmsImportPlan = {
  ok: true;
  sourceSiteId: string;
  content: CmsContent[];
  media: CmsMediaAsset[];
  warnings: string[];
} | {
  ok: false;
  errors: string[];
};

type CmsExportLikeManifest = {
  kind?: unknown;
  schemaVersion?: unknown;
  siteId?: unknown;
  content?: unknown;
  media?: unknown;
};

const maxImportContentItems = 200;
const maxImportMediaItems = 500;

export function buildCmsImportPlan(manifest: unknown, siteConfig: CmsSiteConfig): CmsImportPlan {
  if (!isRecord(manifest)) return { ok: false, errors: ['A CMS export manifest is required.'] };
  const source = manifest as CmsExportLikeManifest;
  if (source.kind !== 'embedded-cms-export' || source.schemaVersion !== 1) {
    return { ok: false, errors: ['Unsupported CMS import manifest.'] };
  }
  const contentInput = Array.isArray(source.content) ? source.content.slice(0, maxImportContentItems) : [];
  const errors: string[] = [];
  const content: CmsContent[] = [];
  for (const [index, item] of contentInput.entries()) {
    const result = validateAndSanitizeCmsContent(item, siteConfig);
    if (!result.ok) {
      errors.push(`Content item ${index + 1}: ${result.error}`);
      continue;
    }
    content.push({
      ...result.content,
      status: 'draft',
      publishedAt: undefined,
      publishedRevisionId: undefined,
      draftRevisionId: undefined,
      updatedAt: new Date().toISOString()
    });
  }
  if (errors.length) return { ok: false, errors };
  const media = Array.isArray(source.media)
    ? source.media.slice(0, maxImportMediaItems).map(sanitizeImportMediaAsset).filter((asset): asset is CmsMediaAsset => Boolean(asset))
    : [];
  return {
    ok: true,
    sourceSiteId: cleanImportText(source.siteId, 120) || 'unknown-site',
    content,
    media,
    warnings: media.length ? ['Media metadata is included for review; upload or replace assets in this site media library before publishing imported drafts.'] : []
  };
}

export async function POST(request: Request) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'site.import');
  if (user instanceof Response) return user;
  const body = await request.json().catch(() => ({}));
  const dryRun = body?.dryRun !== false;
  const plan = buildCmsImportPlan(body?.manifest || body, activeCmsSiteAdapter.siteConfig);
  if (!plan.ok) {
    await recordCmsAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'site.importFailed',
      targetType: 'site',
      targetId: activeCmsSiteAdapter.siteConfig.siteId,
      status: 'failed',
      request,
      metadata: { errors: plan.errors }
    });
    return cmsJson({ ok: false, errors: plan.errors }, { status: 400 });
  }
  if (dryRun) {
    await recordCmsAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'site.importDryRun',
      targetType: 'site',
      targetId: activeCmsSiteAdapter.siteConfig.siteId,
      request,
      metadata: { contentCount: plan.content.length, mediaCount: plan.media.length, sourceSiteId: plan.sourceSiteId }
    });
    return cmsJson({ ok: true, dryRun, plan });
  }
  const store = await getCmsStore();
  const imported: CmsContent[] = [];
  for (const content of plan.content) {
    imported.push(await store.saveDraft(content, user.id));
  }
  await recordCmsAudit({
    actorId: user.id,
    actorRole: user.role,
    action: 'site.import',
    targetType: 'site',
    targetId: activeCmsSiteAdapter.siteConfig.siteId,
    request,
    metadata: { contentCount: imported.length, mediaCount: plan.media.length, sourceSiteId: plan.sourceSiteId }
  });
  return cmsJson({ ok: true, dryRun, imported, media: plan.media, warnings: plan.warnings });
}

function sanitizeImportMediaAsset(value: unknown): CmsMediaAsset | null {
  if (!isRecord(value)) return null;
  const id = cleanImportToken(value.id, 180);
  const key = cleanImportToken(value.key, 500);
  const contentType = cleanImportText(value.contentType, 120);
  if (!id || !key || !contentType) return null;
  return {
    id,
    key,
    url: cleanImportUrl(value.url),
    contentType,
    alt: cleanImportText(value.alt, 500),
    caption: cleanImportText(value.caption, 1000) || undefined,
    uploadedBy: cleanImportToken(value.uploadedBy, 180) || 'import',
    uploadedAt: cleanImportText(value.uploadedAt, 80) || new Date().toISOString(),
    image: isRecord(value.image) ? {
      crop: cleanImportToken(value.image.crop, 80) || undefined,
      focalPoint: sanitizeFocalPoint(value.image.focalPoint)
    } : undefined
  };
}

function sanitizeFocalPoint(value: unknown): NonNullable<CmsMediaAsset['image']>['focalPoint'] | undefined {
  if (!isRecord(value)) return undefined;
  const x = finiteImportNumber(value.x);
  const y = finiteImportNumber(value.y);
  return x === undefined || y === undefined ? undefined : { x, y };
}

function cleanImportUrl(value: unknown): string {
  const raw = cleanImportText(value, 2048);
  if (!raw || /javascript:|data:text\/html|<\/?\s*script|on\w+\s*=/i.test(raw)) return '';
  if (raw.startsWith('/') || /^cms\//i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function cleanImportText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .slice(0, maxLength);
}

function cleanImportToken(value: unknown, maxLength: number): string {
  return cleanImportText(value, maxLength).replace(/[^a-z0-9:._/-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function finiteImportNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
