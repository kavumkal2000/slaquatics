import { listCmsUserSessions, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { recordCmsAudit } from '../../../../../../../lib/cms/audit.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireCmsPermission(request, 'session.manage');
  if (actor instanceof Response) return actor;
  const { id } = await params;
  const sessions = await listCmsUserSessions(id, request);
  await recordCmsAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'auth.sessionsViewed',
    targetType: 'user',
    targetId: id,
    request,
    metadata: { count: sessions.length }
  });
  return cmsJson({ ok: true, sessions });
}
