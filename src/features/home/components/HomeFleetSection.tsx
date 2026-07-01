import type { CmsContent } from '../../../lib/cms/core';
import { CMS_HOME_FLEET_SECTION, cmsSlaquaticsSiteConfig, loadSlaquaticsCmsContent } from '../../../lib/site-cms/slaquatics';

type CmsServiceItem = {
  id: string;
  badge: string;
  title: string;
  statLabel: string;
  price: string;
  copy: string;
  rateNote?: string;
  perks: string[];
  buttons: { label: string; href: string; variant: string }[];
  images: { src: string; alt: string }[];
};

type FleetBlockProps = {
  eyebrow: string;
  heading: string;
  copy: string;
  banner?: {
    href: string;
    strong: string;
    text: string;
    cta: string;
  };
  items: CmsServiceItem[];
};

type BundleBlockProps = {
  heading: string;
  copy: string;
  badges: string[];
  buttons: { label: string; href: string; variant: string }[];
  images: { src: string; alt: string }[];
};

function fleetBlockProps(content: CmsContent): FleetBlockProps | undefined {
  return content.blocks.find((block) => block.type === 'service-list')?.props as FleetBlockProps;
}

function bundleBlockProps(content: CmsContent): BundleBlockProps | undefined {
  return content.blocks.find((block) => block.type === 'cta-band')?.props as BundleBlockProps;
}

function FleetMedia({ item }: { item: CmsServiceItem }) {
  const isSlider = item.images.length > 1;
  return (
    <div className={`fleet-media${isSlider ? ' fleet-slider' : ''}`}>
      {item.images.map((image, index) => (
        <img
          className={isSlider ? `slide${index === 0 ? ' active' : ''}` : undefined}
          loading="lazy"
          decoding="async"
          src={image.src}
          alt={image.alt}
          key={image.src}
        />
      ))}
      {isSlider ? (
        <>
          <button className="slider-arrow prev" type="button" aria-label="Previous photo">‹</button>
          <button className="slider-arrow next" type="button" aria-label="Next photo">›</button>
          <div className="slider-dots" />
        </>
      ) : null}
    </div>
  );
}

function FleetCard({ item }: { item: CmsServiceItem }) {
  const primaryButton = item.buttons[0];
  return (
    <div className="fleet-card" id={item.id}>
      <FleetMedia item={item} />
      <div className="fleet-body">
        <div className="fleet-badge">{item.badge}</div>
        <div className="fleet-title-row">
          <div className="fleet-title">{item.title}</div>
          <div className="fleet-stat">
            <div className="fleet-stat-label">{item.statLabel}</div>
            <div className="fleet-stat-value">{item.price}</div>
          </div>
        </div>
        <p className="fleet-desc">{item.copy}</p>
        {item.rateNote ? <div className="fleet-rate-note">{item.rateNote}</div> : null}
        <div className="fleet-perks">
          {item.perks.map((perk) => <span className="fleet-perk" key={perk}>{perk}</span>)}
        </div>
        {primaryButton ? (
          <div className="fleet-actions">
            <a href={primaryButton.href} className="btn-primary">{primaryButton.label}</a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export async function HomeFleetSection() {
  const content = await loadSlaquaticsCmsContent('home/fleet') || CMS_HOME_FLEET_SECTION;
  const fleet = (fleetBlockProps(content) || fleetBlockProps(CMS_HOME_FLEET_SECTION))!;
  const bundle = (bundleBlockProps(content) || bundleBlockProps(CMS_HOME_FLEET_SECTION))!;

  return (
    <section id="fleet" className="fleet-section" data-cms-site={cmsSlaquaticsSiteConfig.siteId}>
      <div className="section-inner">
        <div className="section-tag">{fleet.eyebrow}</div>
        <h2>{fleet.heading}</h2>
        <p className="section-sub">{fleet.copy}</p>
        {fleet.banner ? (
          <a className="holiday-banner" href={fleet.banner.href}>
            <span className="holiday-banner-text">
              <strong>{fleet.banner.strong}</strong>
              {fleet.banner.text}
            </span>
            <span className="holiday-banner-cta">{fleet.banner.cta}</span>
          </a>
        ) : null}
        <div className="fleet-grid">
          {fleet.items.map((item) => <FleetCard item={item} key={item.id} />)}
        </div>
        <div className="bundle-highlight">
          <div className="bundle-media-stack">
            {bundle.images.map((image) => (
              <div className="bundle-media" key={image.src}>
                <img loading="lazy" decoding="async" src={image.src} alt={image.alt} />
              </div>
            ))}
          </div>
          <div className="bundle-copy">
            <h3>{bundle.heading}</h3>
            <p>{bundle.copy}</p>
            <div className="bundle-badges">
              {bundle.badges.map((badge) => <span className="bundle-badge" key={badge}>{badge}</span>)}
            </div>
            {bundle.buttons[0] ? (
              <div className="bundle-action">
                <a href={bundle.buttons[0].href} className="btn-primary">{bundle.buttons[0].label}</a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
