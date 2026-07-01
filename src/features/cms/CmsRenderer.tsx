import type { CmsBlock, CmsContent, CmsSiteConfig } from '../../lib/cms/core.ts';
import { visibleCmsBlocks } from '../../lib/cms/core.ts';
import { safeCmsUrl } from '../../lib/cms/validation.ts';

type RendererProps = {
  content: CmsContent;
  siteConfig: CmsSiteConfig;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string) => void;
};

function blockProps<T extends Record<string, unknown>>(block: CmsBlock): T {
  return block.props as T;
}

function renderButton(button: Record<string, unknown>, index: number) {
  const label = String(button.label || 'Open');
  const href = safeCmsUrl(button.href) || '#';
  const variant = String(button.variant || 'primary');
  const image = safeCmsUrl(button.image);
  return (
    <a className={`cms-renderer-button cms-renderer-button-${variant}`} href={href} key={`${label}-${index}`}>
      {image ? <img src={image} alt="" aria-hidden="true" /> : null}
      <span>{label}</span>
    </a>
  );
}

function CmsBlockView({ block, siteConfig }: { block: CmsBlock; siteConfig: CmsSiteConfig }) {
  if (block.type === 'topbar') {
    const props = blockProps<{ logo?: { src?: string; alt?: string }; links?: Record<string, unknown>[]; buttons?: Record<string, unknown>[] }>(block);
    return (
      <nav className="cms-renderer-block cms-renderer-topbar" aria-label={`${siteConfig.siteId} preview navigation`}>
        <div className="cms-renderer-logo">
          {safeCmsUrl(props.logo?.src) ? <img src={safeCmsUrl(props.logo?.src)} alt={props.logo?.alt || ''} /> : <span>{siteConfig.siteId}</span>}
        </div>
        <div className="cms-renderer-links">
          {(props.links || []).map((link, index) => (
            <a href={safeCmsUrl(link.href) || '#'} key={`${String(link.label || 'Link')}-${index}`}>{String(link.label || 'Link')}</a>
          ))}
        </div>
        {props.buttons?.length ? <div className="cms-renderer-actions">{props.buttons.map(renderButton)}</div> : null}
      </nav>
    );
  }

  if (block.type === 'hero') {
    const props = blockProps<{ eyebrow?: string; heading?: string; copy?: string; buttons?: Record<string, unknown>[]; media?: { src?: string; alt?: string } }>(block);
    return (
      <section className="cms-renderer-block cms-renderer-hero">
        {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
        {props.heading ? <h1>{props.heading}</h1> : null}
        {props.copy ? <p>{props.copy}</p> : null}
        {props.buttons?.length ? <div className="cms-renderer-actions">{props.buttons.map(renderButton)}</div> : null}
        {safeCmsUrl(props.media?.src) ? <img src={safeCmsUrl(props.media?.src)} alt={props.media?.alt || ''} /> : null}
      </section>
    );
  }

  if (block.type === 'rich-text' || block.type === 'heading' || block.type === 'list' || block.type === 'quote' || block.type === 'table' || block.type === 'columns') {
    const props = blockProps<{ eyebrow?: string; heading?: string; subheading?: string; body?: string; quote?: string; attribution?: string; items?: Record<string, unknown>[] }>(block);
    return (
      <section className="cms-renderer-block">
        {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.subheading ? <p>{props.subheading}</p> : null}
        {props.body ? <p>{props.body}</p> : null}
        {props.quote ? <blockquote>{props.quote}{props.attribution ? <footer>{props.attribution}</footer> : null}</blockquote> : null}
        {Array.isArray(props.items) ? <ul>{props.items.map((item, index) => <li key={String(item.title || item.label || index)}>{String(item.title || item.label || item.copy || '')}</li>)}</ul> : null}
      </section>
    );
  }

  if (block.type === 'button-group') {
    const props = blockProps<{ buttons?: Record<string, unknown>[] }>(block);
    return <div className="cms-renderer-actions">{(props.buttons || []).map(renderButton)}</div>;
  }

  if (block.type === 'image') {
    const props = blockProps<{ src?: string; alt?: string; caption?: string }>(block);
    return (
      <figure className="cms-renderer-block">
        {safeCmsUrl(props.src) ? <img src={safeCmsUrl(props.src)} alt={props.alt || ''} /> : null}
        {props.caption ? <figcaption>{props.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.type === 'video') {
    const props = blockProps<{ src?: string; poster?: string; caption?: string }>(block);
    return (
      <figure className="cms-renderer-block">
        {safeCmsUrl(props.src) ? (
          <video controls poster={safeCmsUrl(props.poster) || undefined}>
            <source src={safeCmsUrl(props.src)} />
          </video>
        ) : null}
        {props.caption ? <figcaption>{props.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.type === 'break') {
    const props = blockProps<{ spacing?: string; style?: string }>(block);
    return <div className={`cms-renderer-break cms-renderer-break-${String(props.style || 'line')}`} data-spacing={String(props.spacing || 'medium')} />;
  }

  if (block.type === 'carousel' || block.type === 'gallery' || block.type === 'embed') {
    const props = blockProps<{ images?: { src: string; alt?: string }[] }>(block);
    return (
      <div className="cms-renderer-block cms-renderer-carousel">
        {(props.images || []).map((image) => {
          const src = safeCmsUrl(image.src);
          return src ? <img src={src} alt={image.alt || ''} key={src} /> : null;
        })}
      </div>
    );
  }

  if (block.type === 'service-list' || block.type === 'product-list' || block.type === 'card-grid' || block.type === 'rental-product-cards' || block.type === 'rental-offering-list' || block.type === 'add-ons' || block.type === 'addon-list' || block.type === 'safety-requirements' || block.type === 'reviews-social' || block.type === 'review-carousel' || block.type === 'policy-list') {
    const props = blockProps<{ eyebrow?: string; heading?: string; copy?: string; items?: Record<string, unknown>[] }>(block);
    return (
      <section className="cms-renderer-block">
        {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.copy ? <p className="section-sub">{props.copy}</p> : null}
        <div className="cms-renderer-grid">
          {(props.items || []).map((item, index) => (
            <article className="cms-renderer-card" key={String(item.id || item.title || index)}>
              {Array.isArray(item.images) && item.images.length ? (
                <div className="cms-renderer-card-media">
                  {(item.images as { src: string; alt?: string }[]).map((image) => {
                    const src = safeCmsUrl(image.src);
                    return src ? <img src={src} alt={image.alt || ''} key={src} /> : null;
                  })}
                </div>
              ) : null}
              {item.badge ? <div className="cms-renderer-badge">{String(item.badge)}</div> : null}
              {item.title ? <h3>{String(item.title)}</h3> : null}
              {item.price ? <div className="cms-renderer-price">{String(item.price)}</div> : null}
              {item.copy ? <p>{String(item.copy)}</p> : null}
              {Array.isArray(item.perks) ? (
                <div className="cms-renderer-tags">{(item.perks as string[]).map((perk) => <span key={perk}>{perk}</span>)}</div>
              ) : null}
              {Array.isArray(item.buttons) ? <div className="cms-renderer-actions">{(item.buttons as Record<string, unknown>[]).map(renderButton)}</div> : null}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === 'faq') {
    const props = blockProps<{ heading?: string; items?: { question: string; answer: string }[] }>(block);
    return (
      <section className="cms-renderer-block">
        {props.heading ? <h2>{props.heading}</h2> : null}
        {(props.items || []).map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    );
  }

  if (block.type === 'cta-band') {
    const props = blockProps<{ heading?: string; copy?: string; buttons?: Record<string, unknown>[] }>(block);
    return (
      <section className="cms-renderer-block cms-renderer-cta">
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.copy ? <p>{props.copy}</p> : null}
        {props.buttons?.length ? <div className="cms-renderer-actions">{props.buttons.map(renderButton)}</div> : null}
      </section>
    );
  }

  if (block.type === 'booking-entry' || block.type === 'booking-package-selector' || block.type === 'availability-checker' || block.type === 'availability-waiver-payment-cta') {
    const props = blockProps<{ heading?: string; copy?: string; helpText?: string; buttons?: Record<string, unknown>[]; bookingHref?: string }>(block);
    const buttons = props.buttons?.length ? props.buttons : [{ label: 'Book Now', href: props.bookingHref || '#', variant: 'primary' }];
    return (
      <section className="cms-renderer-block">
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.copy ? <p>{props.copy}</p> : null}
        {props.helpText ? <p>{props.helpText}</p> : null}
        <div className="cms-renderer-actions">{buttons.map(renderButton)}</div>
      </section>
    );
  }

  if (block.type === 'navigation-menu') {
    const props = blockProps<{ menuItems?: Record<string, unknown>[] }>(block);
    return (
      <nav className="cms-renderer-block cms-renderer-topbar">
        <div className="cms-renderer-links">
          {(props.menuItems || []).map((item, index) => <a href={safeCmsUrl(item.href) || '#'} key={`${String(item.label || 'Menu')}-${index}`}>{String(item.label || 'Menu')}</a>)}
        </div>
      </nav>
    );
  }

  if (block.type === 'location-directions') {
    const props = blockProps<{ heading?: string; address?: string; directions?: string[]; mapsUrl?: string }>(block);
    return (
      <section className="cms-renderer-block">
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.address ? <p>{props.address}</p> : null}
        {props.mapsUrl ? <a href={safeCmsUrl(props.mapsUrl) || '#'}>Open in Maps</a> : null}
        {props.directions?.length ? <ol>{props.directions.map((step) => <li key={step}>{step}</li>)}</ol> : null}
      </section>
    );
  }

  if (block.type === 'stripe-product-list' || block.type === 'stripe-catalog-display') {
    const props = blockProps<{ heading?: string; copy?: string; products?: Record<string, unknown>[] }>(block);
    return (
      <section className="cms-renderer-block">
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.copy ? <p>{props.copy}</p> : null}
        <div className="cms-renderer-grid">
          {(props.products || []).map((product, index) => (
            <article className="cms-renderer-card" key={String(product.productKey || product.stripeProductId || index)}>
              <h3>{String(product.displayName || product.label || product.productKey || 'Product')}</h3>
              {product.displayPrice ? <div className="cms-renderer-price">{String(product.displayPrice)}</div> : null}
              {product.stripeProductId || product.stripePriceId || product.stripeLookupKey ? <p>Stripe mapping configured</p> : null}
            </article>
          ))}
        </div>
      </section>
    );
  }

  return <section className="cms-renderer-block" data-block-type={block.type}>{block.label || block.type}</section>;
}

export function CmsRenderer({ content, siteConfig, selectedBlockId, onSelectBlock }: RendererProps) {
  return (
    <div className="cms-renderer" data-site-id={siteConfig.siteId}>
      {visibleCmsBlocks(content.blocks).map((block) => {
        const selectable = Boolean(onSelectBlock);
        return (
          <div
            className={`cms-renderer-selectable${selectedBlockId === block.id ? ' cms-renderer-selectable-active' : ''}`}
            data-cms-preview-block-id={block.id}
            key={block.id}
            role={selectable ? 'button' : undefined}
            tabIndex={selectable ? 0 : undefined}
            onClick={selectable ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelectBlock?.(block.id);
            } : undefined}
            onKeyDown={selectable ? (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onSelectBlock?.(block.id);
            } : undefined}
          >
            <CmsBlockView block={block} siteConfig={siteConfig} />
          </div>
        );
      })}
    </div>
  );
}
