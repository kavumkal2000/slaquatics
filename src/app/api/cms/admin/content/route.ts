import { requireCmsMutationRequest, requireCmsPermission } from '../../../../../lib/cms/auth.ts';
import { getCmsStore } from '../../../../../lib/cms/storage.ts';
import { activeCmsSiteAdapter } from '../../../../../lib/site-cms/active.ts';
import { validateAndSanitizeCmsContent } from '../../../../../lib/cms/validation.ts';
import { applyCmsAccessForSave, userCanReadCmsContent, userCanWriteCmsContent, userCanWriteCmsContentType } from '../../../../../lib/cms/policy.ts';
import { cmsJson } from '../../../../../lib/cms/security-headers.ts';
import type { CmsContentStatus, CmsContentType } from '../../../../../lib/cms/core.ts';

const CMS_DB_BINDING = 'CMS_DB';

export async function GET(request: Request) {
  void CMS_DB_BINDING;
  const user = await requireCmsPermission(request, 'content.read');
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const store = await getCmsStore();
  const content = await store.listContent({
    contentType: url.searchParams.get('contentType') as CmsContentType || undefined,
    status: url.searchParams.get('status') as CmsContentStatus || undefined,
    query: url.searchParams.get('q') || undefined,
    limit: Number(url.searchParams.get('limit') || 100)
  });
  return cmsJson({ ok: true, content: content.filter((record) => userCanReadCmsContent(user, record)) });
}

export async function POST(request: Request) {
  void CMS_DB_BINDING;
  const mutationError = requireCmsMutationRequest(request, { requireHeader: true });
  if (mutationError) return mutationError;
  const user = await requireCmsPermission(request, 'content.write');
  if (user instanceof Response) return user;
  const body = await request.json().catch(() => ({}));
  const result = validateAndSanitizeCmsContent(body?.content, activeCmsSiteAdapter.siteConfig);
  if (!result.ok) return cmsJson({ error: result.error }, { status: 400 });
  const store = await getCmsStore();
  const existing = await store.getContentById(result.content.id);
  const permissionTarget = existing || result.content;
  if (!userCanWriteCmsContentType(user, result.content.contentType)) {
    return cmsJson({ error: 'CMS role cannot edit this content type.' }, { status: 403 });
  }
  if (!userCanWriteCmsContent(user, permissionTarget)) {
    return cmsJson({ error: 'CMS role cannot edit this content.' }, { status: 403 });
  }
  const draft = await store.saveDraft(applyCmsAccessForSave(user, result.content, existing), user.id);
  const previewToken = await store.createPreviewToken(draft.id, user.id);
  return cmsJson({ ok: true, content: draft, previewToken });
}
