import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../lib/cms/auth.ts';
import { getCmsStore } from '../../../../../lib/cms/storage.ts';
import { userCanReadCmsContent } from '../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../lib/cms/security-headers.ts';
import type { CmsContent, CmsMediaAsset } from '../../../../../lib/cms/core.ts';

export async function GET(request: Request) {
  const user = await requireCmsPermission(request, 'media.read');
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || 50);
  const query = cleanText(url.searchParams.get('q'), 120).trim().toLowerCase();
  const store = await getCmsStore();
  const assets = await store.listMediaAssets(Number.isFinite(limit) ? limit : 50);
  const content = await store.listContent({ limit: 200 });
  const readableContent = content.filter((record) => userCanReadCmsContent(user, record));
  const visibleAssets = user.role === 'client'
    ? assets.filter((asset) => readableContent.some((record) => mediaAssetUsedByContent(asset, record)))
    : assets;
  const filteredAssets = visibleAssets.filter((asset) => matchesMediaAssetQuery(asset, query, readableContent));
  const assetsWithUsage = filteredAssets.map((asset) => ({
    ...asset,
    usedBy: mediaUsageForContent(asset, readableContent)
  }));
  if (user.role === 'client') {
    return cmsJson({
      ok: true,
      assets: assetsWithUsage
    });
  }
  return cmsJson({ ok: true, assets: assetsWithUsage });
}

export async function PATCH(request: Request) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'media.write');
  if (user instanceof Response) return user;
  const body = await request.json().catch(() => ({}));
  const asset = sanitizeMediaAssetUpdate(body?.asset, user.id);
  if (!asset) return cmsJson({ error: 'Valid CMS media asset metadata is required.' }, { status: 400 });
  const store = await getCmsStore();
  try {
    const updated = await store.updateMediaAsset(asset);
    return cmsJson({ ok: true, asset: updated });
  } catch {
    return cmsJson({ error: 'CMS media asset was not found.' }, { status: 404 });
  }
}

function sanitizeMediaAssetUpdate(value: unknown, userId: string): CmsMediaAsset | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const id = cleanToken(input.id, 180);
  const key = cleanMediaKey(input.key);
  const contentType = cleanText(input.contentType, 120);
  if (!id || !key || !contentType) return null;
  return {
    id,
    key,
    url: cleanText(input.url, 2048) || key,
    contentType,
    alt: cleanText(input.alt, 240),
    caption: cleanText(input.caption, 500),
    uploadedBy: userId,
    uploadedAt: cleanIsoDate(input.uploadedAt) || new Date().toISOString(),
    image: {
      crop: cleanText((input.image as { crop?: unknown } | undefined)?.crop, 80) || 'original',
      focalPoint: {
        x: clampNumber((input.image as { focalPoint?: { x?: unknown } } | undefined)?.focalPoint?.x, 0, 100, 50),
        y: clampNumber((input.image as { focalPoint?: { y?: unknown } } | undefined)?.focalPoint?.y, 0, 100, 50)
      }
    }
  };
}

function mediaAssetUsedByContent(asset: CmsMediaAsset, content: CmsContent): boolean {
  const haystack = JSON.stringify({
    blocks: content.blocks,
    metadata: {
      featuredImage: content.metadata?.featuredImage,
      socialImage: content.metadata?.socialImage
    }
  });
  return [asset.id, asset.key, asset.url].filter(Boolean).some((needle) => haystack.includes(String(needle)));
}

function mediaUsageForContent(asset: CmsMediaAsset, content: CmsContent[]): { id: string; title: string; slug: string; contentType: string }[] {
  return content
    .filter((record) => mediaAssetUsedByContent(asset, record))
    .map((record) => ({
      id: record.id,
      title: record.title,
      slug: record.slug,
      contentType: record.contentType
    }))
    .slice(0, 20);
}

function matchesMediaAssetQuery(asset: CmsMediaAsset, query: string, readableContent: CmsContent[]): boolean {
  if (!query) return true;
  const usedBy = mediaUsageForContent(asset, readableContent);
  return [
    asset.id,
    asset.key,
    asset.url,
    asset.contentType,
    asset.alt,
    asset.caption || '',
    ...usedBy.flatMap((record) => [record.title, record.slug, record.contentType])
  ].join(' ').toLowerCase().includes(query);
}

function cleanText(value: unknown, maxLength: number): string {
  return (typeof value === 'string' ? value : value == null ? '' : String(value))
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .slice(0, maxLength);
}

function cleanToken(value: unknown, maxLength: number): string {
  return cleanText(value, maxLength).replace(/[^a-z0-9:._/-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function cleanMediaKey(value: unknown): string {
  const key = cleanText(value, 500).replace(/^\/+/, '');
  return key.startsWith('cms/') ? key : '';
}

function cleanIsoDate(value: unknown): string {
  const raw = cleanText(value, 80);
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time).toISOString() : '';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}
