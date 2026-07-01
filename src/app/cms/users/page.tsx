import { CmsAdminShell } from '../../../features/cms/CmsAdminShell';
import { getCmsPageProps } from '../cms-page-props';
import { requireCmsPageUser } from '../require-cms-page-user';

export default async function CmsUsersPage() {
  await requireCmsPageUser('users.manage');
  return <CmsAdminShell view="users" {...await getCmsPageProps()} />;
}
