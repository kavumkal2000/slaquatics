import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../lib/cms/storage.ts';
import { activeCmsSiteAdapter } from '../../../../../../../lib/site-cms/active.ts';

type R2BucketLike = {
  put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'media.write');
  if (user instanceof Response) return user;
  const mediaConfig = activeCmsSiteAdapter.siteConfig.media;
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength && contentLength > mediaConfig.maxBytes) {
    return cmsJson({ error: 'CMS media replacement is too large.' }, { status: 413 });
  }
  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  if (!mediaConfig.allowedMimeTypes.includes(contentType)) {
    return cmsJson({ error: 'CMS media type is not allowed.' }, { status: 415 });
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > mediaConfig.maxBytes) {
    return cmsJson({ error: 'CMS media replacement is too large.' }, { status: 413 });
  }
  if (!mediaMagicMatches(contentType, bytes)) {
    return cmsJson({ error: 'CMS media content does not match its declared file type.' }, { status: 415 });
  }
  const bucket = await cmsMediaBucket();
  if (!bucket) return cmsJson({ error: 'CMS media storage is not configured.' }, { status: 503 });
  const { id } = await params;
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('jpeg') ? 'jpg' : contentType.includes('mp4') ? 'mp4' : contentType.includes('webm') ? 'webm' : 'bin';
  const uploadedAt = new Date().toISOString();
  const key = `${mediaConfig.uploadPrefix.replace(/\/?$/, '/')}${uploadedAt.slice(0, 10)}/${id}-replacement-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  await bucket.put(key, bytes, { httpMetadata: { contentType } });
  const store = await getCmsStore();
  const replaced = await store.replaceMediaAsset(id, {
    id,
    key,
    url: mediaConfig.publicUrlForKey(key),
    contentType,
    alt: '',
    caption: '',
    uploadedBy: user.id,
    uploadedAt,
    image: contentType.startsWith('image/')
      ? { crop: 'original', focalPoint: { x: 50, y: 50 } }
      : undefined
  }, user.id);
  if (!replaced) return cmsJson({ error: 'CMS media asset was not found.' }, { status: 404 });
  return cmsJson({ ok: true, asset: replaced });
}

async function cmsMediaBucket(): Promise<R2BucketLike | undefined> {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const context = await getCloudflareContext({ async: true });
  return (context.env as Record<string, unknown>).CMS_MEDIA_BUCKET as R2BucketLike | undefined;
}

function mediaMagicMatches(contentType: string, bytes: ArrayBuffer): boolean {
  const header = new Uint8Array(bytes.slice(0, 16));
  if (contentType === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (contentType === 'image/png') return header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  if (contentType === 'image/gif') return header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;
  if (contentType === 'image/webp') return String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  if (contentType === 'video/mp4') return String.fromCharCode(...header.slice(4, 8)) === 'ftyp';
  if (contentType === 'video/webm') return header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3;
  return false;
}
