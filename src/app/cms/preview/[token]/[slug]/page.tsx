import { SlaquaticsCmsPublicRenderer } from '../../../../../features/siteCms/SlaquaticsCmsPublicRenderer';
import { getCmsStore } from '../../../../../lib/cms/storage.ts';
import { activeCmsSiteAdapter } from '../../../../../lib/site-cms/active';
import { requireCmsPageUser } from '../../../require-cms-page-user';

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function CmsPreviewPage({ params }: { params: Promise<{ token: string; slug: string }> }) {
  const user = await requireCmsPageUser();
  const { token, slug } = await params;
  const content = await loadPreviewContent(token, slug, user);
  if (!content) {
    return (
      <main className="cms-preview-page">
        <p>Preview not found.</p>
      </main>
    );
  }
  return (
    <main className="cms-preview-page">
      <SlaquaticsCmsPublicRenderer content={content} />
    </main>
  );
}

async function loadPreviewContent(token: string, slug: string, user: Awaited<ReturnType<typeof requireCmsPageUser>>) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return activeCmsSiteAdapter.getFallbackContent(slug);
  }
  try {
    const store = await getCmsStore();
    return await store.getPreviewContent(token, slug, user);
  } catch {
    return null;
  }
}
