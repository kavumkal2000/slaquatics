import { CmsEditablePageSection } from '../cms/CmsEditablePageSection';
import { cmsSlaquaticsSiteConfig, loadSlaquaticsCmsContent } from '../../lib/site-cms/slaquatics';

type SlaquaticsCmsEditablePageSectionProps = {
  slug: string;
};

export async function SlaquaticsCmsEditablePageSection({ slug }: SlaquaticsCmsEditablePageSectionProps) {
  return (
    <CmsEditablePageSection
      slug={slug}
      content={await loadSlaquaticsCmsContent(slug)}
      siteConfig={cmsSlaquaticsSiteConfig}
    />
  );
}
