import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { userCanPublishCmsContent } from '../../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../lib/cms/storage.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'content.rollback');
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const revisionId = String(body?.revisionId || '');
  if (!revisionId) return cmsJson({ error: 'revisionId is required.' }, { status: 400 });
  const store = await getCmsStore();
  const existing = await store.getContentById(id);
  if (!existing) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanPublishCmsContent(user, existing)) {
    return cmsJson({ error: 'CMS role cannot rollback this content.' }, { status: 403 });
  }
  const content = await store.rollbackContent(id, revisionId, user.id);
  if (!content) return cmsJson({ error: 'Revision not found.' }, { status: 404 });
  return cmsJson({ ok: true, content });
}
