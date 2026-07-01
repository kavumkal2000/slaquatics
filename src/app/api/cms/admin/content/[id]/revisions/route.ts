import { requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { userCanReadCmsContent } from '../../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../lib/cms/storage.ts';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCmsPermission(request, 'revision.read');
  if (user instanceof Response) return user;
  const { id } = await params;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || 20);
  const store = await getCmsStore();
  const content = await store.getContentById(id);
  if (!content) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanReadCmsContent(user, content)) {
    return cmsJson({ error: 'CMS role cannot read revisions for this content.' }, { status: 403 });
  }
  const revisions = await store.listRevisions(id, Number.isFinite(limit) ? limit : 20);
  return cmsJson({ ok: true, revisions });
}
