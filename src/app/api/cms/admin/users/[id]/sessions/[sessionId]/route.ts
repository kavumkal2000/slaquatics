import { requireCmsMutationRequest, requireCmsPermission, revokeCmsUserSession } from '../../../../../../../../lib/cms/auth.ts';
import { cmsJson } from '../../../../../../../../lib/cms/security-headers.ts';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const actor = await requireCmsPermission(request, 'session.manage');
  if (actor instanceof Response) return actor;
  const { id, sessionId } = await params;
  const revoked = await revokeCmsUserSession(id, sessionId, actor, request);
  if (!revoked) return cmsJson({ error: 'CMS session was not found.' }, { status: 404 });
  return cmsJson({ ok: true });
}
