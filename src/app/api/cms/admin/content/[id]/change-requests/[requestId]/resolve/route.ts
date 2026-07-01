import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../../../lib/cms/auth.ts';
import { userCanPublishCmsContent } from '../../../../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../../../lib/cms/storage.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'content.publish');
  if (user instanceof Response) return user;
  const { id, requestId } = await params;
  const store = await getCmsStore();
  const content = await store.getContentById(id);
  if (!content) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanPublishCmsContent(user, content)) {
    return cmsJson({ error: 'CMS role cannot resolve requests for this content.' }, { status: 403 });
  }
  const requestRecord = await store.resolveChangeRequest(id, requestId, user.id);
  if (!requestRecord) return cmsJson({ error: 'Review request not found.' }, { status: 404 });
  return cmsJson({ ok: true, request: requestRecord });
}
