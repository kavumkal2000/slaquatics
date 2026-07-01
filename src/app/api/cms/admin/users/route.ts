import { createManagedCmsUser, listCmsUsers, requireCmsMutationRequest, requireCmsPermission } from '../../../../../lib/cms/auth.ts';
import { cmsJson } from '../../../../../lib/cms/security-headers.ts';
import type { CmsRole } from '../../../../../lib/cms/core.ts';

export async function GET(request: Request) {
  const user = await requireCmsPermission(request, 'users.manage');
  if (user instanceof Response) return user;
  const users = await listCmsUsers();
  return cmsJson({ ok: true, users });
}

export async function POST(request: Request) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const actor = await requireCmsPermission(request, 'users.manage');
  if (actor instanceof Response) return actor;
  const body = await request.json().catch(() => ({}));
  const created = await createManagedCmsUser({
    email: String(body?.email || ''),
    name: String(body?.name || ''),
    role: String(body?.role || 'client') as CmsRole,
    password: String(body?.password || '')
  }, actor, request);
  if (created instanceof Response) return created;
  return cmsJson({ ok: true, user: created });
}
