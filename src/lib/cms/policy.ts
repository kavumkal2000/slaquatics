import type { CmsContent, CmsContentType, CmsRole } from './core.ts';

type CmsRoleHolder = {
  id?: string;
  role: CmsRole;
};

const PUBLIC_CONTENT_TYPES = new Set<CmsContentType>(['page', 'blogPost', 'productList']);
const GLOBAL_CONTENT_TYPES = new Set<CmsContentType>(['navigationMenu', 'styleSettings', 'stripeCatalog']);
const SHARED_CONTENT_TYPES = new Set<CmsContentType>(['reusableSection', 'pattern', 'navigationMenu', 'styleSettings', 'stripeCatalog']);

export function cmsContentTypeIsPublic(type: CmsContentType): boolean {
  return PUBLIC_CONTENT_TYPES.has(type);
}

export function cmsContentTypeIsShared(type: CmsContentType): boolean {
  return SHARED_CONTENT_TYPES.has(type);
}

export function userCanWriteCmsContentType(user: CmsRoleHolder, type: CmsContentType): boolean {
  if (GLOBAL_CONTENT_TYPES.has(type)) return user.role === 'owner' || user.role === 'admin';
  if (cmsContentTypeIsShared(type)) return user.role === 'owner' || user.role === 'admin';
  return user.role === 'owner' || user.role === 'admin' || user.role === 'client';
}

export function userCanPublishCmsContentType(user: CmsRoleHolder, type: CmsContentType): boolean {
  if (GLOBAL_CONTENT_TYPES.has(type)) return user.role === 'owner' || user.role === 'admin';
  return user.role === 'owner' || user.role === 'admin';
}

export function userCanReadCmsContent(user: CmsRoleHolder, content: CmsContent): boolean {
  if (user.role === 'owner' || user.role === 'admin') return true;
  if (user.role !== 'client') return false;
  return cmsContentAssignedToUser(user, content);
}

export function userCanWriteCmsContent(user: CmsRoleHolder, content: CmsContent): boolean {
  if (!userCanWriteCmsContentType(user, content.contentType)) return false;
  if (content.metadata?.access?.locked && user.role !== 'owner' && user.role !== 'admin') return false;
  if (user.role === 'owner' || user.role === 'admin') return true;
  if (user.role !== 'client') return false;
  return cmsContentAssignedToUser(user, content);
}

export function userCanPublishCmsContent(user: CmsRoleHolder, content: CmsContent): boolean {
  if (!userCanPublishCmsContentType(user, content.contentType)) return false;
  if (content.metadata?.access?.locked && user.role !== 'owner' && user.role !== 'admin') return false;
  return user.role === 'owner' || user.role === 'admin';
}

export function applyCmsAccessForSave(user: CmsRoleHolder, incoming: CmsContent, existing: CmsContent | null): CmsContent {
  if (user.role === 'owner' || user.role === 'admin') return incoming;
  if (existing?.metadata?.access) {
    return {
      ...incoming,
      metadata: {
        ...incoming.metadata,
        access: existing.metadata.access
      }
    };
  }
  if (user.role === 'client' && user.id) {
    return {
      ...incoming,
      metadata: {
        ...incoming.metadata,
        access: {
          ownerUserId: user.id,
          assignedUserIds: [user.id]
        }
      }
    };
  }
  return incoming;
}

function cmsContentAssignedToUser(user: CmsRoleHolder, content: CmsContent): boolean {
  if (!user.id) return false;
  const access = content.metadata?.access;
  if (!access) return false;
  return access.ownerUserId === user.id || Boolean(access.assignedUserIds?.includes(user.id));
}

export function toPublicCmsContent(content: CmsContent): CmsContent | null {
  if (!cmsContentTypeIsPublic(content.contentType)) return null;
  return content;
}
