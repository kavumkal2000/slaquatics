import { CmsAdminShell } from '../../../features/cms/CmsAdminShell';
import { SlaquaticsCmsContentEditor } from '../../../features/siteCms/SlaquaticsCmsContentEditor';
import { getCmsPageProps } from '../cms-page-props';
import { requireCmsPageUser } from '../require-cms-page-user';

export default async function CmsContentPage() {
  await requireCmsPageUser();
  const props = await getCmsPageProps();
  return (
    <CmsAdminShell view="content" {...props}>
      <SlaquaticsCmsContentEditor
        pages={props.pages}
        blocks={props.blocks}
        siteConfig={props.siteConfig}
      />
    </CmsAdminShell>
  );
}
