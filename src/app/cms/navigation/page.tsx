import { CmsAdminShell } from '../../../features/cms/CmsAdminShell';
import { getCmsPageProps } from '../cms-page-props';
import { requireCmsPageUser } from '../require-cms-page-user';

export default async function CmsNavigationPage() {
  await requireCmsPageUser('content.write');
  return <CmsAdminShell view="navigation" {...await getCmsPageProps()} />;
}
