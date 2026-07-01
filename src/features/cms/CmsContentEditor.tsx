'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { CmsBlock, CmsBlockDefinition, CmsContent, CmsContentType, CmsFieldSchema, CmsMediaAsset, CmsRevision, CmsSiteConfig } from '../../lib/cms/core.ts';
import { normalizeCmsSlug } from '../../lib/cms/core.ts';
import { createCmsContentTemplate } from '../../lib/cms/default-content.ts';
import { resolveCmsPreviewReferences } from '../../lib/cms/preview-references.ts';
import { CmsRenderer } from './CmsRenderer';

type CmsEditorPage = {
  slug: string;
  title: string;
  content: CmsContent;
};

type CmsContentEditorProps = {
  pages: CmsEditorPage[];
  blocks: CmsBlockDefinition[];
  siteConfig: CmsSiteConfig;
  renderPreview?: (props: CmsEditorPreviewRendererProps) => ReactNode;
};

export type CmsEditorPreviewRendererProps = {
  content: CmsContent;
  siteConfig: CmsSiteConfig;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
};

type EditorState = {
  message: string;
  previewToken: string;
  saving: boolean;
  autosaving: boolean;
  publishing: boolean;
  uploading: boolean;
  loadingMedia: boolean;
  loadingRevisions: boolean;
  loadingRevisionDetail: boolean;
  rollingBack: boolean;
  archiving: boolean;
  duplicating: boolean;
  loadingChangeRequests: boolean;
  submittingChangeRequest: boolean;
  resolvingChangeRequest: boolean;
  importing: boolean;
};

type CmsRecord = Record<string, unknown>;

type RevisionSummary = {
  id: string;
  status: string;
  createdAt: string;
  createdBy: string;
};

type RevisionDetail = CmsRevision;

type ChangeRequestSummary = {
  id: string;
  contentId: string;
  blockId: string;
  note: string;
  status: 'open' | 'resolved';
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

type NewContentState = {
  title: string;
  slug: string;
  contentType: CmsContentType;
};

type ContentLibraryFilters = {
  contentType: 'all' | CmsContentType;
  status: 'all' | CmsContent['status'];
  query: string;
};

const contentTypeOptions: { value: CmsContentType; label: string }[] = [
  { value: 'page', label: 'Page' },
  { value: 'blogPost', label: 'Blog Post' },
  { value: 'productList', label: 'Product List' },
  { value: 'reusableSection', label: 'Reusable Section' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'navigationMenu', label: 'Navigation Menu' },
  { value: 'styleSettings', label: 'Style Settings' },
  { value: 'stripeCatalog', label: 'Stripe Catalog' }
];

const emptyState: EditorState = {
  message: '',
  previewToken: '',
  saving: false,
  autosaving: false,
  publishing: false,
  uploading: false,
  loadingMedia: false,
  loadingRevisions: false,
  loadingRevisionDetail: false,
  rollingBack: false,
  archiving: false,
  duplicating: false,
  loadingChangeRequests: false,
  submittingChangeRequest: false,
  resolvingChangeRequest: false,
  importing: false
};

const statusOptions: { value: ContentLibraryFilters['status']; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

const longTextFields = new Set(['body', 'copy', 'summary', 'description', 'caption', 'answer', 'note', 'address', 'bottom', 'excerpt', 'helpText']);
const mediaFields = new Set(['src', 'poster', 'assetId', 'image', 'videoSrc', 'moduleSrc', 'featuredImage', 'socialImage', 'mapEmbedUrl', 'mapsUrl']);
const objectFields = new Set(['media', 'logo', 'styleTokens']);
const collectionFields = new Set(['buttons', 'links', 'menuItems', 'images', 'items', 'steps', 'faqs', 'testimonials', 'stats', 'cards', 'slides', 'products', 'rates', 'seasonalOverrides', 'addons', 'checkboxes', 'signatureFields', 'localFaq', 'policies', 'tabs', 'sections', 'options', 'depositItems', 'sources', 'reviews', 'craftOptions', 'durationOptions']);

function cloneContent(content: CmsContent): CmsContent {
  return structuredClone(content);
}

function formatContent(content: CmsContent): string {
  return JSON.stringify(content, null, 2);
}

function summarizeRevisionChanges(current: CmsContent, revision: CmsContent): string[] {
  const changes: string[] = [];
  if (current.title !== revision.title) changes.push(`Title: "${revision.title}" -> "${current.title}"`);
  if (current.slug !== revision.slug) changes.push(`Slug: ${revision.slug} -> ${current.slug}`);
  if (current.status !== revision.status) changes.push(`Status: ${revision.status} -> ${current.status}`);
  if ((current.template || '') !== (revision.template || '')) changes.push(`Template: ${revision.template || 'default'} -> ${current.template || 'default'}`);
  if ((current.seo?.title || '') !== (revision.seo?.title || '')) changes.push('SEO title changed.');
  if ((current.seo?.description || '') !== (revision.seo?.description || '')) changes.push('SEO description changed.');

  const currentBlocks = new Map(current.blocks.map((block) => [block.id, block]));
  const revisionBlocks = new Map(revision.blocks.map((block) => [block.id, block]));
  for (const block of revision.blocks) {
    const currentBlock = currentBlocks.get(block.id);
    if (!currentBlock) {
      changes.push(`Removed block: ${block.label || block.type}`);
    } else if (JSON.stringify(currentBlock.props) !== JSON.stringify(block.props) || JSON.stringify(currentBlock.visibility || {}) !== JSON.stringify(block.visibility || {})) {
      changes.push(`Changed block: ${block.label || block.type}`);
    }
  }
  for (const block of current.blocks) {
    if (!revisionBlocks.has(block.id)) changes.push(`Added block: ${block.label || block.type}`);
  }
  return changes.length ? changes.slice(0, 16) : ['No structural differences from the current draft.'];
}

function toRecord(value: unknown): CmsRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as CmsRecord : {};
}

function toArray(value: unknown): CmsRecord[] {
  return Array.isArray(value) ? value.map((item) => toRecord(item)) : [];
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => stringValue(item)) : [];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function csvToList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function createBlock(definition: CmsBlockDefinition | undefined, index: number): CmsBlock {
  const type = definition?.type || 'rich-text';
  return {
    id: `${type}-${Date.now()}-${index}`,
    type,
    label: definition?.label || type,
    props: Object.fromEntries((definition?.fields || ['heading', 'copy']).map((field) => [field, defaultFieldValue(field)]))
  };
}

function defaultFieldValue(field: string): unknown {
  if (collectionFields.has(field)) return [];
  if (objectFields.has(field)) return {};
  return '';
}

function defaultValueForSchema(field: string, schema: CmsFieldSchema | undefined): unknown {
  if (!schema) return defaultFieldValue(field);
  if (schema.control === 'collection') return [];
  if (schema.control === 'object') return {};
  if (schema.control === 'stringList') return [];
  if (schema.control === 'boolean') return false;
  if (schema.control === 'number') return '';
  return '';
}

function defaultCollectionItem(field: string): CmsRecord {
  if (field === 'buttons') return { label: 'Button', href: '#', variant: 'primary', image: '' };
  if (field === 'links') return { label: 'Link', href: '#' };
  if (field === 'menuItems') return { label: 'Menu item', href: '/', children: [] };
  if (field === 'images') return { src: '', alt: '', caption: '' };
  if (field === 'faqs') return { question: 'Question', answer: 'Answer' };
  if (field === 'steps') return { title: 'Step', copy: '' };
  if (field === 'testimonials') return { name: 'Customer', copy: '' };
  if (field === 'stats') return { value: '', label: '' };
  if (field === 'slides') return { heading: '', copy: '', image: '' };
  if (field === 'products') return { productKey: '', label: 'Product', displayPrice: '', stripeProductId: '', stripePriceId: '', stripeLookupKey: '', checkoutMode: 'deposit', active: true };
  if (field === 'rates') return { craftKey: 'rental-option', durationHours: 2, baseRateCents: 0, totalCents: 0, depositCents: 0, processingFeeCents: 0, includedItems: [] };
  if (field === 'seasonalOverrides') return { offerKey: 'seasonal-offer', startsAt: '', endsAt: '', eligibleCraft: [], allowedDurations: [], headline: '', body: '', status: 'draft' };
  if (field === 'addons') return { addonKey: 'addon', label: 'Add-on', description: '', priceCents: 0, priceLabel: '', appliesToCraft: [], active: true };
  if (field === 'checkboxes') return { id: 'agreement', label: 'Agreement text', required: true };
  if (field === 'signatureFields') return { id: 'signature', label: 'Signature', required: true };
  if (field === 'localFaq') return { question: 'Question', answer: 'Answer' };
  if (field === 'policies') return { policyKey: 'policy', title: 'Policy', summary: '', body: '', severity: 'standard', effectiveDate: '' };
  if (field === 'tabs') return { id: 'rental', label: 'Rental', active: false, sections: [], includes: [], submitLabel: 'Book Now', note: '' };
  if (field === 'sections') return { label: 'Section', groupId: '', dataKey: 'hours', options: [] };
  if (field === 'options') return { value: '', label: 'Option', subLabel: '', selected: false };
  if (field === 'depositItems') return { label: 'Due today', value: '$55' };
  if (field === 'craftOptions') return { craftKey: 'rental-option', label: 'Rental Option', sublabel: '' };
  if (field === 'durationOptions') return { hours: '4', label: '4 Hours', rateLabel: '', badge: '' };
  if (field === 'sources') return { label: 'Google', href: '' };
  if (field === 'reviews') return { author: 'Customer', initials: '', rating: '5', source: 'Google', sourceUrl: '', date: '', verified: true, body: '' };
  return { title: 'Item', copy: '', image: '', href: '' };
}

function itemFields(field: string, item: CmsRecord, schema?: CmsFieldSchema): string[] {
  if (schema?.itemFields?.length) return Array.from(new Set([...schema.itemFields, ...Object.keys(item)]));
  const preferred: Record<string, string[]> = {
    buttons: ['label', 'href', 'variant', 'image'],
    links: ['label', 'href'],
    menuItems: ['label', 'href', 'children'],
    images: ['src', 'alt', 'caption'],
    faqs: ['question', 'answer'],
    steps: ['title', 'copy'],
    testimonials: ['name', 'copy', 'role', 'image'],
    stats: ['value', 'label'],
    slides: ['heading', 'copy', 'image', 'href'],
    items: ['title', 'copy', 'price', 'rateNote', 'href', 'image'],
    products: ['productKey', 'label', 'displayName', 'displayPrice', 'amountCents', 'currency', 'kind', 'stripeProductId', 'stripePriceId', 'stripeLookupKey', 'metadataTemplate', 'checkoutMode', 'checkoutRole', 'required', 'active', 'displayOnly', 'sortOrder'],
    rates: ['craftKey', 'durationHours', 'baseRateCents', 'totalCents', 'depositCents', 'processingFeeCents', 'damageDepositCents', 'includedItems', 'bookingQueryParams'],
    seasonalOverrides: ['offerKey', 'startsAt', 'endsAt', 'eligibleDates', 'eligibleCraft', 'allowedDurations', 'headline', 'body', 'ctaHrefTemplate', 'priority', 'status'],
    addons: ['addonKey', 'id', 'label', 'description', 'priceCents', 'priceLabel', 'appliesToCraft', 'requiresDurationMin', 'inventoryLimited', 'checkoutLineItemKey', 'image'],
    checkboxes: ['id', 'label', 'required'],
    signatureFields: ['id', 'label', 'required'],
    localFaq: ['question', 'answer'],
    policies: ['policyKey', 'title', 'summary', 'body', 'severity', 'appliesTo', 'refundEligible', 'customerAction', 'effectiveDate'],
    tabs: ['id', 'label', 'active', 'sections', 'includes', 'submitLabel', 'note'],
    sections: ['label', 'groupId', 'dataKey', 'options'],
    options: ['value', 'label', 'subLabel', 'selected'],
    depositItems: ['label', 'value'],
    craftOptions: ['craftKey', 'label', 'sublabel'],
    durationOptions: ['hours', 'label', 'rateLabel', 'badge'],
    sources: ['label', 'href'],
    reviews: ['author', 'initials', 'rating', 'source', 'sourceUrl', 'date', 'verified', 'body']
  };
  return Array.from(new Set([...(preferred[field] || []), ...Object.keys(item)]));
}

function itemFieldSchema(_parentSchema: CmsFieldSchema | undefined, field: string): CmsFieldSchema | undefined {
  return sharedFallbackFieldSchema(field);
}

function sharedFallbackFieldSchema(field: string): CmsFieldSchema | undefined {
  if (mediaFields.has(field)) return { control: 'media', mediaValue: field === 'assetId' ? 'id' : 'url' };
  if (field === 'href' || field.endsWith('Url') || field.endsWith('Href') || field === 'bookingPath' || field === 'sourceUrl') return { control: 'url' };
  if (longTextFields.has(field)) return { control: 'textarea' };
  if (field === 'variant') {
    return {
      control: 'select',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'link', label: 'Link' }
      ]
    };
  }
  if (['active', 'verified', 'editableAmounts'].includes(field)) return { control: 'boolean' };
  if (['sortOrder', 'hours', 'durationHours', 'rating', 'score'].includes(field)) return { control: 'number' };
  return undefined;
}

function mergedFieldSchema(field: string, schema: CmsFieldSchema | undefined): CmsFieldSchema | undefined {
  return schema || sharedFallbackFieldSchema(field);
}

function mergeContentPages(current: CmsEditorPage[], records: CmsContent[]): CmsEditorPage[] {
  const bySlug = new Map(current.map((page) => [page.slug, page]));
  for (const content of records) {
    bySlug.set(content.slug, { slug: content.slug, title: content.title, content });
  }
  return Array.from(bySlug.values()).sort((left, right) => left.slug.localeCompare(right.slug));
}

function contentMatchesFilters(content: CmsContent, filters: ContentLibraryFilters): boolean {
  if (filters.contentType !== 'all' && content.contentType !== filters.contentType) return false;
  if (filters.status !== 'all' && content.status !== filters.status) return false;
  const query = filters.query.trim().toLowerCase();
  if (!query) return true;
  return [
    content.title,
    content.slug,
    content.contentType,
    content.status,
    content.metadata?.excerpt || '',
    ...(content.taxonomies?.categories || []),
    ...(content.taxonomies?.tags || [])
  ].join(' ').toLowerCase().includes(query);
}

function contentTypeLabel(contentType: CmsContentType): string {
  return contentTypeOptions.find((option) => option.value === contentType)?.label || labelFor(contentType);
}

function typeAllowedForContent(block: CmsBlockDefinition, contentType: CmsContentType): boolean {
  return !block.allowedContentTypes?.length || block.allowedContentTypes.includes(contentType);
}

function groupBlocksByCategory(blocks: CmsBlockDefinition[]): { category: string; blocks: CmsBlockDefinition[] }[] {
  const groups = new Map<string, CmsBlockDefinition[]>();
  for (const block of blocks) {
    const category = block.category || 'other';
    groups.set(category, [...(groups.get(category) || []), block]);
  }
  return Array.from(groups.entries()).map(([category, groupedBlocks]) => ({ category, blocks: groupedBlocks }));
}

function publicHrefForContent(content: CmsContent): string {
  if (content.contentType === 'blogPost') return `/blog/${content.slug}`;
  if (content.contentType === 'productList') return content.slug === 'products' ? '/products' : `/products/${content.slug}`;
  if (content.contentType !== 'page') return '';
  return content.slug === 'home' ? '/' : `/${content.slug}`;
}

function formatContentDate(value: string | undefined): string {
  if (!value) return 'Not saved';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function createLocalDuplicate(content: CmsContent, existingSlugs: string[]): CmsContent {
  const now = new Date().toISOString();
  const slug = nextLocalCopySlug(content.slug, existingSlugs);
  return {
    ...structuredClone(content),
    id: `${content.id}-copy-${Date.now()}`,
    slug,
    title: `${content.title} Copy`,
    status: 'draft',
    publishedAt: undefined,
    publishedRevisionId: undefined,
    draftRevisionId: undefined,
    createdAt: now,
    updatedAt: now
  };
}

function nextLocalCopySlug(slug: string, existingSlugs: string[]): string {
  const taken = new Set(existingSlugs);
  const base = `${slug}-copy`;
  if (!taken.has(base)) return base;
  for (let index = 2; index <= 100; index += 1) {
    const candidate = `${base}-${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function CmsContentEditor({ pages, blocks, siteConfig, renderPreview }: CmsContentEditorProps) {
  const [contentPages, setContentPages] = useState<CmsEditorPage[]>(() => pages.map((page) => ({ ...page, content: cloneContent(page.content) })));
  const [selectedSlug, setSelectedSlug] = useState(contentPages[0]?.slug || '');
  const selectedPage = useMemo(
    () => contentPages.find((page) => page.slug === selectedSlug) || contentPages[0],
    [contentPages, selectedSlug]
  );
  const [drafts, setDrafts] = useState<Record<string, CmsContent>>(
    () => Object.fromEntries(contentPages.map((page) => [page.slug, cloneContent(page.content)]))
  );
  const [advancedJson, setAdvancedJson] = useState<Record<string, string>>(
    () => Object.fromEntries(contentPages.map((page) => [page.slug, formatContent(page.content)]))
  );
  const [savedSnapshots, setSavedSnapshots] = useState<Record<string, string>>(
    () => Object.fromEntries(contentPages.map((page) => [page.slug, formatContent(page.content)]))
  );
  const [revisions, setRevisions] = useState<Record<string, RevisionSummary[]>>({});
  const [revisionDetails, setRevisionDetails] = useState<Record<string, RevisionDetail>>({});
  const [changeRequests, setChangeRequests] = useState<Record<string, ChangeRequestSummary[]>>({});
  const [mediaAssets, setMediaAssets] = useState<CmsMediaAsset[]>([]);
  const [blockSearch, setBlockSearch] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [newContent, setNewContent] = useState<NewContentState>({
    title: '',
    slug: '',
    contentType: 'page'
  });
  const [libraryFilters, setLibraryFilters] = useState<ContentLibraryFilters>({
    contentType: 'all',
    status: 'all',
    query: ''
  });
  const [importManifest, setImportManifest] = useState('');
  const [state, setState] = useState<EditorState>(emptyState);

  if (!selectedPage) {
    return (
      <section className="cms-panel cms-editor">
        <h2>No editable pages configured</h2>
        <p>Add a site adapter page registry to expose structured CMS content.</p>
      </section>
    );
  }

  const draft = drafts[selectedPage.slug] || cloneContent(selectedPage.content);
  const jsonText = advancedJson[selectedPage.slug] || formatContent(draft);
  const draftSnapshot = formatContent(draft);
  const hasUnsavedChanges = savedSnapshots[selectedPage.slug] !== draftSnapshot;
  const pageRevisions = revisions[draft.id] || [];
  const revisionDetail = revisionDetails[draft.id];
  const pageChangeRequests = changeRequests[draft.id] || [];
  const selectedBlock = draft.blocks.find((block) => block.id === selectedBlockId);
  const previewHref = state.previewToken ? `/preview/${state.previewToken}/${draft.slug}` : '';
  const reusableContent = contentPages
    .filter((page) => ['pattern', 'reusableSection', 'navigationMenu', 'styleSettings', 'stripeCatalog'].includes(page.content.contentType))
    .filter((page) => page.slug !== selectedPage.slug);
  const previewContent = useMemo(
    () => resolveCmsPreviewReferences(draft, Object.values(drafts).filter((content) => content.slug !== draft.slug)),
    [draft, drafts]
  );
  const libraryPages = contentPages.filter((page) => contentMatchesFilters(page.content, libraryFilters));
  const allowedBlocks = blocks.filter((block) => typeAllowedForContent(block, draft.contentType));
  const filteredBlocks = allowedBlocks.filter((block) => {
    const query = blockSearch.trim().toLowerCase();
    return !query || `${block.label} ${block.type} ${block.category || ''} ${block.fields.join(' ')}`.toLowerCase().includes(query);
  });
  const blockInserterGroups = groupBlocksByCategory(filteredBlocks);

  function createContent() {
    const title = newContent.title.trim() || 'Untitled';
    const slug = normalizeCmsSlug(newContent.slug || title);
    if (!slug) {
      setState((current) => ({ ...current, message: 'A slug is required before creating content.' }));
      return;
    }
    if (contentPages.some((page) => page.slug === slug)) {
      setState((current) => ({ ...current, message: 'That slug already exists in the editor.' }));
      return;
    }
    const content = createCmsContentTemplate({
      siteId: siteConfig.siteId,
      contentType: newContent.contentType,
      title,
      slug,
      blockDefinitions: blocks
    });
    const page = { slug: content.slug, title: content.title, content };
    setContentPages((current) => [...current, page]);
    setDrafts((current) => ({ ...current, [content.slug]: cloneContent(content) }));
    setAdvancedJson((current) => ({ ...current, [content.slug]: formatContent(content) }));
    setSavedSnapshots((current) => ({ ...current, [content.slug]: formatContent(content) }));
    setSelectedSlug(content.slug);
    setNewContent({ title: '', slug: '', contentType: 'page' });
    setState((current) => ({ ...current, message: 'New CMS content created as a local draft. Save it before preview or publish.' }));
  }

  async function loadContentLibrary() {
    const params = new URLSearchParams();
    if (libraryFilters.contentType !== 'all') params.set('contentType', libraryFilters.contentType);
    if (libraryFilters.status !== 'all') params.set('status', libraryFilters.status);
    if (libraryFilters.query.trim()) params.set('q', libraryFilters.query.trim());
    params.set('limit', '200');
    setState((current) => ({ ...current, message: 'Refreshing content library...' }));
    const response = await fetch(`/api/cms/admin/content?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, message: String(payload.error || 'Content library failed to load.') }));
      return;
    }
    const records = Array.isArray(payload.content) ? payload.content as CmsContent[] : [];
    if (!records.length) {
      setState((current) => ({ ...current, message: 'No saved CMS records matched those filters. Checked-in fallback content is still listed locally.' }));
      return;
    }
    setContentPages((current) => mergeContentPages(current, records));
    setDrafts((current) => ({ ...current, ...Object.fromEntries(records.map((content) => [content.slug, cloneContent(content)])) }));
    setAdvancedJson((current) => ({ ...current, ...Object.fromEntries(records.map((content) => [content.slug, formatContent(content)])) }));
    setSavedSnapshots((current) => ({ ...current, ...Object.fromEntries(records.map((content) => [content.slug, formatContent(content)])) }));
    setState((current) => ({ ...current, message: `Loaded ${records.length} saved CMS record${records.length === 1 ? '' : 's'}.` }));
  }

  useEffect(() => {
    function warnAboutUnsavedChanges(event: BeforeUnloadEvent) {
      const hasDirtyDraft = Object.entries(drafts).some(([slug, content]) => savedSnapshots[slug] !== formatContent(content));
      if (!hasDirtyDraft) return;
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnAboutUnsavedChanges);
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges);
  }, [drafts, savedSnapshots]);

  useEffect(() => {
    if (!hasUnsavedChanges || state.saving || state.autosaving || state.publishing || state.rollingBack) return;
    const contentToSave = cloneContent(draft);
    const slugKey = selectedPage.slug;
    const timer = window.setTimeout(() => {
      void autosaveDraft(contentToSave, slugKey);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [draftSnapshot, hasUnsavedChanges, selectedPage.slug, state.autosaving, state.publishing, state.rollingBack, state.saving]);

  function updateDraft(updater: (content: CmsContent) => CmsContent) {
    setDrafts((current) => {
      const next = updater(cloneContent(current[selectedPage.slug] || selectedPage.content));
      setAdvancedJson((jsonCurrent) => ({ ...jsonCurrent, [selectedPage.slug]: formatContent(next) }));
      return { ...current, [selectedPage.slug]: next };
    });
  }

  function updateBlock(blockIndex: number, updater: (block: CmsBlock) => CmsBlock) {
    updateDraft((content) => {
      const blocksNext = content.blocks.map((block, index) => index === blockIndex ? updater(block) : block);
      return { ...content, blocks: blocksNext, updatedAt: new Date().toISOString() };
    });
  }

  function updateBlockProp(blockIndex: number, field: string, value: unknown) {
    updateBlock(blockIndex, (block) => ({ ...block, props: { ...block.props, [field]: value } }));
  }

  function selectBlock(blockId: string) {
    setSelectedBlockId(blockId);
    requestAnimationFrame(() => {
      document.getElementById(`cms-block-editor-${blockId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  function addBlock(type: string) {
    const definition = allowedBlocks.find((block) => block.type === type);
    if (!definition) {
      setState((current) => ({ ...current, message: 'That block is not available for this content type.' }));
      return;
    }
    updateDraft((content) => ({
      ...content,
      blocks: [...content.blocks, createBlock(definition, content.blocks.length + 1)],
      updatedAt: new Date().toISOString()
    }));
  }

  function insertReusableContent(slug: string) {
    const source = contentPages.find((page) => page.slug === slug)?.content;
    if (!source) return;
    if (source.contentType === 'pattern') {
      updateDraft((content) => ({
        ...content,
        blocks: [
          ...content.blocks,
          {
            id: `pattern-ref-${Date.now()}-${content.blocks.length + 1}`,
            type: 'pattern-ref',
            label: source.title,
            props: {
              patternId: source.slug,
              mode: 'synced'
            }
          }
        ],
        updatedAt: new Date().toISOString()
      }));
      setState((current) => ({ ...current, message: `Inserted synced pattern reference for ${source.title}.` }));
      return;
    }
    updateDraft((content) => ({
      ...content,
      blocks: [
        ...content.blocks,
        ...source.blocks.map((block, index) => ({
          ...structuredClone(block),
          id: `${block.id}-copy-${Date.now()}-${index}`
        }))
      ],
      updatedAt: new Date().toISOString()
    }));
    setState((current) => ({ ...current, message: `Inserted ${source.title} into this draft.` }));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    updateDraft((content) => {
      const target = index + direction;
      if (target < 0 || target >= content.blocks.length) return content;
      const blocksNext = [...content.blocks];
      const [block] = blocksNext.splice(index, 1);
      if (!block) return content;
      blocksNext.splice(target, 0, block);
      return { ...content, blocks: blocksNext, updatedAt: new Date().toISOString() };
    });
  }

  function removeBlock(index: number) {
    updateDraft((content) => ({
      ...content,
      blocks: content.blocks.filter((_, blockIndex) => blockIndex !== index),
      updatedAt: new Date().toISOString()
    }));
  }

  function applyAdvancedJson() {
    const parsed = parseDraft(jsonText);
    if (!parsed) {
      setState((current) => ({ ...current, message: 'CMS content JSON is invalid.' }));
      return;
    }
    setDrafts((current) => ({ ...current, [selectedPage.slug]: parsed }));
    setAdvancedJson((current) => ({ ...current, [selectedPage.slug]: formatContent(parsed) }));
    setState((current) => ({ ...current, message: 'Advanced JSON applied to the structured editor.' }));
  }

  async function saveDraft() {
    setState((current) => ({ ...current, saving: true, message: 'Saving draft...' }));
    const response = await fetch('/api/cms/admin/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify({ content: draft })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, saving: false, message: String(payload.error || 'Draft save failed.') }));
      return;
    }
    const saved = payload.content as CmsContent;
    setContentPages((current) => mergeContentPages(current, [saved]));
    setDrafts((current) => ({ ...current, [selectedPage.slug]: cloneContent(saved) }));
    setAdvancedJson((current) => ({ ...current, [selectedPage.slug]: formatContent(saved) }));
    setSavedSnapshots((current) => ({ ...current, [selectedPage.slug]: formatContent(saved) }));
    setState((current) => ({
      ...current,
      saving: false,
      previewToken: String(payload.previewToken || ''),
      message: 'Draft saved. Preview is ready.'
    }));
  }

  async function autosaveDraft(contentToSave: CmsContent, slugKey: string) {
    setState((current) => ({ ...current, autosaving: true, message: 'Autosaving draft...' }));
    const response = await fetch('/api/cms/admin/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify({ content: contentToSave })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, autosaving: false, message: String(payload.error || 'Autosave failed. Manual save is still available.') }));
      return;
    }
    const saved = payload.content as CmsContent;
    setContentPages((current) => mergeContentPages(current, [saved]));
    setDrafts((current) => ({ ...current, [slugKey]: cloneContent(saved) }));
    setAdvancedJson((current) => ({ ...current, [slugKey]: formatContent(saved) }));
    setSavedSnapshots((current) => ({ ...current, [slugKey]: formatContent(saved) }));
    setState((current) => ({
      ...current,
      autosaving: false,
      previewToken: String(payload.previewToken || current.previewToken),
      message: 'Autosaved draft. Preview is ready.'
    }));
  }

  async function publishDraft() {
    setState((current) => ({ ...current, publishing: true, message: 'Publishing content...' }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(draft.id)}/publish`, {
      method: 'POST',
      headers: { 'x-cms-request': '1' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, publishing: false, message: String(payload.error || 'Publish failed.') }));
      return;
    }
    const published = payload.content as CmsContent;
    setContentPages((current) => mergeContentPages(current, [published]));
    setDrafts((current) => ({ ...current, [selectedPage.slug]: cloneContent(published) }));
    setAdvancedJson((current) => ({ ...current, [selectedPage.slug]: formatContent(published) }));
    setSavedSnapshots((current) => ({ ...current, [selectedPage.slug]: formatContent(published) }));
    setState((current) => ({ ...current, publishing: false, message: 'Published content is live on the public site.' }));
  }

  async function loadRevisions() {
    setState((current) => ({ ...current, loadingRevisions: true, message: 'Loading revisions...' }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(draft.id)}/revisions?limit=20`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, loadingRevisions: false, message: String(payload.error || 'Revision history failed to load.') }));
      return;
    }
    setRevisions((current) => ({ ...current, [draft.id]: Array.isArray(payload.revisions) ? payload.revisions : [] }));
    setState((current) => ({ ...current, loadingRevisions: false, message: 'Revision history loaded.' }));
  }

  async function loadRevisionDetail(revisionId: string) {
    setState((current) => ({ ...current, loadingRevisionDetail: true, message: 'Loading revision compare...' }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(draft.id)}/revisions/${encodeURIComponent(revisionId)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, loadingRevisionDetail: false, message: String(payload.error || 'Revision detail failed to load.') }));
      return;
    }
    const revision = payload.revision as RevisionDetail;
    setRevisionDetails((current) => ({ ...current, [draft.id]: revision }));
    setState((current) => ({ ...current, loadingRevisionDetail: false, message: 'Revision compare loaded.' }));
  }

  async function rollbackToRevision(revisionId: string) {
    setState((current) => ({ ...current, rollingBack: true, message: 'Rolling back to revision...' }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(draft.id)}/rollback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify({ revisionId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, rollingBack: false, message: String(payload.error || 'Rollback failed.') }));
      return;
    }
    const rolledBack = payload.content as CmsContent;
    setContentPages((current) => mergeContentPages(current, [rolledBack]));
    setDrafts((current) => ({ ...current, [selectedPage.slug]: cloneContent(rolledBack) }));
    setAdvancedJson((current) => ({ ...current, [selectedPage.slug]: formatContent(rolledBack) }));
    setSavedSnapshots((current) => ({ ...current, [selectedPage.slug]: formatContent(rolledBack) }));
    setState((current) => ({ ...current, rollingBack: false, message: 'Revision restored as a draft. Preview and publish when ready.' }));
  }

  async function loadReviewRequests() {
    setState((current) => ({ ...current, loadingChangeRequests: true, message: 'Loading review requests...' }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(draft.id)}/change-requests`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, loadingChangeRequests: false, message: String(payload.error || 'Review requests failed to load.') }));
      return;
    }
    setChangeRequests((current) => ({ ...current, [draft.id]: Array.isArray(payload.requests) ? payload.requests : [] }));
    setState((current) => ({ ...current, loadingChangeRequests: false, message: 'Review requests loaded.' }));
  }

  async function submitReviewRequest() {
    if (!selectedBlockId || !reviewNote.trim()) {
      setState((current) => ({ ...current, message: 'Select a block and enter a note before requesting a change.' }));
      return;
    }
    setState((current) => ({ ...current, submittingChangeRequest: true, message: 'Submitting review request...' }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(draft.id)}/change-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify({ blockId: selectedBlockId, note: reviewNote })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, submittingChangeRequest: false, message: String(payload.error || 'Review request failed.') }));
      return;
    }
    const requestRecord = payload.request as ChangeRequestSummary;
    setChangeRequests((current) => ({
      ...current,
      [draft.id]: [requestRecord, ...(current[draft.id] || []).filter((item) => item.id !== requestRecord.id)]
    }));
    setReviewNote('');
    setState((current) => ({ ...current, submittingChangeRequest: false, message: 'Review request saved for this block.' }));
  }

  async function resolveReviewRequest(requestId: string) {
    setState((current) => ({ ...current, resolvingChangeRequest: true, message: 'Resolving review request...' }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(draft.id)}/change-requests/${encodeURIComponent(requestId)}/resolve`, {
      method: 'POST',
      headers: { 'x-cms-request': '1' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, resolvingChangeRequest: false, message: String(payload.error || 'Review request could not be resolved.') }));
      return;
    }
    const resolved = payload.request as ChangeRequestSummary;
    setChangeRequests((current) => ({
      ...current,
      [draft.id]: (current[draft.id] || []).map((item) => item.id === resolved.id ? resolved : item)
    }));
    setState((current) => ({ ...current, resolvingChangeRequest: false, message: 'Review request resolved.' }));
  }

  async function archiveContent(page: CmsEditorPage) {
    const sourceContent = drafts[page.slug] || page.content;
    setState((current) => ({ ...current, archiving: true, message: `Archiving ${sourceContent.title}...` }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(sourceContent.id)}/archive`, {
      method: 'POST',
      headers: { 'x-cms-request': '1' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, archiving: false, message: String(payload.error || 'Archive failed. Save checked-in fallback content before archiving it.') }));
      return;
    }
    const archived = payload.content as CmsContent;
    setContentPages((current) => mergeContentPages(current, [archived]));
    setDrafts((current) => ({ ...current, [archived.slug]: cloneContent(archived) }));
    setAdvancedJson((current) => ({ ...current, [archived.slug]: formatContent(archived) }));
    setSavedSnapshots((current) => ({ ...current, [archived.slug]: formatContent(archived) }));
    setSelectedSlug(archived.slug);
    setState((current) => ({ ...current, archiving: false, message: 'Content archived and removed from public publishing.' }));
  }

  async function duplicateContent(page: CmsEditorPage) {
    const sourceContent = drafts[page.slug] || page.content;
    setState((current) => ({ ...current, duplicating: true, message: `Duplicating ${sourceContent.title}...` }));
    const response = await fetch(`/api/cms/admin/content/${encodeURIComponent(sourceContent.id)}/duplicate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify({})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 404) {
      setState((current) => ({ ...current, duplicating: false, message: String(payload.error || 'Duplicate failed.') }));
      return;
    }
    const duplicate = response.ok
      ? payload.content as CmsContent
      : createLocalDuplicate(sourceContent, contentPages.map((contentPage) => contentPage.slug));
    setContentPages((current) => mergeContentPages(current, [duplicate]));
    setDrafts((current) => ({ ...current, [duplicate.slug]: cloneContent(duplicate) }));
    setAdvancedJson((current) => ({ ...current, [duplicate.slug]: formatContent(duplicate) }));
    setSavedSnapshots((current) => ({ ...current, [duplicate.slug]: response.ok ? formatContent(duplicate) : '' }));
    setSelectedSlug(duplicate.slug);
    setState((current) => ({
      ...current,
      duplicating: false,
      previewToken: response.ok ? String(payload.previewToken || '') : current.previewToken,
      message: response.ok ? 'Content duplicated as a saved draft.' : 'Checked-in fallback content duplicated locally. Save the draft before preview or publish.'
    }));
  }

  async function importCmsManifest(dryRun: boolean) {
    let manifest: unknown;
    try {
      manifest = JSON.parse(importManifest);
    } catch {
      setState((current) => ({ ...current, message: 'Paste a valid CMS export JSON manifest before importing.' }));
      return;
    }
    setState((current) => ({ ...current, importing: true, message: dryRun ? 'Checking import manifest...' : 'Importing content as drafts...' }));
    const response = await fetch('/api/cms/admin/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify({ dryRun, manifest })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errors = Array.isArray(payload.errors) ? payload.errors.join(' ') : String(payload.error || 'Import failed.');
      setState((current) => ({ ...current, importing: false, message: errors }));
      return;
    }
    if (dryRun) {
      const plan = payload.plan as { content?: unknown[]; media?: unknown[]; warnings?: string[] } | undefined;
      const count = Array.isArray(plan?.content) ? plan.content.length : 0;
      const mediaCount = Array.isArray(plan?.media) ? plan.media.length : 0;
      const warning = Array.isArray(plan?.warnings) && plan.warnings.length ? ` ${plan.warnings[0]}` : '';
      setState((current) => ({ ...current, importing: false, message: `Import check passed for ${count} content records and ${mediaCount} media records.${warning}` }));
      return;
    }
    const imported = Array.isArray(payload.imported) ? payload.imported as CmsContent[] : [];
    setContentPages((current) => mergeContentPages(current, imported));
    setDrafts((current) => ({ ...current, ...Object.fromEntries(imported.map((content) => [content.slug, cloneContent(content)])) }));
    setAdvancedJson((current) => ({ ...current, ...Object.fromEntries(imported.map((content) => [content.slug, formatContent(content)])) }));
    setSavedSnapshots((current) => ({ ...current, ...Object.fromEntries(imported.map((content) => [content.slug, formatContent(content)])) }));
    if (imported[0]) setSelectedSlug(imported[0].slug);
    setState((current) => ({ ...current, importing: false, message: `Imported ${imported.length} records as drafts.` }));
  }

  async function uploadMedia(file: File | undefined) {
    if (!file) return;
    setState((current) => ({ ...current, uploading: true, message: 'Uploading media...' }));
    const response = await fetch('/api/cms/admin/media/upload', {
      method: 'POST',
      headers: { 'content-type': file.type || 'application/octet-stream', 'x-cms-request': '1' },
      body: file
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, uploading: false, message: String(payload.error || 'Media upload failed.') }));
      return;
    }
    const asset = payload.asset as CmsMediaAsset | undefined;
    if (asset) setMediaAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    setState((current) => ({ ...current, uploading: false, message: `Media uploaded: ${asset?.key || 'asset saved'}` }));
  }

  async function loadMediaAssets() {
    setState((current) => ({ ...current, loadingMedia: true, message: 'Loading media library...' }));
    const response = await fetch('/api/cms/admin/media?limit=50');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, loadingMedia: false, message: String(payload.error || 'Media library failed to load.') }));
      return;
    }
    setMediaAssets(Array.isArray(payload.assets) ? payload.assets : []);
    setState((current) => ({ ...current, loadingMedia: false, message: 'Media library loaded.' }));
  }

  return (
    <section className="cms-editor">
      <div className="cms-editor-toolbar">
        <label>
          Page
          <select value={selectedPage.slug} onChange={(event) => setSelectedSlug(event.target.value)}>
            {contentPages.map((page) => (
              <option key={page.slug} value={page.slug}>{page.title}</option>
            ))}
          </select>
        </label>
        <label>
          Find block
          <input value={blockSearch} placeholder="Search blocks or patterns" onChange={(event) => setBlockSearch(event.target.value)} />
        </label>
        <div className="cms-block-inserter" aria-label="Block Inserter">
          <div className="cms-kicker">Block Inserter</div>
          <strong>Add block</strong>
          {blockInserterGroups.map((group) => (
            <div className="cms-block-inserter-group" key={group.category}>
              <strong>{labelFor(group.category)}</strong>
              <div className="cms-block-inserter-actions">
                {group.blocks.map((block) => (
                  <button type="button" className="cms-secondary-action" onClick={() => addBlock(block.type)} key={block.type}>
                    {block.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!blockInserterGroups.length ? <p className="cms-editor-note">No blocks available for this content type.</p> : null}
        </div>
        <label>
          Insert pattern
          <select defaultValue="" onChange={(event) => {
            if (!event.target.value) return;
            insertReusableContent(event.target.value);
            event.target.value = '';
          }}>
            <option value="" disabled>Choose reusable content</option>
            {reusableContent.map((page) => (
              <option key={page.slug} value={page.slug}>{page.content.contentType} · {page.title}</option>
            ))}
          </select>
        </label>
        <div className="cms-editor-actions">
          <button type="button" onClick={saveDraft} disabled={state.saving}>
            {state.saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" onClick={publishDraft} disabled={state.publishing}>
            {state.publishing ? 'Publishing...' : 'Publish'}
          </button>
          <button type="button" onClick={loadRevisions} disabled={state.loadingRevisions}>
            {state.loadingRevisions ? 'Loading...' : 'Revisions'}
          </button>
          {previewHref ? <a href={previewHref} target="_blank" rel="noreferrer">Preview</a> : null}
          <span className="cms-save-state" data-cms-dirty={hasUnsavedChanges ? 'true' : 'false'}>
            {state.autosaving ? 'Autosaving...' : hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
          </span>
        </div>
      </div>

      <div className="cms-panel cms-content-library">
        <div className="cms-content-library-head">
          <div>
            <div className="cms-kicker">Content Library</div>
            <h2>All pages, posts, products, and reusable records</h2>
          </div>
          <button type="button" className="cms-secondary-action" onClick={() => void loadContentLibrary()}>
            Refresh saved records
          </button>
        </div>
        <div className="cms-content-library-filters">
          <label>
            Type
            <select
              value={libraryFilters.contentType}
              onChange={(event) => setLibraryFilters((current) => ({ ...current, contentType: event.target.value as ContentLibraryFilters['contentType'] }))}
            >
              <option value="all">All Types</option>
              {contentTypeOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={libraryFilters.status}
              onChange={(event) => setLibraryFilters((current) => ({ ...current, status: event.target.value as ContentLibraryFilters['status'] }))}
            >
              {statusOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Search
            <input
              value={libraryFilters.query}
              placeholder="Search title, slug, tags"
              onChange={(event) => setLibraryFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </label>
        </div>
        <div className="cms-content-list" role="list">
          {libraryPages.map((page) => {
            const publicHref = publicHrefForContent(page.content);
            const isSelected = page.slug === selectedPage.slug;
            return (
              <article className="cms-content-row" role="listitem" data-cms-selected={isSelected ? 'true' : 'false'} key={page.slug}>
                <div>
                  <strong>{page.title}</strong>
                  <span>{page.slug}</span>
                </div>
                <div className="cms-content-row-meta">
                  <span>{contentTypeLabel(page.content.contentType)}</span>
                  <span>{page.content.status}</span>
                  <span>Updated {formatContentDate(page.content.updatedAt)}</span>
                </div>
                <div className="cms-content-row-actions">
                  <button type="button" onClick={() => setSelectedSlug(page.slug)}>{isSelected ? 'Open' : 'Edit'}</button>
                  <button type="button" onClick={() => void duplicateContent(page)} disabled={state.duplicating}>Duplicate</button>
                  <button type="button" onClick={() => void archiveContent(page)} disabled={state.archiving || page.content.status === 'archived'}>Archive</button>
                  {isSelected && previewHref ? <a href={previewHref} target="_blank" rel="noreferrer">Preview</a> : null}
                  {publicHref ? <a href={publicHref} target="_blank" rel="noreferrer">Public</a> : null}
                </div>
              </article>
            );
          })}
          {!libraryPages.length ? (
            <p className="cms-editor-note">No content matches the current filters.</p>
          ) : null}
        </div>
      </div>

      <div className="cms-panel cms-create-content">
        <div>
          <div className="cms-kicker">Create Content</div>
          <h2>New page, blog, product list, or section</h2>
        </div>
        <label>
          Type
          <select value={newContent.contentType} onChange={(event) => setNewContent((current) => ({ ...current, contentType: event.target.value as CmsContentType }))}>
            {contentTypeOptions.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input value={newContent.title} onChange={(event) => setNewContent((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label>
          Slug
          <input value={newContent.slug} placeholder={normalizeCmsSlug(newContent.title || 'new-content')} onChange={(event) => setNewContent((current) => ({ ...current, slug: event.target.value }))} />
        </label>
        <button type="button" onClick={createContent}>Create Draft</button>
      </div>

      <div className="cms-panel cms-import-content" id="import">
        <div>
          <div className="cms-kicker">Import</div>
          <h2>Import CMS export manifest</h2>
        </div>
        <label>
          Export JSON
          <textarea
            value={importManifest}
            placeholder="Paste an embedded CMS export manifest"
            onChange={(event) => setImportManifest(event.target.value)}
          />
        </label>
        <div className="cms-content-row-actions">
          <button type="button" onClick={() => void importCmsManifest(true)} disabled={state.importing}>
            {state.importing ? 'Checking...' : 'Dry Run Import'}
          </button>
          <button type="button" onClick={() => void importCmsManifest(false)} disabled={state.importing}>
            Import as Drafts
          </button>
        </div>
        <p className="cms-editor-note">Imported content is validated against this site adapter and saved as drafts before publishing.</p>
      </div>

      <div className="cms-editor-layout">
        <div className="cms-panel cms-structured-editor">
          <div className="cms-kicker">Structured Content</div>
          <h2>{selectedPage.title}</h2>
          <div className="cms-page-fields">
            <label>
              Page title
              <input value={draft.title} onChange={(event) => updateDraft((content) => ({ ...content, title: event.target.value }))} />
            </label>
            <label>
              Slug
              <input value={draft.slug} onChange={(event) => updateDraft((content) => ({ ...content, slug: normalizeCmsSlug(event.target.value) }))} />
            </label>
            <label>
              Status
              <select value={draft.status} onChange={(event) => updateDraft((content) => ({ ...content, status: event.target.value as CmsContent['status'] }))}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Template
              <select value={draft.template || ''} onChange={(event) => updateDraft((content) => ({ ...content, template: event.target.value || undefined }))}>
                <option value="">Default</option>
                {(siteConfig.templates || ['standard', 'landing', 'booking', 'legal', 'blog']).map((template) => (
                  <option value={template} key={template}>{template}</option>
                ))}
              </select>
            </label>
            <label>
              Schedule publish
              <input
                type="datetime-local"
                value={draft.publish?.scheduledAt ? draft.publish.scheduledAt.slice(0, 16) : ''}
                onChange={(event) => updateDraft((content) => ({
                  ...content,
                  status: event.target.value ? 'scheduled' : content.status,
                  publish: { ...content.publish, scheduledAt: event.target.value ? new Date(event.target.value).toISOString() : undefined }
                }))}
              />
            </label>
            <label>
              Review status
              <select value={draft.publish?.reviewStatus || 'draft'} onChange={(event) => updateDraft((content) => ({ ...content, publish: { ...content.publish, reviewStatus: event.target.value as 'draft' | 'needsReview' | 'approved' } }))}>
                <option value="draft">Draft</option>
                <option value="needsReview">Needs Review</option>
                <option value="approved">Approved</option>
              </select>
            </label>
            <label>
              Categories
              <input value={(draft.taxonomies?.categories || []).join(', ')} onChange={(event) => updateDraft((content) => ({ ...content, taxonomies: { ...content.taxonomies, categories: csvToList(event.target.value) } }))} />
            </label>
            <label>
              Tags
              <input value={(draft.taxonomies?.tags || []).join(', ')} onChange={(event) => updateDraft((content) => ({ ...content, taxonomies: { ...content.taxonomies, tags: csvToList(event.target.value) } }))} />
            </label>
            <label>
              Featured image
              <input value={draft.metadata?.featuredImage || ''} onChange={(event) => updateDraft((content) => ({ ...content, metadata: { ...content.metadata, featuredImage: event.target.value } }))} />
            </label>
            <label>
              Social image
              <input value={draft.metadata?.socialImage || ''} onChange={(event) => updateDraft((content) => ({ ...content, metadata: { ...content.metadata, socialImage: event.target.value } }))} />
            </label>
            <label>
              Parent slug
              <input value={draft.metadata?.parentSlug || ''} onChange={(event) => updateDraft((content) => ({ ...content, metadata: { ...content.metadata, parentSlug: normalizeCmsSlug(event.target.value) } }))} />
            </label>
            <label>
              Sort order
              <input type="number" value={draft.metadata?.sortOrder ?? ''} onChange={(event) => updateDraft((content) => ({ ...content, metadata: { ...content.metadata, sortOrder: event.target.value === '' ? undefined : Number(event.target.value) } }))} />
            </label>
            <label>
              Read time
              <input type="number" value={draft.metadata?.readTimeMinutes ?? ''} onChange={(event) => updateDraft((content) => ({ ...content, metadata: { ...content.metadata, readTimeMinutes: event.target.value === '' ? undefined : Number(event.target.value) } }))} />
            </label>
            <label className="cms-field-wide">
              Excerpt
              <textarea value={draft.metadata?.excerpt || ''} onChange={(event) => updateDraft((content) => ({ ...content, metadata: { ...content.metadata, excerpt: event.target.value } }))} />
            </label>
            <label>
              SEO title
              <input value={draft.seo?.title || ''} onChange={(event) => updateDraft((content) => ({ ...content, seo: { ...content.seo, title: event.target.value } }))} />
            </label>
            <label>
              SEO description
              <textarea value={draft.seo?.description || ''} onChange={(event) => updateDraft((content) => ({ ...content, seo: { ...content.seo, description: event.target.value } }))} />
            </label>
          </div>
          <div className="cms-block-stack">
            {draft.blocks.map((block, index) => (
              <article
                className={`cms-block-editor${selectedBlockId === block.id ? ' cms-block-editor-active' : ''}`}
                id={`cms-block-editor-${block.id}`}
                key={block.id}
              >
                <header>
                  <div>
                    <div className="cms-kicker">{block.type}</div>
                    <h3>{block.label || block.type}</h3>
                  </div>
                  <div className="cms-block-actions">
                    <label className="cms-inline-toggle">
                      <input
                        type="checkbox"
                        checked={!block.visibility?.hidden}
                        onChange={(event) => updateBlock(index, (currentBlock) => ({
                          ...currentBlock,
                          visibility: { ...currentBlock.visibility, hidden: !event.target.checked }
                        }))}
                      />
                      Visible
                    </label>
                    <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0}>Up</button>
                    <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === draft.blocks.length - 1}>Down</button>
                    <button type="button" onClick={() => removeBlock(index)}>Remove</button>
                  </div>
                </header>
                <BlockFields
                  block={block}
                  definition={blocks.find((definition) => definition.type === block.type)}
                  mediaAssets={mediaAssets}
                  onChange={(field, value) => updateBlockProp(index, field, value)}
                />
              </article>
            ))}
          </div>
        </div>

        <aside className="cms-panel cms-editor-side">
          <div className="cms-live-preview">
            <div className="cms-kicker">Live Preview</div>
            <h3>{draft.title}</h3>
            <div className="cms-preview-frame" aria-label="CMS live page preview">
              {renderPreview ? renderPreview({
                content: previewContent,
                siteConfig,
                selectedBlockId,
                onSelectBlock: selectBlock
              }) : (
                <CmsRenderer
                  content={previewContent}
                  siteConfig={siteConfig}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={selectBlock}
                />
              )}
            </div>
            <div className="cms-review-requests">
              <div className="cms-review-requests-head">
                <div>
                  <div className="cms-kicker">Review Requests</div>
                  <h3>Block notes</h3>
                </div>
                <button className="cms-secondary-action" type="button" onClick={() => void loadReviewRequests()} disabled={state.loadingChangeRequests}>
                  {state.loadingChangeRequests ? 'Loading...' : 'Load Requests'}
                </button>
              </div>
              <p className="cms-editor-note">
                {selectedBlock ? `Selected block: ${selectedBlock.label || selectedBlock.type}` : 'No block selected'}
              </p>
              <label className="cms-review-note">
                Request note
                <textarea
                  value={reviewNote}
                  placeholder="Describe the wording, image, button, or layout change needed for the selected block."
                  onChange={(event) => setReviewNote(event.target.value)}
                />
              </label>
              <button
                className="cms-secondary-action"
                type="button"
                onClick={() => void submitReviewRequest()}
                disabled={state.submittingChangeRequest || !selectedBlockId || !reviewNote.trim()}
              >
                {state.submittingChangeRequest ? 'Submitting...' : 'Request a Change'}
              </button>
              <ul className="cms-review-list">
                {pageChangeRequests.map((request) => {
                  const block = draft.blocks.find((item) => item.id === request.blockId);
                  return (
                    <li key={request.id} data-cms-review-status={request.status}>
                      <span>
                        <strong>{block?.label || block?.type || request.blockId}</strong>
                        <small>{request.status} · {new Date(request.createdAt).toLocaleString()}</small>
                        <em>{request.note}</em>
                      </span>
                      {request.status === 'open' ? (
                        <button type="button" onClick={() => void resolveReviewRequest(request.id)} disabled={state.resolvingChangeRequest}>
                          Resolve
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
            {previewHref ? (
              <div className="cms-site-preview">
                <div className="cms-kicker">Page-context Preview</div>
                <iframe title="CMS saved page preview" src={previewHref} />
              </div>
            ) : null}
          </div>
          <div>
            <div className="cms-kicker">Allowed Blocks</div>
            <ul>
              {filteredBlocks.map((block) => (
                <li key={block.type}>
                  <strong>{block.label}</strong>
                  <span>{block.category ? `${block.category} · ` : ''}{block.fields.join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
          <label className="cms-upload-target">
            Replace image or video
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(event) => void uploadMedia(event.target.files?.[0])}
              disabled={state.uploading}
            />
          </label>
          <button className="cms-secondary-action" type="button" onClick={loadMediaAssets} disabled={state.loadingMedia}>
            {state.loadingMedia ? 'Loading media...' : 'Load media library'}
          </button>
          <div className="cms-media-library">
            <div className="cms-kicker">Image Editing</div>
            <p className="cms-editor-note">Use asset URL, alt text, caption, crop, and focal point values in image, video, carousel, hero media, and button image fields.</p>
            {mediaAssets.length ? (
              <ul>
                {mediaAssets.map((asset) => (
                  <li key={asset.id}>
                    <span>
                      <strong>{asset.key}</strong>
                      <small>{asset.contentType}</small>
                      {asset.image?.focalPoint ? <small>Focal {asset.image.focalPoint.x}% / {asset.image.focalPoint.y}% · Crop {asset.image.crop || 'original'}</small> : null}
                    </span>
                    <code>{asset.url || asset.key}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cms-editor-note">Upload or load media to reuse CMS assets across editable blocks.</p>
            )}
          </div>
          <div className="cms-revision-panel">
            <div className="cms-kicker">Rollback</div>
            <h3>Revision history</h3>
            {pageRevisions.length ? (
              <ul>
                {pageRevisions.map((revision) => (
                  <li key={revision.id}>
                    <span>
                      <strong>{revision.status}</strong>
                      <small>{new Date(revision.createdAt).toLocaleString()}</small>
                    </span>
                    <button type="button" onClick={() => void rollbackToRevision(revision.id)} disabled={state.rollingBack}>
                      Rollback
                    </button>
                    <button type="button" onClick={() => void loadRevisionDetail(revision.id)} disabled={state.loadingRevisionDetail}>
                      Compare
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cms-editor-note">Load revisions after saving or publishing to restore an earlier draft.</p>
            )}
            {revisionDetail ? (
              <div className="cms-revision-compare">
                <div className="cms-kicker">Revision Compare</div>
                <strong>{revisionDetail.status} · {new Date(revisionDetail.createdAt).toLocaleString()}</strong>
                <ul>
                  {summarizeRevisionChanges(draft, revisionDetail.content).map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <details className="cms-json-details">
            <summary>Advanced JSON</summary>
            <textarea
              aria-label="CMS content JSON"
              value={jsonText}
              spellCheck={false}
              onChange={(event) => setAdvancedJson((current) => ({ ...current, [selectedPage.slug]: event.target.value }))}
            />
            <button type="button" onClick={applyAdvancedJson}>Apply JSON</button>
          </details>
        </aside>
      </div>

      {state.message ? <p className="cms-editor-status" role="status">{state.message}</p> : null}
    </section>
  );
}

function BlockFields({
  block,
  definition,
  mediaAssets,
  onChange
}: {
  block: CmsBlock;
  definition: CmsBlockDefinition | undefined;
  mediaAssets: CmsMediaAsset[];
  onChange: (field: string, value: unknown) => void;
}) {
  const props = toRecord(block.props);
  const fields = Array.from(new Set([...(definition?.fields || []), ...Object.keys(props)]));

  return (
    <div className="cms-field-grid">
      {fields.map((field) => (
        <FieldEditor
          field={field}
          key={field}
          schema={mergedFieldSchema(field, definition?.fieldSchema?.[field])}
          mediaAssets={mediaAssets}
          value={props[field] ?? defaultValueForSchema(field, definition?.fieldSchema?.[field])}
          onChange={(value) => onChange(field, value)}
        />
      ))}
    </div>
  );
}

function FieldEditor({
  field,
  value,
  schema,
  mediaAssets,
  onChange
}: {
  field: string;
  value: unknown;
  schema?: CmsFieldSchema;
  mediaAssets: CmsMediaAsset[];
  onChange: (value: unknown) => void;
}) {
  const resolvedSchema = mergedFieldSchema(field, schema);

  if (resolvedSchema?.control === 'stringList' || isStringArray(value)) {
    return <StringListEditor field={field} value={toStringArray(value)} onChange={onChange} />;
  }

  if (resolvedSchema?.control === 'collection' || collectionFields.has(field)) {
    return <CollectionEditor field={field} schema={resolvedSchema} value={toArray(value)} mediaAssets={mediaAssets} onChange={onChange} />;
  }

  if (resolvedSchema?.control === 'object' || objectFields.has(field)) {
    return <ObjectEditor field={field} schema={resolvedSchema} value={toRecord(value)} mediaAssets={mediaAssets} onChange={onChange} />;
  }

  if (resolvedSchema?.control === 'select' && resolvedSchema.options?.length) {
    return (
      <label>
        {resolvedSchema.label || labelFor(field)}
        <select value={stringValue(value)} onChange={(event) => onChange(event.target.value)}>
          {resolvedSchema.options.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
        {resolvedSchema.helpText ? <span className="cms-field-help">{resolvedSchema.helpText}</span> : null}
      </label>
    );
  }

  if (resolvedSchema?.control === 'boolean') {
    return (
      <label className="cms-inline-toggle">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {resolvedSchema.label || labelFor(field)}
      </label>
    );
  }

  if (resolvedSchema?.control === 'number') {
    return (
      <label>
        {resolvedSchema.label || labelFor(field)}
        <input
          type="number"
          min={resolvedSchema.min}
          max={resolvedSchema.max}
          step={resolvedSchema.step}
          value={stringValue(value)}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        />
        {resolvedSchema.helpText ? <span className="cms-field-help">{resolvedSchema.helpText}</span> : null}
      </label>
    );
  }

  if (resolvedSchema?.control === 'textarea' || longTextFields.has(field)) {
    return (
      <label className="cms-field-wide">
        {resolvedSchema?.label || labelFor(field)}
        <textarea placeholder={resolvedSchema?.placeholder} value={stringValue(value)} onChange={(event) => onChange(event.target.value)} />
        {resolvedSchema?.helpText ? <span className="cms-field-help">{resolvedSchema.helpText}</span> : null}
      </label>
    );
  }

  const input = (
    <label>
      {resolvedSchema?.label || labelFor(field)}
      <input
        type={resolvedSchema?.control === 'url' || mediaFields.has(field) || field === 'href' ? 'url' : 'text'}
        placeholder={resolvedSchema?.placeholder}
        value={stringValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
      {resolvedSchema?.helpText ? <span className="cms-field-help">{resolvedSchema.helpText}</span> : null}
    </label>
  );
  if (!fieldAcceptsMedia(field, resolvedSchema)) return input;
  return (
    <div className="cms-media-field">
      {input}
      <MediaAssetPicker field={field} schema={resolvedSchema} value={stringValue(value)} mediaAssets={mediaAssets} onChange={onChange} />
    </div>
  );
}

function StringListEditor({ field, value, onChange }: { field: string; value: string[]; onChange: (value: unknown) => void }) {
  return (
    <fieldset className="cms-fieldset cms-field-wide">
      <legend>{labelFor(field)}</legend>
      <div className="cms-collection-stack">
        {value.map((item, index) => (
          <div className="cms-string-list-item" key={`${field}-${index}`}>
            <input
              value={item}
              onChange={(event) => onChange(value.map((current, itemIndex) => itemIndex === index ? event.target.value : current))}
            />
            <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...value, ''])}>
        Add {labelFor(field)}
      </button>
    </fieldset>
  );
}

function ObjectEditor({
  field,
  value,
  schema,
  mediaAssets,
  onChange
}: {
  field: string;
  value: CmsRecord;
  schema?: CmsFieldSchema;
  mediaAssets: CmsMediaAsset[];
  onChange: (value: unknown) => void;
}) {
  const fields = schema?.fields?.length ? schema.fields : field === 'logo' ? ['src', 'alt'] : Array.from(new Set(['src', 'alt', 'caption', ...Object.keys(value)]));

  return (
    <fieldset className="cms-fieldset cms-field-wide">
      <legend>{schema?.label || labelFor(field)}</legend>
      <div className="cms-field-grid">
        {fields.map((itemField) => (
          <FieldEditor
            field={itemField}
            key={itemField}
            schema={sharedFallbackFieldSchema(itemField)}
            mediaAssets={mediaAssets}
            value={value[itemField] || ''}
            onChange={(itemValue) => onChange({ ...value, [itemField]: itemValue })}
          />
        ))}
      </div>
    </fieldset>
  );
}

function CollectionEditor({
  field,
  value,
  schema,
  mediaAssets,
  onChange
}: {
  field: string;
  value: CmsRecord[];
  schema?: CmsFieldSchema;
  mediaAssets: CmsMediaAsset[];
  onChange: (value: unknown) => void;
}) {
  function updateItem(index: number, nextItem: CmsRecord) {
    onChange(value.map((item, itemIndex) => itemIndex === index ? nextItem : item));
  }

  return (
    <fieldset className="cms-fieldset cms-field-wide">
      <legend>{schema?.label || labelFor(field)}</legend>
      <div className="cms-collection-stack">
        {value.map((item, index) => (
          <div className="cms-collection-item" key={`${field}-${index}`}>
            <div className="cms-collection-header">
              <strong>{labelFor(field)} {index + 1}</strong>
              <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
            </div>
            <div className="cms-field-grid">
              {itemFields(field, item, schema).map((itemField) => (
                <FieldEditor
                  field={itemField}
                  key={itemField}
                  schema={itemFieldSchema(schema, itemField)}
                  mediaAssets={mediaAssets}
                  value={item[itemField] || ''}
                  onChange={(itemValue) => updateItem(index, { ...item, [itemField]: itemValue })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...value, defaultCollectionItem(field)])}>
        Add {labelFor(field)}
      </button>
    </fieldset>
  );
}

function MediaAssetPicker({
  field,
  schema,
  value,
  mediaAssets,
  onChange
}: {
  field: string;
  schema?: CmsFieldSchema;
  value: string;
  mediaAssets: CmsMediaAsset[];
  onChange: (value: unknown) => void;
}) {
  return (
    <label className="cms-media-picker">
      Media Library
      <select
        value={mediaAssets.find((asset) => mediaFieldValue(asset, field, schema) === value)?.id || ''}
        onChange={(event) => {
          const asset = mediaAssets.find((item) => item.id === event.target.value);
          if (!asset) return;
          onChange(mediaFieldValue(asset, field, schema));
        }}
      >
        <option value="">Choose from loaded media</option>
        {mediaAssets.map((asset) => (
          <option key={asset.id} value={asset.id}>{asset.alt || asset.caption || asset.key}</option>
        ))}
      </select>
    </label>
  );
}

function mediaFieldValue(asset: CmsMediaAsset, field: string, schema?: CmsFieldSchema): string {
  return schema?.mediaValue === 'id' || field === 'assetId' ? asset.id : asset.url || asset.key;
}

function fieldAcceptsMedia(field: string, schema?: CmsFieldSchema): boolean {
  return schema?.control === 'media' || ['src', 'poster', 'assetId', 'image', 'videoSrc', 'moduleSrc', 'featuredImage', 'socialImage'].includes(field);
}

function labelFor(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseDraft(value: string): CmsContent | null {
  try {
    const parsed = JSON.parse(value) as CmsContent;
    if (!parsed?.id || !parsed.slug || !Array.isArray(parsed.blocks)) return null;
    return parsed;
  } catch {
    return null;
  }
}
