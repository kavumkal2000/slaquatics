import { CmsRenderer } from './CmsRenderer';
import type { CmsContent, CmsSiteConfig } from '../../lib/cms/core';

type CmsEditablePageSectionProps = {
  slug: string;
  content: CmsContent | null;
  siteConfig: CmsSiteConfig;
};

export function CmsEditablePageSection({ slug, content, siteConfig }: CmsEditablePageSectionProps) {
  if (!content) return null;

  return (
    <section className="cms-editable-page-section" data-cms-editable-page={slug}>
      <CmsRenderer content={content} siteConfig={siteConfig} />
    </section>
  );
}
