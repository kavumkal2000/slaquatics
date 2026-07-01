import type { CmsContent, CmsSiteConfig } from '../cms/core.ts';
import type { CmsStore } from '../cms/storage.ts';
import {
  CMS_SLAQUATICS_CONTENT_LIBRARY,
  cmsSlaquaticsSiteConfig,
  getSlaquaticsCmsFallbackContent,
  loadSlaquaticsCmsContent
} from './slaquatics.ts';

export type ActiveCmsSiteAdapter = {
  siteConfig: CmsSiteConfig;
  fallbackContent: CmsContent[];
  getFallbackContent: (slug: string) => CmsContent | null;
  loadContent: (
    slug: string,
    storeFactory?: () => Promise<Pick<CmsStore, 'getPublishedContent'>>
  ) => Promise<CmsContent | null>;
};

export const activeCmsSiteAdapter: ActiveCmsSiteAdapter = {
  siteConfig: cmsSlaquaticsSiteConfig,
  fallbackContent: CMS_SLAQUATICS_CONTENT_LIBRARY,
  getFallbackContent: getSlaquaticsCmsFallbackContent,
  loadContent: loadSlaquaticsCmsContent
};
