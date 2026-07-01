'use client';

import type { CSSProperties } from 'react';
import type { CmsBlock, CmsContent } from '../../lib/cms/core.ts';
import { visibleCmsBlocks } from '../../lib/cms/core.ts';
import { safeCmsEmbedUrl, safeCmsUrl } from '../../lib/cms/validation.ts';

const slaquaticsCmsSiteId = 'slaquatics';
const allowedStyleTokenNames = ['gold', 'blue', 'green', 'ink'] as const;
const styleTokenCssVariables: Record<typeof allowedStyleTokenNames[number], string> = {
  gold: '--gold',
  blue: '--blue',
  green: '--green',
  ink: '--ink'
};

type BlockFilter = {
  includeIds?: string[];
  excludeIds?: string[];
  includeTypes?: string[];
  excludeTypes?: string[];
};

type Button = {
  id?: string;
  label?: string;
  href?: string;
  variant?: string;
  image?: string;
};

type ImageItem = {
  src?: string;
  alt?: string;
};

type InfoItem = {
  label?: string;
  value?: string;
  href?: string;
};

type SlaquaticsCmsEditorPreviewProps = {
  content: CmsContent | null;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string) => void;
};

function blockProps<T extends Record<string, unknown>>(block: CmsBlock): T {
  return block.props as T;
}

function filterBlocks(content: CmsContent | null, filter: BlockFilter): CmsBlock[] {
  const blocks = visibleCmsBlocks(content?.blocks || []);
  return blocks.filter((block) => {
    if (filter.includeIds?.length && !filter.includeIds.includes(block.id)) return false;
    if (filter.excludeIds?.length && filter.excludeIds.includes(block.id)) return false;
    if (filter.includeTypes?.length && !filter.includeTypes.includes(block.type)) return false;
    if (filter.excludeTypes?.length && filter.excludeTypes.includes(block.type)) return false;
    return true;
  });
}

function styleFromTokens(blocks: CmsBlock[]): CSSProperties {
  const styleBlock = blocks.find((block) => block.type === 'style-tokens');
  const tokens = styleBlock?.props?.styleTokens;
  if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) return {};
  const input = tokens as Record<string, unknown>;
  const style: Record<string, string> = {};
  for (const token of allowedStyleTokenNames) {
    const color = safeColor(input[token]);
    if (color) style[styleTokenCssVariables[token]] = color;
  }
  return style as CSSProperties;
}

function safeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const color = value.trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) || /^rgb(a)?\([\d\s,%.]+\)$/i.test(color) ? color : undefined;
}

function buttonClass(variant = 'primary') {
  if (variant === 'secondary' || variant === 'ghost') return 'btn btn-ghost';
  if (variant === 'link') return 'btn btn-ghost';
  return 'btn btn-primary';
}

function renderButton(button: Button, index: number) {
  const label = button.label || 'Open';
  const href = safeCmsUrl(button.href) || '#';
  const image = safeCmsUrl(button.image);
  return (
    <a
      id={button.id}
      className={buttonClass(button.variant)}
      href={href}
      key={`${label}-${index}`}
    >
      {image ? <img src={image} alt="" aria-hidden="true" /> : null}
      <span>{label}</span>
    </a>
  );
}

function renderTopbar(block: CmsBlock) {
  const props = blockProps<{ layout?: string; title?: string; logo?: ImageItem; links?: Button[]; buttons?: Button[] }>(block);
  if (props.layout === 'mobile-nav') {
    return (
      <aside className="mobile-nav" id="mobile-nav" aria-hidden="true" data-cms-block-id={block.id}>
        <div className="mobile-nav-head">
          <div className="mobile-nav-title">{props.title || 'Menu'}</div>
          <button className="mobile-nav-close" id="mobile-menu-close" type="button" aria-label="Close menu">×</button>
        </div>
        <ul className="mobile-nav-links">
          {(props.links || []).map((link) => <li key={link.label}><a href={safeCmsUrl(link.href) || '#'}>{link.label}</a></li>)}
        </ul>
        <div className="mobile-nav-actions">
          {(props.buttons || []).map((button, index) => (
            <a href={safeCmsUrl(button.href) || '#'} className={button.variant === 'secondary' ? 'btn-ghost' : 'btn-primary'} key={`${button.label}-${index}`}>{button.label}</a>
          ))}
        </div>
      </aside>
    );
  }
  if (props.layout === 'home-nav') {
    return (
      <nav data-cms-block-id={block.id}>
        <div className="nav-logo">
          {safeCmsUrl(props.logo?.src) ? <img loading="lazy" decoding="async" src={safeCmsUrl(props.logo?.src)} alt={props.logo?.alt || 'Shoreline Aquatics'} /> : null}
        </div>
        <ul>
          {(props.links || []).map((link) => <li key={link.label}><a href={safeCmsUrl(link.href) || '#'}>{link.label}</a></li>)}
        </ul>
        <div className="nav-right">
          {(props.buttons || []).map((button, index) => (
            <a
              href={safeCmsUrl(button.href) || '#'}
              className={button.variant === 'link' ? 'nav-phone' : button.variant === 'secondary' ? 'btn-ghost' : 'btn-primary'}
              key={`${button.label}-${index}`}
            >
              {button.label}
            </a>
          ))}
        </div>
        <button className="nav-menu-btn" id="mobile-menu-open" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
          <span />
          <span />
          <span />
        </button>
      </nav>
    );
  }
  const actions = [...(props.links || []), ...(props.buttons || [])];
  return (
    <div className="topbar" data-cms-block-id={block.id}>
      <a className="brand" href="../">
        {safeCmsUrl(props.logo?.src) ? (
          <div className="brand-logo">
            <img src={safeCmsUrl(props.logo?.src)} alt={props.logo?.alt || 'Shoreline Aquatics'} />
          </div>
        ) : (
          <div className="brand-mark">SA</div>
        )}
      </a>
      <div className="top-actions">
        {actions.map(renderButton)}
      </div>
    </div>
  );
}

function renderHero(block: CmsBlock) {
  const props = blockProps<{
    layout?: string;
    eyebrow?: string;
    heading?: string;
    accent?: string;
    copy?: string;
    buttons?: Button[];
    badges?: string[];
    contactLinks?: Button[];
    infoItems?: InfoItem[];
    media?: ImageItem & { videoSrc?: string; poster?: string; moduleSrc?: string; moduleAlt?: string };
    status?: string;
    summary?: { kicker?: string; title?: string; note?: string };
  }>(block);
  if (props.layout === 'home-hero') {
    return (
      <div className="hero" data-cms-block-id={block.id}>
        {props.media?.videoSrc ? (
          <div className="hero-video-wrap" id="hero-video-wrap">
            <video id="hero-video" autoPlay muted loop playsInline preload="auto" poster={safeCmsUrl(props.media.poster) || undefined}>
              <source src={safeCmsUrl(props.media.videoSrc)} type="video/mp4" />
            </video>
            <button className="hero-video-play" id="hero-video-play" type="button">Tap To Play Video</button>
          </div>
        ) : null}
        <div className="hero-inner">
          <div className="hero-copy-panel">
            {props.eyebrow ? <div className="eyebrow">{props.eyebrow}</div> : null}
            {props.heading ? <h1>{formatHomeHeroHeading(props.heading)}</h1> : null}
            {props.copy ? <p className="hero-sub">{props.copy}</p> : null}
            {props.buttons?.length ? <div className="hero-actions">{props.buttons.map((button, index) => (
              <a href={safeCmsUrl(button.href) || '#'} className={button.variant === 'secondary' ? 'btn-ghost' : 'btn-primary'} key={`${button.label}-${index}`}>{button.label}</a>
            ))}</div> : null}
            {props.infoItems?.length ? (
              <div className="hero-info-bar">
                {props.infoItems.map((item) => (
                  <div className="hero-info-item" key={item.label}>
                    <div>
                      <div className="hero-info-label">{item.label}</div>
                      <div className="hero-info-value">
                        {item.href ? <a href={safeCmsUrl(item.href) || '#'} style={{ color: 'var(--gold)', textDecoration: 'none' }}>{item.value}</a> : item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {props.media?.moduleSrc ? (
            <div className="hero-media-module" aria-label={props.media.moduleAlt || 'Shoreline Aquatics lake day media'}>
              <img src={safeCmsUrl(props.media.moduleSrc)} alt={props.media.moduleAlt || ''} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  const hasVideo = Boolean(props.media?.videoSrc);
  const showGenericMedia = Boolean(props.media?.src && props.layout === 'media-hero');
  return (
    <div className="hero" data-cms-block-id={block.id}>
      <div className="hero-card hero-spotlight">
        <div>
          {props.eyebrow ? <div className="eyebrow">{props.eyebrow}</div> : null}
          {props.heading ? (
            <h1>{props.heading}{props.accent ? <span> {props.accent}</span> : null}</h1>
          ) : null}
          {props.copy ? <p className="hero-copy">{props.copy}</p> : null}
          {props.status ? <div className="status" id="payment-status">{props.status}</div> : null}
          {props.badges?.length ? (
            <div className="hero-badge-row">
              {props.badges.map((badge) => <span className="trust-badge wave" key={badge}>{badge}</span>)}
            </div>
          ) : null}
          {props.buttons?.length ? <div className="hero-action-row">{props.buttons.map(renderButton)}</div> : null}
          {props.contactLinks?.length ? (
            <div className="contact-strip">
              {props.contactLinks.map((link, index) => link.href ? (
                <a className="contact-pill" href={safeCmsUrl(link.href) || '#'} key={`${link.label}-${index}`}>{link.label}</a>
              ) : (
                <span className="contact-pill" key={`${link.label}-${index}`}>{link.label}</span>
              ))}
            </div>
          ) : null}
        </div>
        {hasVideo || showGenericMedia || props.summary ? (
          <div className={hasVideo ? 'hero-video-panel' : 'hero-media-module'}>
            {hasVideo ? (
              <div className="hero-video-shell" id="hero-video-wrap">
                <video id="hero-video" autoPlay muted loop playsInline preload="auto" poster={safeCmsUrl(props.media?.poster || props.media?.src) || undefined}>
                  <source src={safeCmsUrl(props.media?.videoSrc)} type="video/mp4" />
                </video>
                <button className="hero-video-play" id="hero-video-play" type="button">Tap to play video</button>
              </div>
            ) : showGenericMedia && props.media?.src ? (
              <img src={safeCmsUrl(props.media.src)} alt={props.media.alt || ''} />
            ) : null}
            {props.summary ? (
              <div className="summary-card" id="live-reviews-card">
                {props.summary.kicker ? <div className="summary-kicker">{props.summary.kicker}</div> : null}
                {props.summary.title ? <div className="summary-title">{props.summary.title}</div> : null}
                {props.summary.note ? <div className="summary-note">{props.summary.note}</div> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatHomeHeroHeading(heading: string) {
  const [first, ...rest] = heading.split(' Open ');
  if (!rest.length) return heading;
  return <>{first} <em>Open</em><br />{rest.join(' Open ')}</>;
}

function renderRichText(block: CmsBlock) {
  const props = blockProps<{
    layout?: string;
    eyebrow?: string;
    heading?: string;
    body?: string;
    note?: string;
    noteHeading?: string;
    highlight?: string;
    safetyHeading?: string;
    items?: string[];
    address?: string;
    addressLines?: string[];
    mapsUrl?: string;
    mapEmbedUrl?: string;
    buttons?: Button[];
    logo?: ImageItem;
    socialLinks?: Button[];
    columns?: { heading?: string; links?: Button[] }[];
    bottom?: string;
    bottomLinks?: Button[];
    paragraphs?: string[];
    closeLabel?: string;
    summaryEyebrow?: string;
    summaryHeading?: string;
    legalItems?: { label?: string; body?: string; items?: string[] }[];
  }>(block);
  if (props.layout === 'site-footer') {
    return (
      <footer data-cms-block-id={block.id}>
        <div className="footer-inner">
          <div>
            {props.logo?.src ? (
              <div className="footer-logo">
                <img loading="lazy" decoding="async" src={safeCmsUrl(props.logo.src)} alt={props.logo.alt || 'Shoreline Aquatics'} />
              </div>
            ) : null}
            {props.body ? <p className="footer-about">{props.body}</p> : null}
            {props.socialLinks?.length ? (
              <div className="footer-socials">
                {props.socialLinks.map((link) => (
                  <a href={safeCmsUrl(link.href) || '#'} className="footer-social" target="_blank" rel="noopener noreferrer" aria-label={`Shoreline Aquatics on ${link.label}`} key={link.label}>
                    <span>{String(link.label || '').slice(0, 1)}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          {(props.columns || []).map((column) => (
            <div className="footer-col" key={column.heading}>
              {column.heading ? <h5>{column.heading}</h5> : null}
              <ul>
                {(column.links || []).map((link) => <li key={link.label}><a href={safeCmsUrl(link.href) || '#'}>{link.label}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          {props.bottom ? <span>{props.bottom}</span> : null}
          {(props.bottomLinks || []).map((link) => <span key={link.label}><a href={safeCmsUrl(link.href) || '#'}>{link.label}</a></span>)}
        </div>
      </footer>
    );
  }
  if (props.layout === 'ops-install-banner') {
    return (
      <div className="install-banner" data-cms-block-id={block.id}>
        <div className="install-banner-copy">
          {props.heading ? <strong>{props.heading}</strong> : null}
          {props.body ? <p>{props.body}</p> : null}
        </div>
        <button className="install-banner-close" type="button" aria-label={String(props.closeLabel || 'Dismiss install reminder')}>×</button>
      </div>
    );
  }
  if (props.layout === 'thank-you-confirmation') {
    return (
      <div className="card" data-cms-block-id={block.id}>
        {props.eyebrow ? <div className="block-label">{props.eyebrow}</div> : null}
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.body ? <p>{props.body}</p> : null}
        <div className="confirm-note">
          {props.noteHeading ? <h3>{props.noteHeading}</h3> : null}
          {props.note ? <p>{props.note}</p> : null}
          {props.highlight ? <div className="confirm-highlight" id="confirm-contact-method">{props.highlight}</div> : null}
        </div>
        {props.safetyHeading ? <div className="block-label" style={{ marginTop: 22 }}>{props.safetyHeading}</div> : null}
        <div className="arrival-list">
          {(props.items || []).map((item, index) => <div className="arrival-item" key={item}>{index + 1}. {item}</div>)}
        </div>
      </div>
    );
  }
  if (props.layout === 'thank-you-arrival') {
    return (
      <div className="card" data-cms-block-id={block.id}>
        {props.eyebrow ? <div className="block-label">{props.eyebrow}</div> : null}
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.body ? <div className="arrival-copy">{props.body}</div> : null}
        <div className="address-card">
          <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: 6 }}>Use this address</strong>
          {(props.addressLines || []).map((line) => <span style={{ display: 'block' }} key={line}>{line}</span>)}
        </div>
        <div className="arrival-list">
          {(props.items || []).map((step, index) => <div className="arrival-item" key={step}>{index + 1}. {step}</div>)}
        </div>
        {props.buttons?.length ? <div className="top-actions" style={{ marginTop: 18 }}>{props.buttons.map(renderButton)}</div> : null}
      </div>
    );
  }
  if (props.layout === 'waiver-legal') {
    return (
      <div className="legal-card legal-column" id="terms" data-cms-block-id={block.id}>
        {props.eyebrow ? <div className="block-label">{props.eyebrow}</div> : null}
        {props.heading ? <h2>{props.heading}</h2> : null}
        <div className="legal-copy">
          {(props.paragraphs || []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="legal-section">
          {props.summaryEyebrow ? <div className="mini-kicker">{props.summaryEyebrow}</div> : null}
          {props.summaryHeading ? <h3>{props.summaryHeading}</h3> : null}
          <div className="legal-list">
            {(props.legalItems || []).map((item, index) => (
              <div className="legal-item" key={index + 1}>
                <div className="legal-index">{index + 1}</div>
                <div>
                  {item.label ? <strong>{item.label}</strong> : null}
                  {item.label ? ' ' : null}
                  {item.body}
                  {item.items?.length ? (
                    <ul className="sub-risk-list">
                      {item.items.map((risk) => <li key={risk}>{risk}</li>)}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (props.layout === 'home-location') {
    return (
      <section id="location" className="map-section" data-cms-block-id={block.id}>
        <div className="section-inner">
          {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
          {props.heading ? <h2>{props.heading}</h2> : null}
          <div className="location-grid">
            <div className="directions-card">
              <div className="location-address">
                {props.address ? <span className="address-pill">{props.address}</span> : null}
                {safeCmsUrl(props.mapsUrl) ? <a className="address-pill" href={safeCmsUrl(props.mapsUrl)} target="_blank" rel="noopener noreferrer">Open in Maps</a> : null}
              </div>
              {props.body ? <p>{props.body}</p> : null}
              <div className="directions-list">
                {(props.items || []).map((step, index) => (
                  <div className="direction-step" key={step}>
                    <div className="direction-index">{index + 1}</div>
                    <div className="direction-copy">{step}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="map-card">
              <div>
                <h3>Meet Us At The Launch</h3>
                <p>Use the map for the exact address, then follow the arrival instructions once you enter the park.</p>
              </div>
              {safeCmsEmbedUrl(props.mapEmbedUrl) ? (
                <div className="map-embed">
                  <iframe title="Shoreline Aquatics map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={safeCmsEmbedUrl(props.mapEmbedUrl)} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <div className="card mini" data-cms-block-id={block.id}>
      {props.eyebrow ? <div className="eyebrow">{props.eyebrow}</div> : null}
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.body ? <p>{props.body}</p> : null}
      {props.items?.length ? <ul>{props.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
    </div>
  );
}

function renderImage(block: CmsBlock) {
  const props = blockProps<ImageItem & { layout?: string; eyebrow?: string; heading?: string; copy?: string; caption?: string; images?: ImageItem[]; buttons?: Button[] }>(block);
  if (props.layout === 'home-social-gallery') {
    const topButtons = (props.buttons || []).slice(0, 2);
    const bottomButtons = (props.buttons || []).slice(2);
    return (
      <section className="ig-section" data-cms-block-id={block.id}>
        <div className="section-inner">
          <div className="ig-header">
            <div>
              {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
              {props.heading ? <h2>{props.heading}</h2> : null}
            </div>
            {topButtons.length ? (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {topButtons.map((button, index) => (
                  <a href={safeCmsUrl(button.href) || '#'} target="_blank" rel="noopener noreferrer" className="btn-ghost" key={`${button.label}-${index}`}>{button.label}</a>
                ))}
              </div>
            ) : null}
          </div>
          <div className="ig-grid">
            {(props.images || []).map((image) => (
              <div className="ig-tile" key={image.src}>
                <img loading="lazy" decoding="async" src={safeCmsUrl(image.src)} alt={image.alt || ''} />
              </div>
            ))}
          </div>
          <div className="ig-follow-cta">
            {props.copy ? <p>{props.copy}</p> : null}
            {bottomButtons.length ? (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {bottomButtons.map((button, index) => (
                  <a href={safeCmsUrl(button.href) || '#'} target="_blank" rel="noopener noreferrer" className={button.variant === 'primary' ? 'btn-primary' : 'btn-ghost'} key={`${button.label}-${index}`}>{button.label}</a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }
  if (props.layout === 'thank-you-photo') {
    return (
      <div className="card media-card" data-cms-block-id={block.id}>
        <div className="hero-photo" style={{ minHeight: 260 }}>
          {safeCmsUrl(props.src) ? <img src={safeCmsUrl(props.src)} alt={props.alt || ''} /> : null}
        </div>
        {props.caption ? <p>{props.caption}</p> : null}
      </div>
    );
  }
  const images = props.images?.length ? props.images : [{ src: props.src, alt: props.alt }];
  return (
    <div className="card media-card" data-cms-block-id={block.id} style={{ overflow: 'hidden', maxWidth: '100%' }}>
      <div className="hero-photo" style={{ overflow: 'hidden', maxWidth: '100%' }}>
        {safeCmsUrl(images[0]?.src) ? <img src={safeCmsUrl(images[0]?.src)} alt={images[0]?.alt || ''} style={{ display: 'block', height: 'auto', maxWidth: '100%', width: '100%' }} /> : null}
        {props.caption ? (
          <div className="hero-photo-badge">
            <strong>{props.caption}</strong>
          </div>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="thumb-grid">
          {images.slice(1).map((image) => (
            <div className="thumb" key={image.src}><img src={safeCmsUrl(image.src)} alt={image.alt || ''} style={{ display: 'block', height: 'auto', maxWidth: '100%', width: '100%' }} /></div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderVideo(block: CmsBlock) {
  const props = blockProps<{ src?: string; poster?: string; caption?: string }>(block);
  if (!props.src) return null;
  return (
    <div className="card media-card" data-cms-block-id={block.id} style={{ overflow: 'hidden', maxWidth: '100%' }}>
      <div className="hero-video-shell" style={{ overflow: 'hidden', maxWidth: '100%' }}>
        <video controls playsInline preload="metadata" poster={safeCmsUrl(props.poster) || undefined} style={{ display: 'block', maxWidth: '100%', width: '100%' }}>
          <source src={safeCmsUrl(props.src)} type="video/mp4" />
        </video>
      </div>
      {props.caption ? <p>{props.caption}</p> : null}
    </div>
  );
}

function renderButtonGroup(block: CmsBlock) {
  const props = blockProps<{ layout?: string; buttons?: Button[] }>(block);
  if (props.layout === 'mobile-cta') {
    return (
      <div id="mobile-cta-bar" data-cms-block-id={block.id}>
        {(props.buttons || []).map((button, index) => (
          <a href={safeCmsUrl(button.href) || '#'} className={index === 0 ? 'mcta-book' : 'mcta-text'} key={`${button.label}-${index}`}>{button.label}</a>
        ))}
      </div>
    );
  }
  return <div className="cta-row" data-cms-block-id={block.id}>{(props.buttons || []).map(renderButton)}</div>;
}

function renderServiceList(block: CmsBlock) {
  const props = blockProps<{ layout?: string; eyebrow?: string; heading?: string; copy?: string; items?: Record<string, unknown>[] }>(block);
  if (props.layout === 'home-addons') {
    const item = props.items?.[0] || {};
    const images = Array.isArray(item.images) ? item.images as ImageItem[] : [];
    const buttons = Array.isArray(item.buttons) ? item.buttons as Button[] : [];
    return (
      <section id="addons" data-cms-block-id={block.id}>
        <div className="section-inner">
          {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
          {props.heading ? <h2>{props.heading}</h2> : null}
          {props.copy ? <p className="section-sub">{props.copy}</p> : null}
          <div className="addons-grid">
            <div className="addon-card addon-card-feature">
              {images[0]?.src ? (
                <div className="addon-media">
                  <img loading="lazy" decoding="async" src={safeCmsUrl(images[0].src)} alt={images[0].alt || ''} />
                </div>
              ) : null}
              <div className="addon-content">
                {item.badge ? <div className="addon-topline"><span className="addon-tag">{String(item.badge)}</span></div> : null}
                {item.title ? <div className="addon-name">{String(item.title)}</div> : null}
                {item.copy ? <p className="addon-desc">{String(item.copy)}</p> : null}
                {Array.isArray(item.perks) ? (
                  <div className="addon-points">
                    {(item.perks as string[]).map((perk) => <span className="addon-point" key={perk}>{perk}</span>)}
                  </div>
                ) : null}
                <div className="addon-foot">
                  {item.price ? (
                    <div className="addon-price-wrap">
                      <div className="addon-price">{String(item.price)} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>{String(item.priceNote || '')}</span></div>
                      <div className="addon-price-note">Easy add-on during booking</div>
                    </div>
                  ) : null}
                  {buttons[0] ? <a href={safeCmsUrl(buttons[0].href) || '#'} className="addon-cta">{buttons[0].label} →</a> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <div className="card mini" data-cms-block-id={block.id}>
      {props.eyebrow ? <div className="eyebrow">{props.eyebrow}</div> : null}
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.copy ? <p>{props.copy}</p> : null}
      <div className="grid" style={{ marginTop: 16 }}>
        {(props.items || []).map((item, index) => (
          <div className="item" key={String(item.id || item.title || index)}>
            {item.title ? <strong>{String(item.title)}</strong> : null}
            {item.copy ? <span>{String(item.copy)}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderFaq(block: CmsBlock) {
  const props = blockProps<{ layout?: string; heading?: string; copy?: string; items?: { question: string; answer: string }[] }>(block);
  if (props.layout === 'home-faq') {
    const items = props.items || [];
    const midpoint = Math.ceil(items.length / 2);
    return (
      <section id="faq" data-cms-block-id={block.id}>
        <div className="section-inner">
          <div className="section-tag">FAQ</div>
          {props.heading ? <h2>{props.heading}</h2> : null}
          {props.copy ? <p className="section-sub">{props.copy}</p> : null}
          <div className="faq-cols">
            {[items.slice(0, midpoint), items.slice(midpoint)].map((column, index) => (
              <div key={index}>
                {column.map((item) => (
                  <div className="faq-item" key={item.question}>
                    <div className="faq-q">{item.question} <span className="faq-toggle">+</span></div>
                    <div className="faq-a">{item.answer}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <div className="card mini" data-cms-block-id={block.id}>
      {props.heading ? <h2>{props.heading}</h2> : null}
      <div className="stack" style={{ marginTop: 14 }}>
        {(props.items || []).map((item) => <p key={item.question}><strong>{item.question}</strong> {item.answer}</p>)}
      </div>
    </div>
  );
}

function renderCtaBand(block: CmsBlock) {
  const props = blockProps<{ layout?: string; eyebrow?: string; heading?: string; copy?: string; note?: string; buttons?: Button[] }>(block);
  if (props.layout === 'waiver-success') {
    return (
      <div className="success-card" id="success-card" data-cms-block-id={block.id}>
        {props.eyebrow ? <div className="block-label">{props.eyebrow}</div> : null}
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.copy ? <div className="success-copy">{props.copy}</div> : null}
        {props.buttons?.length ? <div className="top-actions" style={{ marginTop: 16 }}>{props.buttons.map(renderButton)}</div> : null}
      </div>
    );
  }
  if (props.layout === 'home-cta') {
    return (
      <div className="cta-band" data-cms-block-id={block.id}>
        {props.heading ? <h2>{props.heading}</h2> : null}
        {props.copy ? <p>{props.copy}</p> : null}
        {props.buttons?.length ? <div className="cta-actions">{props.buttons.map((button, index) => (
          <a href={safeCmsUrl(button.href) || '#'} className={button.variant === 'secondary' ? 'btn-ghost' : 'btn-primary'} key={`${button.label}-${index}`}>{button.label}</a>
        ))}</div> : null}
        {props.note ? <div className="cta-note">{props.note}</div> : null}
      </div>
    );
  }
  return (
    <div className="card mini" style={{ marginTop: 16, textAlign: 'center' }} data-cms-block-id={block.id}>
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.copy ? <p>{props.copy}</p> : null}
      {props.buttons?.length ? <div className="cta-row">{props.buttons.map(renderButton)}</div> : null}
    </div>
  );
}

function renderBookingEntry(block: CmsBlock) {
  const props = blockProps<{ heading?: string; copy?: string; helpText?: string; buttons?: Button[]; bookingHref?: string; craftKey?: string; mode?: string }>(block);
  const buttons = props.buttons?.length ? props.buttons : [{ label: 'Book Now', href: props.bookingHref || '#booking', variant: 'primary' }];
  return (
    <div className="card mini" data-cms-block-id={block.id} data-craft-key={props.craftKey || ''} data-cta-mode={props.mode || ''}>
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.copy ? <p>{props.copy}</p> : null}
      {props.helpText ? <p className="cms-editor-note">{props.helpText}</p> : null}
      <div className="cta-row">{buttons.map(renderButton)}</div>
    </div>
  );
}

function renderBookingPackageSelector(block: CmsBlock) {
  const props = blockProps<{ heading?: string; copy?: string; tabs?: Record<string, unknown>[]; pricingSource?: string }>(block);
  return (
    <section className="card mini cms-booking-package-selector" data-cms-block-id={block.id} data-pricing-source={String(props.pricingSource || 'code-owned')}>
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.copy ? <p>{props.copy}</p> : null}
      <div className="grid" style={{ marginTop: 16 }}>
        {(props.tabs || []).map((tab, index) => {
          const craftOptions = Array.isArray(tab.craftOptions) ? tab.craftOptions as Record<string, unknown>[] : [];
          const durationOptions = Array.isArray(tab.durationOptions) ? tab.durationOptions as Record<string, unknown>[] : [];
          const bookingPath = safeCmsUrl(tab.bookingPath) || '/jetski-booking/';
          return (
            <div className="item" key={String(tab.id || tab.label || index)}>
              <strong>{String(tab.label || 'Rental package')}</strong>
              {craftOptions.length ? (
                <div className="cms-chip-row">
                  {craftOptions.map((craft) => <span className="trust-badge" key={String(craft.craftKey || craft.label)}>{String(craft.label || craft.craftKey)}</span>)}
                </div>
              ) : null}
              {durationOptions.length ? (
                <div className="cms-chip-row">
                  {durationOptions.map((duration) => <span className="trust-badge" key={String(duration.hours || duration.label)}>{String(duration.label || `${duration.hours || ''} hours`)} {duration.rateLabel ? `· ${String(duration.rateLabel)}` : ''}</span>)}
                </div>
              ) : null}
              <a className="btn btn-primary" href={bookingPath}>{String(tab.submitLabel || 'Book Now')}</a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function renderAvailabilityChecker(block: CmsBlock) {
  const props = blockProps<{
    heading?: string;
    helpText?: string;
    apiPath?: string;
    craftKey?: string;
    durationHours?: string | number;
    dateFieldLabel?: string;
    timeFieldLabel?: string;
    emptyStateCopy?: string;
    blockedStateCopy?: string;
  }>(block);
  const apiPath = safeCmsUrl(props.apiPath) || '/api/public/availability';
  return (
    <section
      className="card mini cms-availability-checker"
      data-cms-block-id={block.id}
      data-availability-source={apiPath}
      data-craft-key={String(props.craftKey || '')}
      data-duration-hours={String(props.durationHours || '')}
    >
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.helpText ? <p>{props.helpText}</p> : null}
      <div className="cms-field-grid" style={{ marginTop: 16 }}>
        <label>
          {props.dateFieldLabel || 'Rental date'}
          <input type="date" name="cmsAvailabilityDate" />
        </label>
        <label>
          {props.timeFieldLabel || 'Start time'}
          <input type="time" name="cmsAvailabilityTime" />
        </label>
      </div>
      <div className="availability-slot-grid" data-empty-copy={props.emptyStateCopy || 'Choose a date to see available times.'}>
        <div className="availability-spotlight-copy">{props.emptyStateCopy || 'Choose a date to see available times.'}</div>
      </div>
      <p className="cms-editor-note">{props.blockedStateCopy || 'Unavailable times remain blocked by the booking availability API.'}</p>
    </section>
  );
}

function renderWaiverPaymentCta(block: CmsBlock) {
  const props = blockProps<{ heading?: string; helpText?: string; mode?: string; buttons?: Button[] }>(block);
  const buttons = props.buttons?.length ? props.buttons : [
    { label: 'Complete Waiver', href: '/waiver', variant: 'primary' },
    { label: 'Continue Checkout', href: '/jetski-booking-confirmation', variant: 'secondary' }
  ];
  return (
    <section className="card mini cms-waiver-payment-cta" data-cms-block-id={block.id} data-cta-mode={props.mode || 'waiver-payment'}>
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.helpText ? <p>{props.helpText}</p> : null}
      <div className="cta-row">{buttons.map(renderButton)}</div>
    </section>
  );
}

function renderLocationDirections(block: CmsBlock) {
  const props = blockProps<{ heading?: string; address?: string; directions?: string[]; mapsUrl?: string; mapEmbedUrl?: string }>(block);
  return renderRichText({
    ...block,
    props: {
      layout: 'home-location',
      heading: props.heading,
      body: 'Use these arrival instructions when you are heading to the launch.',
      address: props.address,
      mapsUrl: safeCmsUrl(props.mapsUrl),
      mapEmbedUrl: safeCmsEmbedUrl(props.mapEmbedUrl),
      items: props.directions || []
    }
  });
}

function renderStripeProductList(block: CmsBlock) {
  const props = blockProps<{ heading?: string; copy?: string; products?: Record<string, unknown>[] }>(block);
  return (
    <div className="card mini" data-cms-block-id={block.id}>
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.copy ? <p>{props.copy}</p> : null}
      <div className="grid" style={{ marginTop: 16 }}>
        {(props.products || []).map((product, index) => (
          <div className="item" key={String(product.productKey || product.stripeProductId || index)}>
            <strong>{String(product.displayName || product.label || product.productKey || 'Product')}</strong>
            <span>{String(product.displayPrice || '')}</span>
            {product.stripeProductId || product.stripePriceId || product.stripeLookupKey ? (
              <small>{String(product.checkoutMode || 'display')} mapping configured</small>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderRentalRateTable(block: CmsBlock) {
  const props = blockProps<{ heading?: string; copy?: string; pricingSource?: string; rates?: Record<string, unknown>[]; seasonalOverrides?: Record<string, unknown>[] }>(block);
  return (
    <section className="card mini cms-rental-rate-table" data-cms-block-id={block.id} data-pricing-source={String(props.pricingSource || 'code-owned')}>
      {props.heading ? <h2>{props.heading}</h2> : null}
      {props.copy ? <p>{props.copy}</p> : null}
      <div className="grid" style={{ marginTop: 16 }}>
        {(props.rates || []).map((rate, index) => (
          <div className="item" key={String(rate.craftKey || index)}>
            <strong>{String(rate.craftKey || 'Rental')}</strong>
            <span>{String(rate.durationHours || '')} hours</span>
            <small>
              {[rate.baseRateCents ? `${String(rate.baseRateCents)} cents base` : '', rate.depositCents ? `${String(rate.depositCents)} cents deposit` : '', rate.processingFeeCents ? `${String(rate.processingFeeCents)} cents fee` : '']
                .filter(Boolean)
                .join(' · ')}
            </small>
          </div>
        ))}
      </div>
      {props.seasonalOverrides?.length ? (
        <div className="cms-editor-note">{props.seasonalOverrides.length} seasonal pricing overrides configured for review.</div>
      ) : null}
    </section>
  );
}

function renderBusinessCardList(block: CmsBlock) {
  const props = blockProps<{
    heading?: string;
    headline?: string;
    city?: string;
    copy?: string;
    body?: string;
    routeCopy?: string;
    termsVersion?: string;
    offerKey?: string;
    pricingSource?: string;
    products?: Record<string, unknown>[];
    addons?: Record<string, unknown>[];
    checkboxes?: Record<string, unknown>[];
    localFaq?: Record<string, unknown>[];
    policies?: Record<string, unknown>[];
    proofItems?: string[];
    nearbyCities?: string[];
    items?: Record<string, unknown>[];
  }>(block);
  const records = props.products || props.addons || props.checkboxes || props.localFaq || props.policies || props.items || [];
  const title = props.heading || props.headline || props.city || props.offerKey || block.label || 'CMS block';
  const copy = props.copy || props.body || props.routeCopy || (props.termsVersion ? `Terms version: ${props.termsVersion}` : '');
  return (
    <section className="card mini cms-business-card-list" data-cms-block-id={block.id} data-pricing-source={String(props.pricingSource || '')}>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
      <div className="grid" style={{ marginTop: 16 }}>
        {records.map((item, index) => (
          <div className="item" key={String(item.productKey || item.addonKey || item.policyKey || item.id || item.question || index)}>
            <strong>{String(item.displayName || item.label || item.title || item.question || item.productKey || item.addonKey || item.policyKey || 'Item')}</strong>
            <span>{String(item.displayPrice || item.priceLabel || item.summary || item.answer || item.body || '')}</span>
            {item.stripePriceId || item.checkoutLineItemKey || item.effectiveDate ? (
              <small>{String(item.stripePriceId || item.checkoutLineItemKey || item.effectiveDate)} configured</small>
            ) : null}
          </div>
        ))}
        {props.proofItems?.map((item) => <div className="item" key={item}><strong>{item}</strong></div>)}
        {props.nearbyCities?.map((item) => <div className="item" key={item}><strong>{item}</strong></div>)}
      </div>
    </section>
  );
}

function renderBlock(block: CmsBlock) {
  if (block.type === 'topbar') return renderTopbar(block);
  if (block.type === 'hero') return renderHero(block);
  if (block.type === 'rich-text' || block.type === 'heading' || block.type === 'list' || block.type === 'quote' || block.type === 'table' || block.type === 'columns') return renderRichText(block);
  if (block.type === 'image' || block.type === 'carousel' || block.type === 'gallery' || block.type === 'embed') return renderImage(block);
  if (block.type === 'video') return renderVideo(block);
  if (block.type === 'button-group') return renderButtonGroup(block);
  if (block.type === 'card-grid' || block.type === 'reviews-social' || block.type === 'review-carousel') return renderCardGrid(normalizeReviewBlock(block));
  if (block.type === 'service-list' || block.type === 'product-list' || block.type === 'rental-product-cards' || block.type === 'rental-offering-list' || block.type === 'add-ons' || block.type === 'addon-list' || block.type === 'safety-requirements' || block.type === 'policy-list') return renderServiceList(normalizeServiceBlock(block));
  if (block.type === 'booking-entry') return renderBookingEntry(block);
  if (block.type === 'booking-package-selector') return renderBookingPackageSelector(block);
  if (block.type === 'rental-rate-table') return renderRentalRateTable(block);
  if (block.type === 'availability-checker' || block.type === 'live-availability-panel') return renderAvailabilityChecker(block);
  if (block.type === 'availability-waiver-payment-cta') return renderWaiverPaymentCta(block);
  if (block.type === 'location-directions') return renderLocationDirections(block);
  if (block.type === 'stripe-product-list' || block.type === 'stripe-catalog-display') return renderStripeProductList(block);
  if (block.type === 'stripe-checkout-products' || block.type === 'booking-add-on-catalog' || block.type === 'waiver-checklist' || block.type === 'seasonal-offer-banner' || block.type === 'location-service-area' || block.type === 'policy-card-list') return renderBusinessCardList(block);
  if (block.type === 'faq') return renderFaq(block);
  if (block.type === 'cta-band') return renderCtaBand(block);
  if (block.type === 'break') return <div className="cms-site-break" data-cms-block-id={block.id} />;
  return null;
}

function normalizeServiceBlock(block: CmsBlock): CmsBlock {
  if (block.type !== 'policy-list') return block;
  const props = blockProps<{ heading?: string; intro?: string; items?: Record<string, unknown>[] }>(block);
  return {
    ...block,
    props: {
      ...block.props,
      copy: props.intro,
      items: (props.items || []).map((item) => ({
        title: item.title || item.policyKey,
        copy: item.summary || item.body,
        badge: item.severity
      }))
    }
  };
}

function normalizeReviewBlock(block: CmsBlock): CmsBlock {
  if (block.type !== 'review-carousel') return block;
  const props = blockProps<{ reviews?: Record<string, unknown>[] }>(block);
  return {
    ...block,
    props: {
      ...block.props,
      layout: block.props.layout || 'home-reviews',
      items: (props.reviews || []).map((review) => ({
        title: review.author,
        initials: review.initials,
        meta: [review.source, review.verified ? 'Verified' : '', review.date].filter(Boolean).join(' · '),
        source: review.source,
        copy: review.body
      }))
    }
  };
}

function renderCardGrid(block: CmsBlock) {
  const props = blockProps<{ layout?: string; eyebrow?: string; heading?: string; copy?: string; score?: string; summary?: string; badge?: string; hint?: string; items?: Record<string, unknown>[] }>(block);
  const items = props.items || [];
  if (props.layout === 'home-reviews') {
    return (
      <section id="reviews" data-cms-block-id={block.id}>
        <div className="section-inner">
          {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
          {props.heading ? <h2>{props.heading}</h2> : null}
          <div className="reviews-summary">
            {props.score ? <div className="summary-score">{props.score}</div> : null}
            <div className="summary-right">
              <div className="summary-stars"><span className="summary-star">★</span><span className="summary-star">★</span><span className="summary-star">★</span><span className="summary-star">★</span><span className="summary-star">★</span></div>
              {props.summary ? <div className="summary-count">{props.summary}</div> : null}
            </div>
            <div className="summary-divider" />
            {props.badge ? <div className="summary-badge">{props.badge}</div> : null}
          </div>
          <div className="reviews-carousel">
            <div className="reviews-track" id="reviews-track">
              {items.map((review) => (
                <div className="review-slide" key={String(review.title)}>
                  <div className="review-card">
                    <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
                    {review.copy ? <div className="review-text">{String(review.copy)}</div> : null}
                    <div className="review-author">
                      <div className="review-avatar">{String(review.initials || '').slice(0, 2)}</div>
                      <div>
                        {review.title ? <div className="review-name">{String(review.title)}</div> : null}
                        {review.meta ? <div className="review-meta">{String(review.meta)}</div> : null}
                      </div>
                    </div>
                    {review.source ? <div className="review-source"><div className="google-dot" /> {String(review.source)}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reviews-controls">
            {props.hint ? <div className="reviews-hint">{props.hint}</div> : null}
            <div className="reviews-nav">
              <button className="reviews-btn" type="button" aria-label="Previous review">←</button>
              <div className="reviews-dots" id="reviews-dots" />
              <button className="reviews-btn" type="button" aria-label="Next review">→</button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  if (props.layout === 'trust-bar') {
    return (
      <div className="trust-bar" data-cms-block-id={block.id}>
        <div className="trust-inner">
          {items.map((item) => (
            <div className="trust-item" key={String(item.title)}>
              <div className="trust-num">{String(item.title || '')}</div>
              <div className="trust-label">{String(item.copy || '')}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (props.layout === 'home-steps') {
    return (
      <section className="how-section" data-cms-block-id={block.id}>
        <div className="section-inner">
          <div className="how-shell">
            <div className="how-head">
              <div className="how-title-wrap">
                {props.heading ? <div className="how-title">{props.heading}</div> : null}
              </div>
              {props.copy ? <div className="how-intro">{props.copy}</div> : null}
            </div>
            <div className="how-grid">
              {items.map((item, index) => (
                <div className="how-step" key={String(item.title || index)}>
                  <div className="how-step-num">{index + 1}</div>
                  {item.title ? <h3>{String(item.title)}</h3> : null}
                  {item.copy ? <p>{String(item.copy)}</p> : null}
                  {index < items.length - 1 ? <div className="how-arrow">↓</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
  if (props.layout === 'home-why') {
    return (
      <section className="why-section" data-cms-block-id={block.id}>
        <div className="section-inner">
          <div className="why-hero">
            {props.eyebrow ? <div className="section-tag">{props.eyebrow}</div> : null}
            {props.heading ? <h2 className="why-title">{props.heading}</h2> : null}
            {props.copy ? <p className="why-subtitle">{props.copy}</p> : null}
          </div>
          <div className="why-grid">
            {items.map((item, index) => (
              <div className="why-item" key={String(item.title || index)}>
                <div className="why-item-top">
                  <span className="why-item-index">{String(index + 1).padStart(2, '0')}</span>
                </div>
                {item.title ? <h3>{String(item.title)}</h3> : null}
                {item.copy ? <p>{String(item.copy)}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return renderServiceList(block);
}

export function SlaquaticsCmsPublicRenderer({ content, ...filter }: { content: CmsContent | null } & BlockFilter) {
  const blocks = filterBlocks(content, filter);
  if (!blocks.length) return null;
  const style = styleFromTokens(blocks);
  return (
    <div className="slaquatics-cms-public" data-cms-site={slaquaticsCmsSiteId} style={style}>
      {blocks.filter((block) => block.type !== 'style-tokens').map((block) => <div key={block.id}>{renderBlock(block)}</div>)}
    </div>
  );
}

export function SlaquaticsCmsEditorPreview({ content, selectedBlockId = '', onSelectBlock }: SlaquaticsCmsEditorPreviewProps) {
  const blocks = filterBlocks(content, {});
  if (!blocks.length) return null;
  const style = styleFromTokens(blocks);
  return (
    <div className="slaquatics-cms-public cms-site-editor-preview" data-cms-site={slaquaticsCmsSiteId} style={style}>
      {blocks.filter((block) => block.type !== 'style-tokens').map((block) => {
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
            {renderBlock(block)}
          </div>
        );
      })}
    </div>
  );
}
