import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CmsPublicDetail } from '../../../features/cms/CmsPublicContent';
import { activeCmsSiteAdapter } from '../../../lib/site-cms/active';

export const metadata: Metadata = {
  title: 'Blog | Shoreline Aquatics',
  robots: 'index, follow'
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await activeCmsSiteAdapter.loadContent(slug);
  if (!content || content.contentType !== 'blogPost') notFound();
  return <CmsPublicDetail content={content} siteConfig={activeCmsSiteAdapter.siteConfig} />;
}
