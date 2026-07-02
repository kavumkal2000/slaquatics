import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../lib/cms/auth.ts';
import { recordCmsAudit } from '../../../../../../lib/cms/audit.ts';
import { userCanReadCmsContent } from '../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../lib/cms/storage.ts';
import type { CmsContent, CmsMediaAsset } from '../../../../../../lib/cms/core.ts';

type R2BucketLike = {
  delete(key: string): Promise<unknown>;
};

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'media.write');
  if (user instanceof Response) return user;
  const { id } = await params;
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const store = await getCmsStore();
  const assets = await store.listMediaAssets(1000);
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) return cmsJson({ error: 'CMS media asset was not found.' }, { status: 404 });
  const content = await store.listContent({ limit: 1000 });
  const readableContent = content.filter((record) => userCanReadCmsContent(user, record));
  const usedBy = mediaUsageForContent(asset, readableContent);
  if (usedBy.length && (!force || user.role === 'client')) {
    await recordCmsAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'media.deleteBlocked',
      targetType: 'media',
      targetId: id,
      status: 'denied',
      request,
      metadata: { key: asset.key, usedBy }
    });
    return cmsJson({ error: 'CMS media asset is still in use.', usedBy }, { status: 409 });
  }
  const deleted = await store.deleteMediaAsset(id, user.id);
  if (!deleted) return cmsJson({ error: 'CMS media asset was not found.' }, { status: 404 });
  const bucket = await cmsMediaBucket();
  if (bucket) await bucket.delete(deleted.key).catch(() => null);
  return cmsJson({ ok: true, asset: deleted });
}

async function cmsMediaBucket(): Promise<R2BucketLike | undefined> {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const context = await getCloudflareContext({ async: true });
  return (context.env as Record<string, unknown>).CMS_MEDIA_BUCKET as R2BucketLike | undefined;
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
    .slice(0, 50);
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
