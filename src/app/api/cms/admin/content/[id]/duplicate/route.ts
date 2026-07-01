import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../../../lib/cms/auth.ts';
import { normalizeCmsSlug } from '../../../../../../../lib/cms/core.ts';
import { userCanWriteCmsContent, userCanWriteCmsContentType } from '../../../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../../../lib/cms/storage.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'content.write');
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const store = await getCmsStore();
  const existing = await store.getContentById(id);
  if (!existing) return cmsJson({ error: 'Content not found.' }, { status: 404 });
  if (!userCanWriteCmsContentType(user, existing.contentType)) {
    return cmsJson({ error: 'CMS role cannot duplicate this content type.' }, { status: 403 });
  }
  if (!userCanWriteCmsContent(user, existing)) {
    return cmsJson({ error: 'CMS role cannot duplicate this content.' }, { status: 403 });
  }
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 240) : undefined;
  const slug = typeof body?.slug === 'string' ? normalizeCmsSlug(body.slug) : undefined;
  const content = await store.duplicateContent(id, { title, slug }, user.id);
  if (!content) return cmsJson({ error: 'Content could not be duplicated. Check that the new slug is unique.' }, { status: 409 });
  const previewToken = await store.createPreviewToken(content.id, user.id);
  return cmsJson({ ok: true, content, previewToken });
}
