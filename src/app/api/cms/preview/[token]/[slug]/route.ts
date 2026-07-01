import { getCmsStore } from '../../../../../../lib/cms/storage.ts';
import { requireCmsPermission } from '../../../../../../lib/cms/auth.ts';
import { cmsJson } from '../../../../../../lib/cms/security-headers.ts';

export async function GET(request: Request, { params }: { params: Promise<{ token: string; slug: string }> }) {
  const user = await requireCmsPermission(request, 'content.read');
  if (user instanceof Response) return user;
  const { token, slug } = await params;
  const store = await getCmsStore();
  const content = await store.getPreviewContent(token, slug, user);
  if (!content) return cmsJson({ error: 'Preview not found.' }, { status: 404 });
  return cmsJson({ content });
}
