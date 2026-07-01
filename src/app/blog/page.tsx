import type { Metadata } from 'next';
import { CmsPublicArchive } from '../../features/cms/CmsPublicContent';
import { activeCmsSiteAdapter } from '../../lib/site-cms/active';
import { listPublishedCmsContent } from '../cms-public-content';

export const metadata: Metadata = {
  title: 'Blog | Shoreline Aquatics',
  description: 'Published Shoreline Aquatics blog updates.',
  alternates: { canonical: 'https://slaquatics.com/blog/' }
};

export default async function BlogPage() {
  const content = await listPublishedCmsContent('blogPost');
  return (
    <CmsPublicArchive
      content={content}
      emptyMessage="No published blog posts yet."
      heading="Blog"
      hrefPrefix="/blog"
      siteConfig={activeCmsSiteAdapter.siteConfig}
    />
  );
}
