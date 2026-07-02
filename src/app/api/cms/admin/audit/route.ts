import { listCmsAuditEvents, recordCmsAudit } from '../../../../../lib/cms/audit.ts';
import { requireCmsPermission } from '../../../../../lib/cms/auth.ts';
import { cmsJson } from '../../../../../lib/cms/security-headers.ts';

export async function GET(request: Request) {
  const user = await requireCmsPermission(request, 'audit.read');
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const events = await listCmsAuditEvents({
    action: url.searchParams.get('action') || undefined,
    actorId: url.searchParams.get('actor') || undefined,
    targetId: url.searchParams.get('target') || undefined,
    targetType: url.searchParams.get('targetType') || undefined,
    status: status === 'attempted' || status === 'succeeded' || status === 'failed' || status === 'denied' ? status : undefined,
    slug: url.searchParams.get('slug') || undefined,
    from: url.searchParams.get('from') || undefined,
    to: url.searchParams.get('to') || undefined,
    limit: Number(url.searchParams.get('limit') || 100)
  });
  await recordCmsAudit({
    actorId: user.id,
    actorRole: user.role,
    action: 'audit.view',
    targetType: 'audit',
    targetId: 'cms_audit_log',
    request,
    metadata: { count: events.length }
  });
  return cmsJson({ ok: true, events });
}
