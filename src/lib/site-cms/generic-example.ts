import type { CmsContent } from '../cms/core.ts';
import { createCmsSiteConfig } from '../cms/core.ts';

export const genericExampleCmsSiteConfig = createCmsSiteConfig({
  siteId: 'generic-example',
  theme: {
    buttonVariants: ['primary', 'secondary', 'link'],
    imageRatios: ['16:9', '4:3', '1:1'],
    colorTokens: ['brand', 'accent', 'surface', 'text']
  },
  blocks: [
    { type: 'topbar', label: 'Topbar', fields: ['logo', 'links', 'buttons'] },
    { type: 'hero', label: 'Hero', fields: ['eyebrow', 'heading', 'copy', 'buttons', 'media'] },
    { type: 'rich-text', label: 'Rich Text', fields: ['heading', 'body'] },
    { type: 'button-group', label: 'Buttons', fields: ['buttons'] },
    { type: 'image', label: 'Image', fields: ['src', 'alt', 'caption'] },
    { type: 'video', label: 'Video', fields: ['src', 'poster', 'caption'] },
    { type: 'carousel', label: 'Carousel', fields: ['images'] },
    { type: 'product-list', label: 'Product List', fields: ['heading', 'items'] },
    { type: 'card-grid', label: 'Card Grid', fields: ['heading', 'items'] },
    { type: 'faq', label: 'FAQ', fields: ['heading', 'items'] },
    { type: 'break', label: 'Section Break', fields: ['spacing', 'style'] },
    { type: 'cta-band', label: 'CTA Band', fields: ['heading', 'copy', 'buttons'] }
  ],
  media: {
    uploadPrefix: 'cms/',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
    maxBytes: 25 * 1024 * 1024,
    publicUrlForKey: (key) => `/media/${key.replace(/^\/+/, '')}`
  },
  routes: {
    publicBasePath: '/',
    adminBasePath: '/cms'
  }
});

export const genericExampleCmsContent: CmsContent = {
  id: 'generic-home',
  slug: 'home',
  title: 'Home',
  contentType: 'page',
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  blocks: [
    {
      id: 'generic-hero',
      type: 'hero',
      label: 'Homepage Hero',
      props: {
        eyebrow: 'Client Site',
        heading: 'Editable homepage',
        copy: 'This content renders through the shared CMS core and a client-specific adapter.',
        buttons: [
          { label: 'Primary Action', href: '/contact', variant: 'primary' },
          { label: 'Learn More', href: '/about', variant: 'secondary' }
        ],
        media: { src: '/media/hero.webp', alt: 'Editable hero media' }
      }
    },
    {
      id: 'generic-products',
      type: 'product-list',
      label: 'Products',
      props: {
        heading: 'Editable products',
        items: [
          {
            title: 'Product',
            copy: 'Products, services, and reusable lists use the same structured block model.',
            buttons: [{ label: 'View', href: '/products/product', variant: 'link' }],
            images: [{ src: '/media/product.webp', alt: 'Editable product image' }]
          }
        ]
      }
    }
  ]
};
