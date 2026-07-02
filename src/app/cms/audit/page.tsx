import { CmsAdminShell } from '../../../features/cms/CmsAdminShell';
import { getCmsPageProps } from '../cms-page-props';
import { requireCmsPageUser } from '../require-cms-page-user';

export default async function CmsAuditPage() {
  await requireCmsPageUser('audit.read');
  return <CmsAdminShell view="audit" {...await getCmsPageProps()} />;
}
