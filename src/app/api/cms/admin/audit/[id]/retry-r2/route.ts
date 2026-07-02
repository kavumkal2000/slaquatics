import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { retryCmsAuditR2Write } from '../../../../../../../lib/cms/audit.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const actor = await requireCmsPermission(request, 'audit.retry');
  if (actor instanceof Response) return actor;
  const { id } = await params;
  const event = await retryCmsAuditR2Write(id, actor, request);
  if (!event) return cmsJson({ error: 'CMS audit event was not found.' }, { status: 404 });
  return cmsJson({ ok: true, event });
}
