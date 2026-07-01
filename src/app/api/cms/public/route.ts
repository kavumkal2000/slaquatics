import type { CmsContentType } from '../../../../lib/cms/core.ts';
import { cmsContentTypeIsPublic, toPublicCmsContent } from '../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../lib/cms/storage.ts';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedType = url.searchParams.get('contentType') as CmsContentType | null;
  const contentType = requestedType && cmsContentTypeIsPublic(requestedType) ? requestedType : undefined;
  const limit = Number(url.searchParams.get('limit') || 50);
  try {
    const store = await getCmsStore();
    const content = await store.listContent({
      contentType,
      query: url.searchParams.get('q') || undefined,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50,
      publishedOnly: true
    });
    return cmsJson({ ok: true, content: content.map(toPublicCmsContent).filter(Boolean) });
  } catch {
    return cmsJson({ ok: true, content: [] });
  }
}
