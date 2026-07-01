import type { CmsContent, CmsContentType } from '../lib/cms/core';
import { contentIsPublished } from '../lib/cms/core';
import { getCmsStore } from '../lib/cms/storage';
import { activeCmsSiteAdapter } from '../lib/site-cms/active';

function fallbackPublishedCmsContent(contentType: CmsContentType, limit: number): CmsContent[] {
  return activeCmsSiteAdapter.fallbackContent
    .filter((content) => content.contentType === contentType)
    .filter((content) => contentIsPublished(content))
    .slice(0, limit);
}

export async function listPublishedCmsContent(contentType: CmsContentType, limit = 50): Promise<CmsContent[]> {
  try {
    const store = await getCmsStore();
    const saved = await store.listContent({
      contentType,
      limit,
      publishedOnly: true
    });
    return saved.length ? saved : fallbackPublishedCmsContent(contentType, limit);
  } catch {
    return fallbackPublishedCmsContent(contentType, limit);
  }
}
