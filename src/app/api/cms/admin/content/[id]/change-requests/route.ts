import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { userCanReadCmsContent, userCanWriteCmsContent } from '../../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../lib/cms/storage.ts';

export function sanitizeReviewNote(value: unknown): string {
  const note = typeof value === 'string' ? value.trim().slice(0, 2000) : '';
  if (!note) return '';
  if (/<\/?\s*\w+|on\w+\s*=|javascript:|data:text\/html|https?:\/\/|www\./i.test(note)) return '';
  return note;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCmsPermission(request, 'content.read');
  if (user instanceof Response) return user;
  const { id } = await params;
  const store = await getCmsStore();
  const content = await store.getContentById(id);
  if (!content) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanReadCmsContent(user, content)) {
    return cmsJson({ error: 'CMS role cannot read this content.' }, { status: 403 });
  }
  const requests = await store.listChangeRequests(id);
  return cmsJson({ ok: true, requests });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'content.write');
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const blockId = typeof body?.blockId === 'string' ? body.blockId.trim().slice(0, 180) : '';
  const note = sanitizeReviewNote(body?.note);
  if (!blockId || !note) return cmsJson({ error: 'Unsafe CMS review request was rejected.' }, { status: 400 });
  const store = await getCmsStore();
  const content = await store.getContentById(id);
  if (!content) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanWriteCmsContent(user, content)) {
    return cmsJson({ error: 'CMS role cannot edit this content.' }, { status: 403 });
  }
  const requestRecord = await store.createChangeRequest({ contentId: id, blockId, note }, user.id);
  if (!requestRecord) return cmsJson({ error: 'Content block not found.' }, { status: 404 });
  return cmsJson({ ok: true, request: requestRecord });
}
