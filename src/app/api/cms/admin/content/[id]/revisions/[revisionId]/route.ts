import { requireCmsPermission } from '../../../../../../../../lib/cms/auth.ts';
import { userCanReadCmsContent } from '../../../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../../lib/cms/storage.ts';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const user = await requireCmsPermission(request, 'revision.read');
  if (user instanceof Response) return user;
  const { id, revisionId } = await params;
  const store = await getCmsStore();
  const content = await store.getContentById(id);
  if (!content) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanReadCmsContent(user, content)) {
    return cmsJson({ error: 'CMS role cannot read this revision.' }, { status: 403 });
  }
  const revision = await store.getRevision(id, revisionId);
  if (!revision) return cmsJson({ error: 'Revision not found.' }, { status: 404 });
  return cmsJson({ ok: true, revision });
}
