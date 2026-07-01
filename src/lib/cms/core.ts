export type CmsRole = 'owner' | 'admin' | 'editor' | 'client';
export type CmsContentStatus = 'draft' | 'published' | 'scheduled' | 'archived';
export type CmsContentType =
  | 'page'
  | 'blogPost'
  | 'productList'
  | 'reusableSection'
  | 'pattern'
  | 'navigationMenu'
  | 'styleSettings'
  | 'stripeCatalog';

export type CmsButtonVariant = 'primary' | 'secondary' | 'link';

export type CmsBlock<TProps extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  type: string;
  label?: string;
  props: TProps;
  visibility?: {
    hidden?: boolean;
  };
};

export type CmsContent = {
  id: string;
  slug: string;
  title: string;
  contentType: CmsContentType;
  status: CmsContentStatus;
  blocks: CmsBlock[];
  template?: string;
  taxonomies?: {
    categories?: string[];
    tags?: string[];
  };
  metadata?: {
    featuredImage?: string;
    socialImage?: string;
    parentSlug?: string;
    sortOrder?: number;
    excerpt?: string;
    readTimeMinutes?: number;
    access?: {
      ownerUserId?: string;
      assignedUserIds?: string[];
      locked?: boolean;
    };
    custom?: Record<string, string>;
  };
  publish?: {
    scheduledAt?: string;
    expiresAt?: string;
    reviewStatus?: 'draft' | 'needsReview' | 'approved';
  };
  seo?: {
    title?: string;
    description?: string;
  };
  publishedRevisionId?: string;
  draftRevisionId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type CmsRevision = {
  id: string;
  contentId: string;
  status: CmsContentStatus;
  content: CmsContent;
  createdAt: string;
  createdBy: string;
};

export type CmsTheme = {
  buttonVariants: CmsButtonVariant[];
  imageRatios: string[];
  colorTokens: string[];
};

export type CmsMediaConfig = {
  publicUrlForKey: (key: string) => string;
  uploadPrefix: string;
  allowedMimeTypes: string[];
  maxBytes: number;
  allowedExternalHosts?: string[];
};

export type CmsMediaAsset = {
  id: string;
  key: string;
  url: string;
  contentType: string;
  alt: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
  image?: {
    crop?: string;
    focalPoint?: {
      x: number;
      y: number;
    };
  };
};

export type CmsAuditEvent = {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CmsChangeRequestStatus = 'open' | 'resolved';

export type CmsChangeRequest = {
  id: string;
  contentId: string;
  blockId: string;
  note: string;
  status: CmsChangeRequestStatus;
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

export type CmsBlockDefinition = {
  type: string;
  label: string;
  fields: string[];
  fieldSchema?: Record<string, CmsFieldSchema>;
  category?: 'text' | 'media' | 'design' | 'business' | 'commerce' | 'navigation';
  allowedContentTypes?: CmsContentType[];
};

export type CmsFieldControl =
  | 'text'
  | 'textarea'
  | 'url'
  | 'media'
  | 'select'
  | 'number'
  | 'boolean'
  | 'collection'
  | 'object'
  | 'stringList';

export type CmsFieldSchema = {
  control: CmsFieldControl;
  label?: string;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  itemFields?: string[];
  fields?: string[];
  mediaValue?: 'url' | 'id';
  min?: number;
  max?: number;
  step?: number;
};

export type CmsSiteConfig = {
  siteId: string;
  theme: CmsTheme;
  blocks: CmsBlockDefinition[];
  templates?: string[];
  patternCategories?: string[];
  taxonomies?: string[];
  media: CmsMediaConfig;
  routes: {
    publicBasePath: string;
    adminBasePath: string;
  };
};

export function createCmsSiteConfig(config: CmsSiteConfig): CmsSiteConfig {
  return config;
}

export function normalizeCmsSlug(slug: string): string {
  return slug
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9/_-]+/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export function visibleCmsBlocks(blocks: CmsBlock[] = []): CmsBlock[] {
  return blocks.filter((block) => !block.visibility?.hidden);
}

export function contentIsPublished(content: CmsContent, now = new Date()): boolean {
  const expiresAt = content.publish?.expiresAt ? Date.parse(content.publish.expiresAt) : NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= now.getTime()) return false;
  if (content.status === 'published') return true;
  if (content.status !== 'scheduled') return false;
  const scheduledAt = content.publish?.scheduledAt ? Date.parse(content.publish.scheduledAt) : NaN;
  return Number.isFinite(scheduledAt) && scheduledAt <= now.getTime();
}

export function createCmsRevision(content: CmsContent, createdBy: string, now = new Date().toISOString()): CmsRevision {
  return {
    id: `${content.id}-${Date.parse(now) || Date.now()}`,
    contentId: content.id,
    status: content.status,
    content: structuredClone(content),
    createdAt: now,
    createdBy
  };
}
