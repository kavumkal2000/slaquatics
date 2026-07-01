import { activeCmsSiteAdapter } from '../../../../../lib/site-cms/active.ts';
import { toPublicCmsContent } from '../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../lib/cms/security-headers.ts';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await activeCmsSiteAdapter.loadContent(slug);
  const publicContent = content ? toPublicCmsContent(content) : null;
  if (!publicContent) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  return cmsJson({ content: publicContent });
}
