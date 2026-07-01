import type { CmsContent, CmsSiteConfig } from '../../lib/cms/core';
import { CmsRenderer } from './CmsRenderer';

type CmsPublicArchiveProps = {
  content: CmsContent[];
  emptyMessage: string;
  heading: string;
  hrefPrefix: string;
  siteConfig: CmsSiteConfig;
};

export function CmsPublicArchive({ content, emptyMessage, heading, hrefPrefix, siteConfig }: CmsPublicArchiveProps) {
  return (
    <main className="cms-public-page">
      <section className="cms-public-archive" data-cms-public-site={siteConfig.siteId}>
        <div className="cms-public-header">
          <h1>{heading}</h1>
        </div>
        {content.length ? (
          <div className="cms-public-grid">
            {content.map((item) => (
              <article className="cms-public-card" key={item.id}>
                {item.metadata?.featuredImage ? <img src={item.metadata.featuredImage} alt="" aria-hidden="true" /> : null}
                <div>
                  <div className="cms-kicker">{contentTypeLabel(item.contentType)}</div>
                  <h2><a href={`${hrefPrefix}/${item.slug}`}>{item.title}</a></h2>
                  {item.metadata?.excerpt ? <p>{item.metadata.excerpt}</p> : null}
                  {item.taxonomies?.categories?.length ? (
                    <div className="cms-public-tags">
                      {item.taxonomies.categories.map((category) => <span key={category}>{category}</span>)}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="cms-editor-note">{emptyMessage}</p>
        )}
      </section>
    </main>
  );
}

export function CmsPublicDetail({ content, siteConfig }: { content: CmsContent; siteConfig: CmsSiteConfig }) {
  return (
    <main className="cms-public-page">
      <article className="cms-public-detail" data-cms-public-site={siteConfig.siteId}>
        <header className="cms-public-header">
          <div className="cms-kicker">{contentTypeLabel(content.contentType)}</div>
          <h1>{content.title}</h1>
          {content.metadata?.excerpt ? <p>{content.metadata.excerpt}</p> : null}
        </header>
        <CmsRenderer content={content} siteConfig={siteConfig} />
      </article>
    </main>
  );
}

function contentTypeLabel(contentType: CmsContent['contentType']) {
  if (contentType === 'blogPost') return 'Blog';
  if (contentType === 'productList') return 'Product List';
  return contentType.replace(/([a-z])([A-Z])/g, '$1 $2');
}
