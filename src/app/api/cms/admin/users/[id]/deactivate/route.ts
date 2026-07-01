import { deactivateCmsUser, requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const actor = await requireCmsPermission(request, 'users.manage');
  if (actor instanceof Response) return actor;
  const { id } = await params;
  if (id === actor.id) return cmsJson({ error: 'Cannot deactivate your own CMS account.' }, { status: 400 });
  const deactivated = await deactivateCmsUser(id, actor, request);
  if (deactivated instanceof Response) return deactivated;
  return cmsJson({ ok: true, user: deactivated });
}
