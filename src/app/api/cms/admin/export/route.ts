import { requireCmsPermission } from '../../../../../lib/cms/auth.ts';
import type { CmsContent, CmsMediaAsset } from '../../../../../lib/cms/core.ts';
import { cmsJson } from '../../../../../lib/cms/security-headers.ts';
import { getCmsStore } from '../../../../../lib/cms/storage.ts';
import { activeCmsSiteAdapter } from '../../../../../lib/site-cms/active.ts';

type CmsExportManifestInput = {
  siteId: string;
  exportedAt: string;
  content: CmsContent[];
  media: CmsMediaAsset[];
};

export type CmsExportManifest = CmsExportManifestInput & {
  kind: 'embedded-cms-export';
  schemaVersion: 1;
};

export function buildCmsExportManifest(input: CmsExportManifestInput): CmsExportManifest {
  return {
    kind: 'embedded-cms-export',
    schemaVersion: 1,
    siteId: input.siteId,
    exportedAt: input.exportedAt,
    content: input.content,
    media: input.media
  };
}

export async function GET(request: Request) {
  const user = await requireCmsPermission(request, 'site.export');
  if (user instanceof Response) return user;
  const store = await getCmsStore();
  const content = await store.listContent({ limit: 1000 });
  const media = await store.listMediaAssets(1000);
  return cmsJson(buildCmsExportManifest({
    siteId: activeCmsSiteAdapter.siteConfig.siteId,
    exportedAt: new Date().toISOString(),
    content,
    media
  }));
}
