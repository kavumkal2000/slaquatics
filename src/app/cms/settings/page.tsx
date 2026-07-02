import { CmsAdminShell } from '../../../features/cms/CmsAdminShell';
import { getCmsPageProps } from '../cms-page-props';
import { requireCmsPageUser } from '../require-cms-page-user';

export default async function CmsSettingsPage() {
  await requireCmsPageUser('content.publish');
  return <CmsAdminShell view="settings" {...await getCmsPageProps()} />;
}
