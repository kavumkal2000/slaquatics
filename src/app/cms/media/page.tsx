import { CmsAdminShell } from '../../../features/cms/CmsAdminShell';
import { getCmsPageProps } from '../cms-page-props';
import { requireCmsPageUser } from '../require-cms-page-user';

export default async function CmsMediaPage() {
  await requireCmsPageUser();
  return <CmsAdminShell view="media" {...await getCmsPageProps()} />;
}
