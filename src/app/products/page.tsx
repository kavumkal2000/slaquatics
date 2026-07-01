import type { Metadata } from 'next';
import { CmsPublicArchive } from '../../features/cms/CmsPublicContent';
import { activeCmsSiteAdapter } from '../../lib/site-cms/active';
import { listPublishedCmsContent } from '../cms-public-content';

export const metadata: Metadata = {
  title: 'Products | Shoreline Aquatics',
  description: 'Published Shoreline Aquatics product and service lists.',
  alternates: { canonical: 'https://slaquatics.com/products/' }
};

export default async function ProductsPage() {
  const content = await listPublishedCmsContent('productList');
  return (
    <CmsPublicArchive
      content={content}
      emptyMessage="No published product lists yet."
      heading="Products"
      hrefPrefix="/products"
      siteConfig={activeCmsSiteAdapter.siteConfig}
    />
  );
}
