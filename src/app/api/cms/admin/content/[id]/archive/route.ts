import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { userCanPublishCmsContent, userCanPublishCmsContentType } from '../../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../lib/cms/storage.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'content.publish');
  if (user instanceof Response) return user;
  const { id } = await params;
  const store = await getCmsStore();
  const existing = await store.getContentById(id);
  if (!existing) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanPublishCmsContentType(user, existing.contentType)) {
    return cmsJson({ error: 'CMS role cannot archive this content type.' }, { status: 403 });
  }
  if (!userCanPublishCmsContent(user, existing)) {
    return cmsJson({ error: 'CMS role cannot archive this content.' }, { status: 403 });
  }
  const content = await store.archiveContent(id, user.id);
  if (!content) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  return cmsJson({ ok: true, content });
}
