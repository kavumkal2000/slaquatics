import { activeCmsSiteAdapter } from '../../lib/site-cms/active';
import { getCmsStore } from '../../lib/cms/storage';

async function loadCmsEditorPages() {
  const fallbackPages = activeCmsSiteAdapter.fallbackContent.map((content) => ({ slug: content.slug, title: content.title, content }));
  try {
    const store = await getCmsStore();
    const savedContent = await store.listContent({ limit: 200 });
    const bySlug = new Map(fallbackPages.map((page) => [page.slug, page]));
    for (const content of savedContent) {
      bySlug.set(content.slug, { slug: content.slug, title: content.title, content });
    }
    return Array.from(bySlug.values()).sort((left, right) => left.slug.localeCompare(right.slug));
  } catch {
    return fallbackPages;
  }
}

export async function getCmsPageProps() {
  return {
    pages: await loadCmsEditorPages(),
    blockLabels: activeCmsSiteAdapter.siteConfig.blocks.map((block) => block.label),
    blocks: activeCmsSiteAdapter.siteConfig.blocks,
    siteConfig: activeCmsSiteAdapter.siteConfig
  };
}
