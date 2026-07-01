import type { CmsBlock, CmsBlockDefinition, CmsContent, CmsContentType } from './core.ts';
import { normalizeCmsSlug } from './core.ts';

export function createDefaultCmsContent(input: {
  id: string;
  slug: string;
  title: string;
  blocks: CmsBlock[];
  contentType?: CmsContentType;
}): CmsContent {
  const now = '2026-06-30T00:00:00.000Z';
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    contentType: input.contentType || 'reusableSection',
    status: 'published',
    blocks: input.blocks,
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  };
}

export function createCmsContentTemplate(input: {
  siteId: string;
  contentType: CmsContentType;
  title: string;
  slug: string;
  blockDefinitions: CmsBlockDefinition[];
  now?: string;
}): CmsContent {
  const now = input.now || new Date().toISOString();
  const slug = normalizeCmsSlug(input.slug || input.title || 'untitled');
  return {
    id: `${input.siteId}-${input.contentType}-${slug}`,
    slug,
    title: input.title || 'Untitled',
    contentType: input.contentType,
    status: 'draft',
    seo: {
      title: input.title || 'Untitled',
      description: ''
    },
    blocks: templateBlocks(input.contentType, input.blockDefinitions),
    createdAt: now,
    updatedAt: now
  };
}

function templateBlocks(contentType: CmsContentType, blockDefinitions: CmsBlockDefinition[]): CmsBlock[] {
  const templates: Record<CmsContentType, string[]> = {
    page: ['topbar', 'hero', 'rich-text', 'cta-band'],
    blogPost: ['hero', 'rich-text', 'image', 'cta-band'],
    productList: ['hero', 'product-list', 'faq', 'cta-band'],
    reusableSection: ['rich-text', 'button-group', 'image'],
    pattern: ['rich-text', 'button-group'],
    navigationMenu: ['navigation-menu'],
    styleSettings: ['style-tokens'],
    stripeCatalog: ['stripe-product-list']
  };
  const allowed = new Set(blockDefinitions.map((block) => block.type));
  const preferred = templates[contentType].filter((type) => allowed.has(type));
  const types = preferred.length ? preferred : [blockDefinitions[0]?.type || 'rich-text'];
  return types.map((type, index) => {
    const definition = blockDefinitions.find((block) => block.type === type);
    return {
      id: `${contentType}-${type}-${index + 1}`,
      type,
      label: definition?.label || type,
      props: templateProps(type, definition?.fields || ['heading', 'copy'])
    };
  });
}

function templateProps(type: string, fields: string[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field, templateFieldValue(type, field)]));
}

function templateFieldValue(type: string, field: string): unknown {
  if (field === 'buttons') return [{ label: 'Button', href: '#', variant: 'primary', image: '' }];
  if (field === 'links') return [{ label: 'Link', href: '#' }];
  if (field === 'menuItems') return [{ label: 'Home', href: '/', children: [] }];
  if (field === 'images') return [{ src: '', alt: '', caption: '' }];
  if (field === 'items' && type === 'faq') return [{ question: 'Question', answer: 'Answer' }];
  if (field === 'items' && type === 'stripe-product-list') return [{ productKey: 'deposit', name: 'Booking Deposit', amount: '50.00', stripeLookupKey: '', editableInStripe: false }];
  if (field === 'items') return [{ title: 'Item', copy: '', buttons: [], images: [] }];
  if (field === 'products') return [{ productKey: 'deposit', label: 'Booking Deposit', displayPrice: '$50', stripeLookupKey: '', checkoutMode: 'deposit' }];
  if (field === 'styleTokens') return {};
  if (field === 'media' || field === 'logo') return { src: '', alt: '' };
  if (field === 'heading') return 'Draft heading';
  if (field === 'copy' || field === 'body') return 'Draft content.';
  return '';
}
