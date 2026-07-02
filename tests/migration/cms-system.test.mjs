import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { test } from 'node:test';

const readText = (file) => readFileSync(file, 'utf8');

function collectFiles(dir, pattern) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const file = `${dir}/${entry}`;
    if (statSync(file).isDirectory()) files.push(...collectFiles(file, pattern));
    else if (pattern.test(file)) files.push(file);
  }
  return files;
}

test('CMS core is isolated from slaquatics-specific business assumptions', () => {
  for (const file of [
    'src/lib/cms/core.ts',
    'src/lib/cms/preview-references.ts',
    'src/lib/cms/storage.ts',
    'src/lib/cms/auth.ts',
    'src/lib/cms/host-routing.ts',
    'src/lib/cms/policy.ts',
    'src/lib/cms/default-content.ts',
    'src/lib/cms/validation.ts',
    'src/features/cms/CmsAdminShell.tsx',
    'src/features/cms/CmsContentEditor.tsx',
    'src/features/cms/CmsRenderer.tsx',
    'src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx'
  ]) {
    assert.ok(existsSync(file), `${file} should exist`);
  }

  const cmsSource = collectFiles('src/lib/cms', /\.(tsx?|jsx?)$/)
    .concat(collectFiles('src/features/cms', /\.(tsx?|jsx?)$/))
    .map((file) => readText(file))
    .join('\n');

  assert.doesNotMatch(cmsSource, /slaquatics/i);
  assert.doesNotMatch(cmsSource, /shoreline/i);
  assert.doesNotMatch(cmsSource, /jet\s?ski/i);
  assert.doesNotMatch(cmsSource, /boat rental/i);
  assert.doesNotMatch(cmsSource, /OPS_DB/);
});

test('Slaquatics owns CMS customization only through a site adapter', () => {
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const activeAdapter = readText('src/lib/site-cms/active.ts');
  const cmsPageProps = readText('src/app/cms/cms-page-props.ts');
  const publicPageSection = readText('src/features/siteCms/SlaquaticsCmsPublicPageSection.tsx');
  const publicRoute = readText('src/app/api/cms/public/[slug]/route.ts');
  const publicListRoute = readText('src/app/api/cms/public/route.ts');
  const policy = readText('src/lib/cms/policy.ts');
  const previewPage = readText('src/app/cms/preview/[token]/[slug]/page.tsx');
  const homePage = readText('src/features/home/HomePage.tsx');
  const fleetSection = readText('src/features/home/components/HomeFleetSection.tsx');

  assert.match(adapter, /createCmsSiteConfig/);
  assert.match(adapter, /cmsSlaquaticsSiteConfig/);
  assert.match(adapter, /CMS_SLAQUATICS_SHARED_CONTENT/);
  assert.match(adapter, /CMS_SLAQUATICS_CONTENT_LIBRARY/);
  assert.match(adapter, /service-list/);
  assert.match(adapter, /carousel/);
  assert.match(adapter, /cta-band/);
  assert.match(activeAdapter, /activeCmsSiteAdapter/);
  assert.match(activeAdapter, /cmsSlaquaticsSiteConfig/);
  assert.match(activeAdapter, /CMS_SLAQUATICS_CONTENT_LIBRARY/);
  assert.match(cmsPageProps, /activeCmsSiteAdapter/);
  assert.match(cmsPageProps, /getCmsPageProps/);
  assert.match(cmsPageProps, /listContent/);
  assert.match(publicRoute, /activeCmsSiteAdapter\.loadContent/);
  assert.match(publicRoute, /toPublicCmsContent/);
  assert.match(publicListRoute, /publishedOnly: true/);
  assert.match(publicListRoute, /cmsContentTypeIsPublic/);
  assert.match(publicListRoute, /toPublicCmsContent/);
  assert.match(publicListRoute, /contentType/);
  assert.match(policy, /blogPost/);
  assert.match(policy, /productList/);
  assert.match(previewPage, /SlaquaticsCmsPublicRenderer/);
  assert.match(previewPage, /activeCmsSiteAdapter\.getFallbackContent/);
  assert.match(publicPageSection, /loadSlaquaticsCmsContent/);
  assert.match(publicPageSection, /SlaquaticsCmsPublicRenderer/);
  assert.match(previewPage, /getPreviewContent/);
  assert.match(policy, /PUBLIC_CONTENT_TYPES/);
  assert.match(policy, /\['page', 'blogPost', 'productList'\]/);
  assert.match(policy, /GLOBAL_CONTENT_TYPES/);
  assert.match(policy, /userCanWriteCmsContentType/);
  assert.match(policy, /userCanPublishCmsContentType/);
  assert.match(policy, /toPublicCmsContent/);
  assert.match(homePage, /HomeFleetSection/);
  assert.match(fleetSection, /cmsSlaquaticsSiteConfig/);
  assert.match(fleetSection, /CMS_HOME_FLEET_SECTION/);
  assert.match(fleetSection, /loadSlaquaticsCmsContent\('home\/fleet'\)/);
  assert.doesNotMatch(fleetSection, /^'use client';/);
});

test('Wrangler defines embedded CMS databases, media storage, and CMS hostnames per environment', () => {
  const wrangler = readText('wrangler.toml');

  assert.match(wrangler, /CMS_DEV_HOST = "cms\.dev\.slaquatics\.com"/);
  assert.match(wrangler, /CMS_PROD_HOST = "cms\.slaquatics\.com"/);
  assert.match(wrangler, /\[env\.development\][\s\S]*pattern = "cms\.dev\.slaquatics\.com"[\s\S]*custom_domain = true/);
  assert.match(wrangler, /\[env\.production\][\s\S]*pattern = "cms\.slaquatics\.com"[\s\S]*custom_domain = true/);
  assert.match(wrangler, /\[\[env\.development\.d1_databases\]\][\s\S]*binding = "CMS_DB"/);
  assert.match(wrangler, /\[\[env\.production\.d1_databases\]\][\s\S]*binding = "CMS_DB"/);
  assert.match(wrangler, /\[\[env\.development\.d1_databases\]\][\s\S]*binding = "CMS_DB"[\s\S]*database_id = "[0-9a-f-]{36}"/);
  assert.match(wrangler, /\[\[env\.production\.d1_databases\]\][\s\S]*binding = "CMS_DB"[\s\S]*database_id = "[0-9a-f-]{36}"/);
  assert.match(wrangler, /\[\[env\.development\.r2_buckets\]\][\s\S]*binding = "CMS_MEDIA_BUCKET"/);
  assert.match(wrangler, /\[\[env\.production\.r2_buckets\]\][\s\S]*binding = "CMS_MEDIA_BUCKET"/);
  assert.match(wrangler, /\[\[env\.development\.r2_buckets\]\][\s\S]*binding = "CMS_AUDIT_BUCKET"[\s\S]*slaquatics-cms-audit-development/);
  assert.match(wrangler, /\[\[env\.production\.r2_buckets\]\][\s\S]*binding = "CMS_AUDIT_BUCKET"[\s\S]*slaquatics-cms-audit-production/);
});

test('Worker routes CMS hosts into the embedded admin while hiding admin UI from public hosts', () => {
  const worker = readText('src/worker.ts');

  assert.match(worker, /routeCmsHostRequest/);
  assert.match(worker, /isCmsHost/);
  assert.match(worker, /cms\.dev\.slaquatics\.com/);
  assert.match(worker, /cms\.slaquatics\.com/);
  assert.match(worker, /\/cms-login/);
  assert.match(worker, /\/cms\/content/);
  assert.match(worker, /\/cms\/media/);
  assert.match(worker, /\/cms\/preview/);
});

test('CMS host routing hardens denied and unknown CMS paths', async () => {
  const { routeCmsHostRequest } = await import(`../../src/lib/cms/host-routing.ts?case=host-routing-${Date.now()}`);
  const env = {
    CMS_DEV_HOST: 'cms.dev.slaquatics.com',
    CMS_PROD_HOST: 'cms.slaquatics.com'
  };
  const publicDenied = routeCmsHostRequest(new Request('https://slaquatics.com/cms/content'), env);
  assert.ok(publicDenied instanceof Response);
  assert.equal(publicDenied.status, 404);
  assert.equal(publicDenied.headers.get('cache-control'), 'no-store, private');
  assert.equal(publicDenied.headers.get('x-robots-tag'), 'noindex');
  assert.match(publicDenied.headers.get('content-security-policy') || '', /frame-ancestors 'self'/);

  const cmsUnknown = routeCmsHostRequest(new Request('https://cms.slaquatics.com/not-a-cms-route'), env);
  assert.ok(cmsUnknown instanceof Response);
  assert.equal(cmsUnknown.status, 404);
  assert.equal(cmsUnknown.headers.get('x-content-type-options'), 'nosniff');

  const cmsAsset = routeCmsHostRequest(new Request('https://cms.slaquatics.com/_next/static/chunk.js'), env);
  assert.equal(cmsAsset, null);

  const cmsRoot = routeCmsHostRequest(new Request('https://cms.slaquatics.com/'), env);
  assert.ok(cmsRoot instanceof Request);
  assert.equal(new URL(cmsRoot.url).pathname, '/cms');
});

test('CMS admin routes require authenticated sessions and public routes only expose published content', () => {
  for (const file of [
    'src/app/api/cms/public/[slug]/route.ts',
    'src/app/api/cms/preview/[token]/[slug]/route.ts',
    'src/app/api/cms/admin/content/route.ts',
    'src/app/api/cms/admin/content/[id]/publish/route.ts',
    'src/app/api/cms/admin/content/[id]/archive/route.ts',
    'src/app/api/cms/admin/content/[id]/duplicate/route.ts',
    'src/app/api/cms/admin/content/[id]/change-requests/route.ts',
    'src/app/api/cms/admin/content/[id]/change-requests/[requestId]/resolve/route.ts',
    'src/app/api/cms/admin/content/[id]/rollback/route.ts',
    'src/app/api/cms/admin/content/[id]/revisions/route.ts',
    'src/app/api/cms/admin/content/[id]/revisions/[revisionId]/route.ts',
    'src/app/api/cms/admin/media/route.ts',
    'src/app/api/cms/admin/media/upload/route.ts',
    'src/app/api/cms/admin/media/[id]/route.ts',
    'src/app/api/cms/admin/media/[id]/replace/route.ts',
    'src/app/api/cms/admin/audit/route.ts',
    'src/app/api/cms/admin/audit/[id]/retry-r2/route.ts',
    'src/app/api/cms/admin/export/route.ts',
    'src/app/api/cms/admin/import/route.ts',
    'src/app/api/cms/admin/users/route.ts',
    'src/app/api/cms/admin/users/[id]/deactivate/route.ts',
    'src/app/api/cms/admin/users/[id]/sessions/route.ts',
    'src/app/api/cms/admin/users/[id]/sessions/[sessionId]/route.ts',
    'src/app/api/cms/admin/login/route.ts',
    'src/app/api/cms/admin/logout/route.ts'
  ]) {
    assert.ok(existsSync(file), `${file} should exist`);
  }

  const adminSource = collectFiles('src/app/api/cms/admin', /route\.ts$/)
    .map((file) => readText(file))
    .join('\n');
  const loginRoute = readText('src/app/api/cms/admin/login/route.ts');
  const logoutRoute = readText('src/app/api/cms/admin/logout/route.ts');
  const auth = readText('src/lib/cms/auth.ts');
  const contentRoute = readText('src/app/api/cms/admin/content/route.ts');
  const publishRoute = readText('src/app/api/cms/admin/content/[id]/publish/route.ts');
  const archiveRoute = readText('src/app/api/cms/admin/content/[id]/archive/route.ts');
  const duplicateRoute = readText('src/app/api/cms/admin/content/[id]/duplicate/route.ts');
  const changeRequestsRoute = readText('src/app/api/cms/admin/content/[id]/change-requests/route.ts');
  const resolveChangeRequestRoute = readText('src/app/api/cms/admin/content/[id]/change-requests/[requestId]/resolve/route.ts');
  const policy = readText('src/lib/cms/policy.ts');
  const rollbackRoute = readText('src/app/api/cms/admin/content/[id]/rollback/route.ts');
  const revisionsRoute = readText('src/app/api/cms/admin/content/[id]/revisions/route.ts');
  const revisionDetailRoute = readText('src/app/api/cms/admin/content/[id]/revisions/[revisionId]/route.ts');
  const mediaRoute = readText('src/app/api/cms/admin/media/route.ts');
  const mediaUploadRoute = readText('src/app/api/cms/admin/media/upload/route.ts');
  const mediaDeleteRoute = readText('src/app/api/cms/admin/media/[id]/route.ts');
  const mediaReplaceRoute = readText('src/app/api/cms/admin/media/[id]/replace/route.ts');
  const auditRoute = readText('src/app/api/cms/admin/audit/route.ts');
  const auditRetryRoute = readText('src/app/api/cms/admin/audit/[id]/retry-r2/route.ts');
  const exportRoute = readText('src/app/api/cms/admin/export/route.ts');
  const importRoute = readText('src/app/api/cms/admin/import/route.ts');
  const usersRoute = readText('src/app/api/cms/admin/users/route.ts');
  const deactivateUserRoute = readText('src/app/api/cms/admin/users/[id]/deactivate/route.ts');
  const userSessionsRoute = readText('src/app/api/cms/admin/users/[id]/sessions/route.ts');
  const userSessionRevokeRoute = readText('src/app/api/cms/admin/users/[id]/sessions/[sessionId]/route.ts');
  const pageGuard = readText('src/app/cms/require-cms-page-user.ts');
  const securityHeaders = readText('src/lib/cms/security-headers.ts');
  const hostRouting = readText('src/lib/cms/host-routing.ts');
  const nextConfig = readText('next.config.mjs');
  const storage = readText('src/lib/cms/storage.ts');
  const migration = `${readText('migrations/0002_cms.sql')}\n${readText('migrations/0003_cms_audit_access.sql')}`;
  const audit = readText('src/lib/cms/audit.ts');
  const publicRoute = readText('src/app/api/cms/public/[slug]/route.ts');
  const publicListRoute = readText('src/app/api/cms/public/route.ts');
  const previewRoute = readText('src/app/api/cms/preview/[token]/[slug]/route.ts');
  const previewPage = readText('src/app/cms/preview/[token]/[slug]/page.tsx');
  const uploadRoute = readText('src/app/api/cms/admin/media/upload/route.ts');
  const seedOwner = readText('scripts/seed-cms-owner.mjs');

  assert.match(adminSource, /requireCmsPermission/);
  assert.match(adminSource, /CMS_DB/);
  assert.doesNotMatch(adminSource, /OPS_DB/);
  assert.match(auth, /type CmsPermission/);
  assert.match(auth, /'users\.manage'/);
  assert.match(auth, /'audit\.read'/);
  assert.match(auth, /'audit\.retry'/);
  assert.match(auth, /'session\.manage'/);
  assert.match(auth, /'site\.export'/);
  assert.match(auth, /'site\.import'/);
  assert.match(auth, /userHasCmsPermission/);
  assert.match(auth, /requireCmsPermission/);
  assert.match(auth, /requireCmsMutationRequest/);
  assert.match(auth, /cmsJson/);
  assert.match(auth, /pbkdf2-sha256/);
  assert.match(auth, /constantTimeEqual/);
  assert.doesNotMatch(auth, /editor: \[/);
  assert.match(auth, /client: \['content\.read', 'content\.write', 'media\.read', 'revision\.read'\]/);
  assert.match(auth, /owner: \[[^\]]*users\.manage/);
  assert.match(auth, /owner: \[[^\]]*audit\.read/);
  assert.match(auth, /admin: \[[^\]]*audit\.read/);
  assert.match(auth, /owner: \[[^\]]*session\.manage/);
  assert.match(auth, /admin: \[[^\]]*session\.manage/);
  assert.match(auth, /owner: \[[^\]]*site\.export/);
  assert.match(auth, /admin: \[[^\]]*site\.export/);
  assert.match(auth, /owner: \[[^\]]*site\.import/);
  assert.match(auth, /admin: \[[^\]]*site\.import/);
  assert.doesNotMatch(auth, /client: \[[^\]]*site\.export/);
  assert.doesNotMatch(auth, /client: \[[^\]]*site\.import/);
  assert.doesNotMatch(auth, /admin: \[[^\]]*users\.manage/);
  assert.doesNotMatch(auth, /client: \[[^\]]*content\.publish/);
  assert.doesNotMatch(auth, /client: \[[^\]]*content\.rollback/);
  assert.match(auth, /role IN \('owner', 'admin', 'client'\)/);
  assert.match(auth, /role = 'editor' AND active = 1/);
  assert.match(auth, /cms_login_attempts/);
  assert.match(auth, /loginIsRateLimited/);
  assert.match(auth, /sessionTokenHash/);
  assert.match(auth, /auth\.loginFailed/);
  assert.match(auth, /auth\.loginSucceeded/);
  assert.match(auth, /logoutCmsUser/);
  assert.match(auth, /DELETE FROM cms_sessions WHERE token = \?/);
  assert.match(auth, /auth\.logout/);
  assert.match(auth, /cms_audit_log/);
  assert.match(auth, /active INTEGER NOT NULL DEFAULT 1/);
  assert.match(auth, /u\.active = 1/);
  assert.match(auth, /listCmsUsers/);
  assert.match(auth, /createManagedCmsUser/);
  assert.match(auth, /deactivateCmsUser/);
  assert.match(auth, /return role === 'admin' \|\| role === 'client'/);
  assert.match(auth, /DELETE FROM cms_sessions WHERE user_id = \?/);
  assert.match(auth, /listCmsUserSessions/);
  assert.match(auth, /revokeCmsUserSession/);
  assert.match(auth, /auth\.userCreated/);
  assert.match(auth, /auth\.userDeactivated/);
  assert.match(auth, /auth\.sessionRevoked/);
  assert.match(audit, /CMS_AUDIT_BUCKET/);
  assert.match(audit, /audit\/\$\{keyDate\}\/\$\{id\}\.json/);
  assert.match(audit, /cms_audit_outbox/);
  assert.match(audit, /r2_status/);
  assert.match(audit, /retryCmsAuditR2Write/);
  assert.match(migration, /CMS_AUDIT_BUCKET|cms_audit_outbox|r2_key|r2_status|WHERE role = 'editor'/);
  assert.match(contentRoute, /requireCmsPermission\(request, 'content\.write'\)/);
  assert.match(contentRoute, /cmsJson/);
  assert.match(contentRoute, /userCanWriteCmsContentType/);
  assert.match(contentRoute, /userCanReadCmsContent/);
  assert.match(contentRoute, /userCanWriteCmsContent/);
  assert.match(contentRoute, /applyCmsAccessForSave/);
  assert.match(contentRoute, /CMS role cannot edit this content type/);
  assert.match(contentRoute, /CMS role cannot edit this content/);
  assert.match(contentRoute, /export async function GET/);
  assert.match(contentRoute, /listContent/);
  assert.match(contentRoute, /validateAndSanitizeCmsContent/);
  assert.match(contentRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(publishRoute, /requireCmsPermission\(request, 'content\.publish'\)/);
  assert.match(publishRoute, /cmsJson/);
  assert.match(publishRoute, /store\.getContentById\(id\)/);
  assert.match(publishRoute, /userCanPublishCmsContentType/);
  assert.match(publishRoute, /userCanPublishCmsContent/);
  assert.match(publishRoute, /CMS role cannot publish this content type/);
  assert.match(publishRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(archiveRoute, /requireCmsPermission\(request, 'content\.publish'\)/);
  assert.match(archiveRoute, /cmsJson/);
  assert.match(archiveRoute, /store\.getContentById\(id\)/);
  assert.match(archiveRoute, /userCanPublishCmsContentType/);
  assert.match(archiveRoute, /userCanPublishCmsContent/);
  assert.match(archiveRoute, /store\.archiveContent\(id, user\.id\)/);
  assert.match(archiveRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(duplicateRoute, /requireCmsPermission\(request, 'content\.write'\)/);
  assert.match(duplicateRoute, /cmsJson/);
  assert.match(duplicateRoute, /normalizeCmsSlug/);
  assert.match(duplicateRoute, /userCanWriteCmsContentType/);
  assert.match(duplicateRoute, /userCanWriteCmsContent/);
  assert.match(duplicateRoute, /store\.duplicateContent/);
  assert.match(duplicateRoute, /createPreviewToken/);
  assert.match(duplicateRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(changeRequestsRoute, /export async function GET/);
  assert.match(changeRequestsRoute, /export async function POST/);
  assert.match(changeRequestsRoute, /requireCmsPermission\(request, 'content\.read'\)/);
  assert.match(changeRequestsRoute, /requireCmsPermission\(request, 'content\.write'\)/);
  assert.match(changeRequestsRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(changeRequestsRoute, /userCanReadCmsContent/);
  assert.match(changeRequestsRoute, /userCanWriteCmsContent/);
  assert.match(changeRequestsRoute, /sanitizeReviewNote/);
  assert.match(changeRequestsRoute, /Unsafe CMS review request was rejected/);
  assert.match(changeRequestsRoute, /store\.listChangeRequests/);
  assert.match(changeRequestsRoute, /store\.createChangeRequest/);
  assert.match(resolveChangeRequestRoute, /requireCmsPermission\(request, 'content\.publish'\)/);
  assert.match(resolveChangeRequestRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(resolveChangeRequestRoute, /userCanPublishCmsContent/);
  assert.match(resolveChangeRequestRoute, /store\.resolveChangeRequest/);
  assert.match(resolveChangeRequestRoute, /cmsJson/);
  assert.match(rollbackRoute, /requireCmsPermission\(request, 'content\.rollback'\)/);
  assert.match(rollbackRoute, /cmsJson/);
  assert.match(rollbackRoute, /userCanPublishCmsContent/);
  assert.match(rollbackRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(revisionsRoute, /requireCmsPermission\(request, 'revision\.read'\)/);
  assert.match(revisionsRoute, /cmsJson/);
  assert.match(revisionsRoute, /store\.getContentById\(id\)/);
  assert.match(revisionsRoute, /userCanReadCmsContent/);
  assert.match(revisionsRoute, /CMS role cannot read revisions for this content/);
  assert.match(revisionDetailRoute, /requireCmsPermission\(request, 'revision\.read'\)/);
  assert.match(revisionDetailRoute, /store\.getContentById\(id\)/);
  assert.match(revisionDetailRoute, /userCanReadCmsContent/);
  assert.match(revisionDetailRoute, /store\.getRevision\(id, revisionId\)/);
  assert.match(revisionDetailRoute, /CMS role cannot read this revision/);
  assert.match(mediaRoute, /requireCmsPermission\(request, 'media\.read'\)/);
  assert.match(mediaRoute, /cmsJson/);
  assert.match(mediaRoute, /user\.role === 'client'/);
  assert.match(mediaRoute, /store\.listContent\(\{ limit: 200 \}\)/);
  assert.match(mediaRoute, /userCanReadCmsContent/);
  assert.match(mediaRoute, /mediaAssetUsedByContent/);
  assert.match(mediaRoute, /url\.searchParams\.get\('q'\)/);
  assert.match(mediaRoute, /matchesMediaAssetQuery/);
  assert.match(mediaRoute, /mediaUsageForContent/);
  assert.match(mediaRoute, /usedBy/);
  assert.match(mediaRoute, /export async function PATCH/);
  assert.match(mediaRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(mediaRoute, /updateMediaAsset/);
  assert.match(mediaUploadRoute, /requireCmsPermission\(request, 'media\.write'\)/);
  assert.match(mediaUploadRoute, /cmsJson/);
  assert.match(mediaDeleteRoute, /export async function DELETE/);
  assert.match(mediaDeleteRoute, /requireCmsPermission\(request, 'media\.write'\)/);
  assert.match(mediaDeleteRoute, /media\.deleteBlocked/);
  assert.match(mediaDeleteRoute, /force/);
  assert.match(mediaDeleteRoute, /deleteMediaAsset/);
  assert.match(mediaReplaceRoute, /export async function POST/);
  assert.match(mediaReplaceRoute, /requireCmsPermission\(request, 'media\.write'\)/);
  assert.match(mediaReplaceRoute, /replaceMediaAsset/);
  assert.match(mediaReplaceRoute, /CMS_MEDIA_BUCKET/);
  assert.match(auditRoute, /requireCmsPermission\(request, 'audit\.read'\)/);
  assert.match(auditRoute, /listCmsAuditEvents/);
  assert.match(auditRoute, /audit\.view/);
  assert.match(auditRetryRoute, /requireCmsPermission\(request, 'audit\.retry'\)/);
  assert.match(auditRetryRoute, /retryCmsAuditR2Write/);
  assert.match(exportRoute, /export async function GET/);
  assert.match(exportRoute, /requireCmsPermission\(request, 'site\.export'\)/);
  assert.match(exportRoute, /buildCmsExportManifest/);
  assert.match(exportRoute, /listContent\(\{ limit: 1000 \}\)/);
  assert.match(exportRoute, /listMediaAssets\(1000\)/);
  assert.match(exportRoute, /schemaVersion/);
  assert.match(exportRoute, /siteId: activeCmsSiteAdapter\.siteConfig\.siteId/);
  assert.match(exportRoute, /cmsJson/);
  assert.doesNotMatch(exportRoute, /cms_users|cms_sessions|password_hash|cms_audit_log/);
  assert.match(importRoute, /export async function POST/);
  assert.match(importRoute, /requireCmsPermission\(request, 'site\.import'\)/);
  assert.match(importRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(importRoute, /buildCmsImportPlan/);
  assert.match(importRoute, /validateAndSanitizeCmsContent/);
  assert.match(importRoute, /saveDraft/);
  assert.match(importRoute, /dryRun/);
  assert.match(importRoute, /cmsJson/);
  assert.doesNotMatch(importRoute, /cms_users|cms_sessions|password_hash|cms_audit_log/);
  assert.match(usersRoute, /export async function GET/);
  assert.match(usersRoute, /export async function POST/);
  assert.match(usersRoute, /requireCmsPermission\(request, 'users\.manage'\)/);
  assert.match(usersRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(usersRoute, /createManagedCmsUser/);
  assert.match(usersRoute, /listCmsUsers/);
  assert.match(usersRoute, /auth\.usersViewed/);
  assert.match(usersRoute, /cmsJson/);
  assert.doesNotMatch(usersRoute, /password_hash/);
  assert.match(userSessionsRoute, /requireCmsPermission\(request, 'session\.manage'\)/);
  assert.match(userSessionsRoute, /listCmsUserSessions/);
  assert.match(userSessionsRoute, /auth\.sessionsViewed/);
  assert.match(userSessionRevokeRoute, /export async function DELETE/);
  assert.match(userSessionRevokeRoute, /requireCmsPermission\(request, 'session\.manage'\)/);
  assert.match(userSessionRevokeRoute, /revokeCmsUserSession/);
  assert.match(deactivateUserRoute, /requireCmsPermission\(request, 'users\.manage'\)/);
  assert.match(deactivateUserRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(deactivateUserRoute, /Cannot deactivate your own CMS account/);
  assert.match(deactivateUserRoute, /deactivateCmsUser/);
  assert.match(deactivateUserRoute, /cmsJson/);
  assert.match(pageGuard, /permission: CmsPermission = 'content\.read'/);
  assert.match(pageGuard, /requireCmsPermission\(request, permission\)/);
  assert.match(publicRoute, /activeCmsSiteAdapter\.loadContent/);
  assert.match(publicRoute, /cmsJson/);
  assert.match(publicListRoute, /cmsJson/);
  assert.doesNotMatch(publicRoute, /draft/);
  assert.match(previewRoute, /getPreviewContent/);
  assert.match(previewRoute, /requireCmsPermission\(request, 'content\.read'\)/);
  assert.match(previewRoute, /getPreviewContent\(token, slug, user\)/);
  assert.match(previewRoute, /cmsJson/);
  assert.match(previewPage, /robots/);
  assert.match(previewPage, /const user = await requireCmsPageUser/);
  assert.match(previewPage, /loadPreviewContent\(token, slug, user\)/);
  assert.match(previewPage, /getPreviewContent\(token, slug, user\)/);
  assert.match(previewPage, /Preview not found/);
  assert.doesNotMatch(previewPage, /catch\s*\{[\s\S]*getFallbackContent/);
  assert.match(nextConfig, /source: '\/cms\/:path\*'/);
  assert.match(nextConfig, /source: '\/api\/cms\/:path\*'/);
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /frame-src 'self'/);
  assert.match(nextConfig, /frame-ancestors 'self'/);
  assert.match(nextConfig, /Cache-Control', value: 'no-store'/);
  assert.match(securityHeaders, /CMS_SECURITY_HEADERS/);
  assert.match(securityHeaders, /applyCmsSecurityHeaders/);
  assert.match(securityHeaders, /cmsJson/);
  assert.match(securityHeaders, /cmsRedirect/);
  assert.match(securityHeaders, /no-store, private/);
  assert.match(securityHeaders, /frame-ancestors 'self'/);
  assert.match(hostRouting, /cmsResponse\('Not found', \{ status: 404 \}\)/);
  assert.match(hostRouting, /isCmsHostAssetPath/);
  assert.match(hostRouting, /pathname\.startsWith\('\/_next\/'\)/);
  assert.match(loginRoute, /cmsRedirect/);
  assert.match(loginRoute, /set-cookie/);
  assert.match(logoutRoute, /logoutCmsUser/);
  assert.match(logoutRoute, /cmsRedirect/);
  assert.match(mediaRoute, /listMediaAssets/);
  assert.match(mediaUploadRoute, /saveMediaAsset/);
  assert.match(mediaUploadRoute, /CMS_MEDIA_BUCKET/);
  assert.match(mediaUploadRoute, /allowedMimeTypes/);
  assert.match(mediaUploadRoute, /mediaConfig\.maxBytes/);
  assert.match(mediaUploadRoute, /mediaMagicMatches/);
  assert.match(uploadRoute, /requireCmsMutationRequest\(request, \{ requireHeader: true \}\)/);
  assert.match(seedOwner, /pbkdf2Sync/);
  assert.match(seedOwner, /pbkdf2-sha256/);
  assert.match(storage, /cms_media_assets/);
  assert.match(storage, /replaceMediaAsset/);
  assert.match(storage, /deleteMediaAsset/);
  assert.match(storage, /listContent/);
  assert.match(storage, /getRevision\(contentId: string, revisionId: string\): Promise<CmsRevision \| null>/);
  assert.match(storage, /SELECT payload FROM cms_revisions WHERE content_id = \? AND id = \?/);
  assert.match(storage, /draft_payload/);
  assert.match(storage, /publicStatusIsStored/);
  assert.match(storage, /archiveContent/);
  assert.match(storage, /duplicateContent/);
  assert.match(storage, /content\.archive/);
  assert.match(storage, /content\.duplicate/);
  assert.match(storage, /cms_change_requests/);
  assert.match(storage, /idx_cms_change_requests_content_status_created/);
  assert.match(storage, /idx_cms_change_requests_block/);
  assert.match(storage, /listChangeRequests/);
  assert.match(storage, /createChangeRequest/);
  assert.match(storage, /resolveChangeRequest/);
  assert.match(storage, /content\.changeRequest\.create/);
  assert.match(storage, /content\.changeRequest\.resolve/);
  assert.match(storage, /slugExists/);
  assert.match(storage, /nextCopySlug/);
  assert.match(storage, /UPDATE cms_content SET draft_payload = \?/);
  assert.match(storage, /draft_payload = NULL/);
  assert.match(storage, /DELETE FROM cms_preview_tokens WHERE expires_at <= \?/);
  assert.match(storage, /getPreviewContent\(token: string, slug: string, user: CmsRoleHolder\)/);
  assert.match(storage, /userCanReadCmsContent\(user, content\)/);
  assert.match(storage, /pruneRevisions/);
  assert.match(storage, /recordAuditEvent/);
  assert.match(storage, /cms_audit_log/);
  assert.match(storage, /saveMediaAsset/);
  assert.match(storage, /updateMediaAsset/);
  assert.match(storage, /const current = await this\.getMediaAsset\(asset\.id\)/);
  assert.match(storage, /\.\.\.current,[\s\S]*alt: asset\.alt,[\s\S]*caption: asset\.caption,[\s\S]*image: asset\.image/);
  assert.match(storage, /listMediaAssets/);
  assert.match(migration, /draft_payload TEXT/);
  assert.match(migration, /draft_updated_at TEXT/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS cms_media_assets/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS cms_change_requests/);
  assert.match(migration, /idx_cms_change_requests_content_status_created/);
  assert.match(migration, /idx_cms_change_requests_block/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS cms_login_attempts/);
  assert.match(migration, /active INTEGER NOT NULL DEFAULT 1/);
  assert.match(migration, /updated_at TEXT/);
  assert.match(policy, /const PUBLIC_CONTENT_TYPES = new Set<CmsContentType>\(\['page', 'blogPost', 'productList'\]\)/);
  assert.match(policy, /const GLOBAL_CONTENT_TYPES = new Set<CmsContentType>\(\['navigationMenu', 'styleSettings', 'stripeCatalog'\]\)/);
  assert.match(policy, /if \(GLOBAL_CONTENT_TYPES\.has\(type\)\) return user\.role === 'owner' \|\| user\.role === 'admin'/);
  assert.match(policy, /if \(!cmsContentTypeIsPublic\(content\.contentType\)\) return null/);
});

test('CMS validation rejects unsafe content and protects scheduled publishing', async () => {
  const { validateAndSanitizeCmsContent, safeCmsUrl, safeCmsMediaUrl, safeCmsEmbedUrl } = await import(`../../src/lib/cms/validation.ts?case=validation-${Date.now()}`);
  const { contentIsPublished } = await import(`../../src/lib/cms/core.ts?case=published-${Date.now()}`);
  const { cmsSlaquaticsSiteConfig } = await import(`../../src/lib/site-cms/slaquatics.ts?case=validation-site-${Date.now()}`);
  const base = {
    id: 'test-page',
    slug: 'test-page',
    title: 'Test Page',
    contentType: 'page',
    status: 'draft',
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        label: 'Hero',
        props: {
          heading: 'Safe',
          buttons: [{ label: 'Book', href: '/jetski-booking', variant: 'primary' }]
        }
      }
    ],
    createdAt: '2026-06-30T00:00:00.000Z',
    updatedAt: '2026-06-30T00:00:00.000Z'
  };

  assert.equal(validateAndSanitizeCmsContent(base, cmsSlaquaticsSiteConfig).ok, true);
  const accessResult = validateAndSanitizeCmsContent({
    ...base,
    metadata: {
      access: {
        ownerUserId: 'client-owner',
        assignedUserIds: ['client-owner', 'editor-2', '<script>bad</script>'],
        locked: true
      }
    }
  }, cmsSlaquaticsSiteConfig);
  assert.equal(accessResult.ok, true);
  assert.deepEqual(accessResult.content.metadata.access, {
    ownerUserId: 'client-owner',
    assignedUserIds: ['client-owner', 'editor-2', 'script-bad-script'],
    locked: true
  });
  assert.equal(validateAndSanitizeCmsContent({
    ...base,
    blocks: [{ ...base.blocks[0], props: { buttons: [{ label: 'Bad', href: 'javascript:alert(1)' }] } }]
  }, cmsSlaquaticsSiteConfig).ok, false);
  assert.equal(validateAndSanitizeCmsContent({
    ...base,
    blocks: [{ ...base.blocks[0], props: { body: '<script>alert(1)</script>' } }]
  }, cmsSlaquaticsSiteConfig).ok, false);
  assert.equal(validateAndSanitizeCmsContent({
    ...base,
    blocks: [{ ...base.blocks[0], props: { media: { src: 'https://evil.example/tracker.png' } } }]
  }, cmsSlaquaticsSiteConfig).ok, false);
  assert.equal(validateAndSanitizeCmsContent({
    ...base,
    blocks: [{ ...base.blocks[0], props: { mapEmbedUrl: 'https://evil.example/embed' } }]
  }, cmsSlaquaticsSiteConfig).ok, false);
  assert.equal(safeCmsUrl('javascript:alert(1)'), '');
  assert.equal(safeCmsMediaUrl('https://evil.example/tracker.png', cmsSlaquaticsSiteConfig), '');
  assert.match(safeCmsMediaUrl('https://cdn.slaquatics.com/site/images/photo.webp', cmsSlaquaticsSiteConfig), /cdn\.slaquatics\.com/);
  assert.equal(safeCmsEmbedUrl('https://evil.example/embed'), '');
  assert.match(safeCmsEmbedUrl('https://www.google.com/maps/embed?pb=test'), /google\.com/);
  assert.equal(safeCmsEmbedUrl('https://docs.google.com/document/d/example'), '');
  assert.equal(safeCmsEmbedUrl('https://sites.google.com/view/example'), '');
  assert.equal(safeCmsEmbedUrl('https://www.youtube.com/watch?v=abc'), '');
  assert.match(safeCmsEmbedUrl('https://www.youtube.com/embed/abc'), /youtube\.com/);
  assert.equal(contentIsPublished({ ...base, status: 'scheduled', publish: { scheduledAt: '2099-01-01T00:00:00.000Z' } }, new Date('2026-06-30T00:00:00.000Z')), false);
  assert.equal(contentIsPublished({ ...base, status: 'scheduled', publish: { scheduledAt: '2026-01-01T00:00:00.000Z' } }, new Date('2026-06-30T00:00:00.000Z')), true);
  assert.equal(contentIsPublished({ ...base, status: 'published', publish: { expiresAt: '2026-01-01T00:00:00.000Z' } }, new Date('2026-06-30T00:00:00.000Z')), false);
});

test('CMS content access policy isolates client users to assigned content', async () => {
  const {
    applyCmsAccessForSave,
    userCanReadCmsContent,
    userCanWriteCmsContent,
    userCanPublishCmsContent
  } = await import(`../../src/lib/cms/policy.ts?case=acl-${Date.now()}`);
  const now = '2026-06-30T00:00:00.000Z';
  const owner = { id: 'owner-1', role: 'owner' };
  const admin = { id: 'admin-1', role: 'admin' };
  const clientA = { id: 'client-a', role: 'client' };
  const clientB = { id: 'client-b', role: 'client' };
  const assignedPage = {
    id: 'assigned-page',
    slug: 'assigned-page',
    title: 'Assigned Page',
    contentType: 'page',
    status: 'draft',
    blocks: [],
    metadata: {
      access: {
        ownerUserId: 'client-a',
        assignedUserIds: ['client-a']
      }
    },
    createdAt: now,
    updatedAt: now
  };
  const lockedPage = {
    ...assignedPage,
    id: 'locked-page',
    metadata: {
      access: {
        ownerUserId: 'client-a',
        assignedUserIds: ['client-a'],
        locked: true
      }
    }
  };
  const unassignedPage = {
    ...assignedPage,
    id: 'unassigned-page',
    metadata: undefined
  };

  assert.equal(userCanReadCmsContent(clientA, assignedPage), true);
  assert.equal(userCanWriteCmsContent(clientA, assignedPage), true);
  assert.equal(userCanReadCmsContent(clientB, assignedPage), false);
  assert.equal(userCanWriteCmsContent(clientB, assignedPage), false);
  assert.equal(userCanReadCmsContent(clientA, unassignedPage), false);
  assert.equal(userCanWriteCmsContent(clientA, unassignedPage), false);
  assert.equal(userCanWriteCmsContent(admin, lockedPage), true);
  assert.equal(userCanPublishCmsContent(clientA, assignedPage), false);
  assert.equal(userCanPublishCmsContent(admin, assignedPage), true);

  const attemptedEscalation = {
    ...assignedPage,
    metadata: {
      access: {
        ownerUserId: 'client-b',
        assignedUserIds: ['client-a', 'client-b'],
        locked: false
      }
    }
  };
  assert.deepEqual(applyCmsAccessForSave(clientA, attemptedEscalation, assignedPage).metadata.access, assignedPage.metadata.access);
  assert.deepEqual(applyCmsAccessForSave(owner, attemptedEscalation, assignedPage).metadata.access, attemptedEscalation.metadata.access);
  assert.deepEqual(applyCmsAccessForSave(clientA, { ...unassignedPage, metadata: undefined }, null).metadata.access, {
    ownerUserId: 'client-a',
    assignedUserIds: ['client-a']
  });
});

test('CMS export manifest packages portable content and media metadata only', async () => {
  const route = await import(`../../src/app/api/cms/admin/export/route.ts?case=export-${Date.now()}`);
  const now = '2026-06-30T00:00:00.000Z';
  const manifest = route.buildCmsExportManifest({
    siteId: 'example-site',
    exportedAt: now,
    content: [
      {
        id: 'home',
        slug: 'home',
        title: 'Home',
        contentType: 'page',
        status: 'published',
        blocks: [],
        createdAt: now,
        updatedAt: now
      }
    ],
    media: [
      {
        id: 'asset-1',
        key: 'cms/asset.webp',
        url: 'https://cdn.example.com/cms/asset.webp',
        contentType: 'image/webp',
        alt: 'Asset',
        caption: 'Caption',
        uploadedBy: 'editor',
        uploadedAt: now
      }
    ]
  });

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.kind, 'embedded-cms-export');
  assert.equal(manifest.siteId, 'example-site');
  assert.equal(manifest.content.length, 1);
  assert.equal(manifest.media.length, 1);
  assert.equal(JSON.stringify(manifest).includes('password_hash'), false);
  assert.equal(JSON.stringify(manifest).includes('cms_session'), false);
});

test('CMS import manifest validates portable content as safe drafts', async () => {
  const route = await import(`../../src/app/api/cms/admin/import/route.ts?case=import-${Date.now()}`);
  const { cmsSlaquaticsSiteConfig } = await import(`../../src/lib/site-cms/slaquatics.ts?case=import-site-${Date.now()}`);
  const now = '2026-06-30T00:00:00.000Z';
  const plan = route.buildCmsImportPlan({
    kind: 'embedded-cms-export',
    schemaVersion: 1,
    siteId: 'source-site',
    exportedAt: now,
    content: [
      {
        id: 'import-home',
        slug: 'import-home',
        title: 'Imported Home',
        contentType: 'page',
        status: 'published',
        blocks: [
          {
            id: 'intro',
            type: 'rich-text',
            props: { heading: 'Imported', body: 'Safe portable copy.' }
          }
        ],
        createdAt: now,
        updatedAt: now,
        publishedAt: now
      }
    ],
    media: [
      {
        id: 'asset-1',
        key: 'cms/asset.webp',
        url: 'https://cdn.example.com/cms/asset.webp',
        contentType: 'image/webp',
        alt: 'Asset',
        uploadedBy: 'editor',
        uploadedAt: now
      }
    ]
  }, cmsSlaquaticsSiteConfig);

  assert.equal(plan.ok, true);
  assert.equal(plan.sourceSiteId, 'source-site');
  assert.equal(plan.content.length, 1);
  assert.equal(plan.content[0].status, 'draft');
  assert.equal(plan.content[0].publishedAt, undefined);
  assert.equal(plan.media.length, 1);
  assert.ok(plan.warnings.some((warning) => warning.includes('Media metadata')));

  const rejected = route.buildCmsImportPlan({
    kind: 'embedded-cms-export',
    schemaVersion: 1,
    siteId: 'source-site',
    exportedAt: now,
    content: [
      {
        id: 'bad',
        slug: 'bad',
        title: 'Bad',
        contentType: 'page',
        status: 'draft',
        blocks: [
          {
            id: 'bad-button',
            type: 'button-group',
            props: { buttons: [{ label: 'Bad', href: 'javascript:alert(1)' }] }
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ],
    media: []
  }, cmsSlaquaticsSiteConfig);

  assert.equal(rejected.ok, false);
  assert.ok(rejected.errors.some((error) => error.includes('Unsafe CMS content')));
});

test('CMS review request notes are text-only and length-limited', async () => {
  const route = await import(`../../src/app/api/cms/admin/content/[id]/change-requests/route.ts?case=review-note-${Date.now()}`);

  assert.equal(route.sanitizeReviewNote('  Change this headline.  '), 'Change this headline.');
  assert.equal(route.sanitizeReviewNote('<script>alert(1)</script>'), '');
  assert.equal(route.sanitizeReviewNote('<img src=x onerror=alert(1)>'), '');
  assert.equal(route.sanitizeReviewNote('javascript:alert(1)'), '');
  assert.equal(route.sanitizeReviewNote('data:text/html,<b>x</b>'), '');
  assert.equal(route.sanitizeReviewNote('Please use https://evil.example/image.jpg'), '');
  assert.equal(route.sanitizeReviewNote('x'.repeat(2500)).length, 2000);
});

test('CMS editor preview resolves synced patterns and navigation references generically', async () => {
  const { resolveCmsPreviewReferences } = await import(`../../src/lib/cms/preview-references.ts?case=preview-refs-${Date.now()}`);
  const now = '2026-06-30T00:00:00.000Z';
  const page = {
    id: 'preview-page',
    slug: 'preview-page',
    title: 'Preview Page',
    contentType: 'page',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: 'nav-slot',
        type: 'topbar',
        props: {
          menuId: 'main-menu',
          links: [{ label: 'Old', href: '#old' }]
        }
      },
      {
        id: 'pattern-slot',
        type: 'pattern-ref',
        props: {
          patternId: 'booking-cta',
          mode: 'synced'
        }
      },
      {
        id: 'unsafe-page-slot',
        type: 'pattern-ref',
        props: {
          patternId: 'ordinary-page'
        }
      }
    ]
  };
  const menu = {
    id: 'main-menu',
    slug: 'main-menu',
    title: 'Main Menu',
    contentType: 'navigationMenu',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: 'menu-items',
        type: 'navigation-menu',
        props: {
          menuItems: [{ label: 'Book', href: '/#booking' }]
        }
      }
    ]
  };
  const pattern = {
    id: 'booking-cta',
    slug: 'booking-cta',
    title: 'Booking CTA',
    contentType: 'pattern',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: 'cta',
        type: 'cta-band',
        props: {
          heading: 'Book Now'
        }
      }
    ]
  };
  const ordinaryPage = {
    ...page,
    id: 'ordinary-page',
    slug: 'ordinary-page',
    title: 'Ordinary Page',
    contentType: 'page',
    blocks: [
      {
        id: 'should-not-inline',
        type: 'hero',
        props: {
          heading: 'Unsafe'
        }
      }
    ]
  };

  const resolved = resolveCmsPreviewReferences(page, [menu, pattern, ordinaryPage]);

  assert.deepEqual(resolved.blocks[0].props.links, [{ label: 'Book', href: '/#booking' }]);
  assert.equal(resolved.blocks[1].type, 'cta-band');
  assert.equal(resolved.blocks[1].id, 'pattern-slot-cta-0');
  assert.equal(resolved.blocks[1].props.heading, 'Book Now');
  assert.equal(resolved.blocks.some((block) => block.id === 'should-not-inline'), false);

  const previewRefs = readText('src/lib/cms/preview-references.ts');
  assert.match(previewRefs, /allowedPreviewReferenceTypes/);
  assert.match(previewRefs, /contentType === 'navigationMenu'/);
  assert.match(previewRefs, /contentType === 'pattern'/);
  assert.match(previewRefs, /contentType === 'reusableSection'/);
  assert.doesNotMatch(previewRefs, /slaquatics|shoreline|jet\s?ski/i);
});

test('CMS admin UI uses isolated CMS routes and supports the planned editing surfaces', () => {
  for (const file of [
    'src/app/cms/page.tsx',
    'src/app/cms-login/page.tsx',
    'src/app/cms/content/page.tsx',
    'src/app/cms/media/page.tsx',
    'src/app/cms/users/page.tsx',
    'src/app/cms/audit/page.tsx',
    'src/app/cms/navigation/page.tsx',
    'src/app/cms/patterns/page.tsx',
    'src/app/cms/settings/page.tsx',
    'src/app/cms/preview/[token]/[slug]/page.tsx',
    'src/app/blog/page.tsx',
    'src/app/blog/[slug]/page.tsx',
    'src/app/products/page.tsx',
    'src/app/products/[slug]/page.tsx',
    'src/features/cms/CmsPublicContent.tsx'
  ]) {
    assert.ok(existsSync(file), `${file} should exist`);
  }

  const shell = readText('src/features/cms/CmsAdminShell.tsx');
  const editor = readText('src/features/cms/CmsContentEditor.tsx');
  const users = readText('src/features/cms/CmsUserManagement.tsx');
  const auditLog = readText('src/features/cms/CmsAuditLog.tsx');
  const contentPage = readText('src/app/cms/content/page.tsx');
  const slaquaticsEditor = readText('src/features/siteCms/SlaquaticsCmsContentEditor.tsx');
  const slaquaticsRenderer = readText('src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx');
  const mediaLibrary = readText('src/features/cms/CmsMediaLibrary.tsx');
  const renderer = readText('src/features/cms/CmsRenderer.tsx');
  const core = readText('src/lib/cms/core.ts');
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const publicContent = readText('src/features/cms/CmsPublicContent.tsx');
  const blogPage = readText('src/app/blog/page.tsx');
  const blogDetailPage = readText('src/app/blog/[slug]/page.tsx');
  const productsPage = readText('src/app/products/page.tsx');
  const productDetailPage = readText('src/app/products/[slug]/page.tsx');
  const homePage = readText('src/features/home/HomePage.tsx');
  const publicContentLoader = readText('src/app/cms-public-content.ts');
  const defaultContent = readText('src/lib/cms/default-content.ts');
  const protectedPages = [
    'src/app/cms/page.tsx',
    'src/app/cms/content/page.tsx',
    'src/app/cms/media/page.tsx',
    'src/app/cms/users/page.tsx',
    'src/app/cms/audit/page.tsx',
    'src/app/cms/navigation/page.tsx',
    'src/app/cms/patterns/page.tsx',
    'src/app/cms/settings/page.tsx'
  ].map((file) => readText(file)).join('\n');

  assert.match(protectedPages, /requireCmsPageUser/);
  assert.ok(existsSync('src/app/cms/require-cms-page-user.ts'));
  for (const label of [
    'Pages',
    'Sections',
    'Media',
    'Draft',
    'Preview',
    'Publish',
    'Rollback',
    'Hero',
    'Topbar',
    'Buttons',
    'Images',
    'Videos',
    'Breaks',
    'Patterns',
    'Navigation',
    'Stripe',
    'Users',
    'Import',
    'Export'
  ]) {
    assert.match(shell, new RegExp(label));
  }

  for (const control of [
    'CMS content JSON',
    'Live Preview',
    'CMS live page preview',
    'Page-context Preview',
    'CMS saved page preview',
    'selectedBlockId',
    'selectBlock',
    'cms-block-editor-active',
    'Create Content',
    'Content Library',
    'All pages, posts, products, and reusable records',
    'Refresh saved records',
    'loadContentLibrary',
    'libraryFilters',
    'contentMatchesFilters',
    'mergeContentPages',
    'All Types',
    'All Statuses',
    'Search title, slug, tags',
    'role="list"',
    'role="listitem"',
    'data-cms-selected',
    'Review Requests',
    'Request a Change',
    'Selected block',
    'No block selected',
    'loadReviewRequests',
    'submitReviewRequest',
    'resolveReviewRequest',
    'changeRequests',
    'reviewNote',
    '/change-requests',
    '/resolve',
    'Duplicate',
    'Archive',
    'archiveContent',
    'duplicateContent',
    'createLocalDuplicate',
    'nextLocalCopySlug',
    '/archive',
    '/duplicate',
    'Content archived and removed from public publishing.',
    'Content duplicated as a saved draft.',
    'Public',
    'No content matches the current filters.',
    'Create Draft',
    'Import CMS export manifest',
    'Export JSON',
    'Dry Run Import',
    'Import as Drafts',
    'importCmsManifest',
    '/api/cms/admin/import',
    'pattern',
    'navigationMenu',
    'styleSettings',
    'stripeCatalog',
    'blogPost',
    'productList',
    'reusableSection',
    'Find block',
    'Search blocks or patterns',
    'Block Inserter',
    'allowedBlocks',
    'groupBlocksByCategory',
    'blockInserterGroups',
    'No blocks available for this content type.',
    'typeAllowedForContent',
    'Advanced JSON',
    'Add block',
    'Insert pattern',
    'Choose reusable content',
    'cms-save-state',
    'data-cms-dirty',
    'Unsaved changes',
    'Autosaving...',
    'Saved',
    'beforeunload',
    'autosaveDraft',
    'Autosaved draft. Preview is ready.',
    'Autosave failed. Manual save is still available.',
    'Page title',
    'Slug',
    'Status',
    'Schedule publish',
    'Review status',
    'Template',
    'Categories',
    'Tags',
    'Featured image',
    'Social image',
    'Parent slug',
    'Sort order',
    'Read time',
    'Excerpt',
    'SEO title',
    'SEO description',
    'Visible',
    'Up',
    'Down',
    'Remove',
    'Save Draft',
    'Publish',
    'Revisions',
    'Revision history',
    'Rollback',
    'Preview',
    'Replace image or video',
    'Load media library',
    'Choose from loaded media',
    'cms-media-field',
    'cms-media-picker',
    'Image Editing',
    'Focal',
    'Crop',
    '/api/cms/admin/content',
    'contentType',
    'limit\', \'200',
    '/revisions?limit=20',
    '/revisions/${encodeURIComponent(revisionId)}',
    'Revision Compare',
    '/rollback',
    '/api/cms/admin/media?limit=50',
    '/api/cms/admin/media/upload',
    'x-cms-request'
  ]) {
    assert.match(editor, new RegExp(control.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(shell, /href="\/users"/);
  assert.match(shell, /href="\/audit"/);
  assert.match(shell, /href="\/navigation"/);
  assert.match(shell, /href="\/patterns"/);
  assert.match(shell, /href="\/settings"/);
  assert.match(shell, /href="\/content#import"/);
  assert.match(shell, /href="\/api\/cms\/admin\/export"/);
  assert.match(shell, /download/);
  assert.match(shell, /User Management/);
  assert.match(shell, /CmsUserManagement/);
  assert.match(users, /\/api\/cms\/admin\/users/);
  assert.match(users, /\/sessions/);
  assert.match(users, /\/deactivate/);
  assert.match(users, /Create User/);
  assert.match(users, /Deactivate/);
  assert.match(users, /Revoke/);
  assert.match(users, /Client/);
  assert.doesNotMatch(users, /<option value="editor">/);
  assert.match(users, /x-cms-request/);
  assert.match(auditLog, /\/api\/cms\/admin\/audit/);
  assert.match(auditLog, /retry-r2/);
  assert.match(auditLog, /Event filters/);
  assert.match(auditLog, /R2 key/);
  assert.match(protectedPages, /requireCmsPageUser/);
  assert.match(protectedPages, /users\.manage/);
  assert.match(protectedPages, /audit\.read/);

  assert.match(editor, /<CmsRenderer[\s\S]*content=\{previewContent\}[\s\S]*siteConfig=\{siteConfig\}/);
  assert.match(editor, /type RevisionDetail/);
  assert.match(editor, /loadRevisionDetail/);
  assert.match(editor, /revisionDetails\[draft\.id\]/);
  assert.match(editor, /summarizeRevisionChanges/);
  assert.match(editor, /onSelectBlock=\{selectBlock\}/);
  assert.match(editor, /selectedBlockId=\{selectedBlockId\}/);
  assert.match(editor, /renderPreview/);
  assert.match(contentPage, /SlaquaticsCmsContentEditor/);
  assert.match(slaquaticsEditor, /renderPreview/);
  assert.match(slaquaticsEditor, /SlaquaticsCmsEditorPreview/);
  assert.match(slaquaticsRenderer, /function SlaquaticsCmsEditorPreview/);
  assert.match(slaquaticsRenderer, /cms-site-editor-preview/);
  assert.match(slaquaticsRenderer, /data-cms-preview-block-id/);
  assert.match(shell, /CmsMediaLibrary/);
  assert.match(shell, /\/api\/cms\/admin\/logout/);
  for (const mediaControl of [
    'Media Library',
    'Upload image or video',
    'Search media',
    'Search filenames, alt text, captions, or usage',
    'mediaSearch',
    'usedBy',
    'Used by',
    'Save Metadata',
    'Replace file',
    'Force Delete',
    '/replace',
    "method: 'DELETE'",
    '/api/cms/admin/media?limit=100',
    "params.set('q', mediaSearch.trim())",
    '/api/cms/admin/media/upload',
    "method: 'PATCH'",
    'Alt text',
    'Caption',
    'Crop',
    'Focal X',
    'Focal Y'
  ]) {
    assert.match(mediaLibrary, new RegExp(mediaControl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(editor, /createCmsContentTemplate/);
  assert.match(editor, /resolveCmsPreviewReferences/);
  assert.match(editor, /previewContent/);
  assert.match(editor, /Object\.values\(drafts\)/);
  assert.match(editor, /insertReusableContent/);
  assert.match(editor, /source\.contentType === 'pattern'/);
  assert.match(editor, /type: 'pattern-ref'/);
  assert.match(editor, /patternId: source\.slug/);
  assert.match(editor, /mode: 'synced'/);
  assert.match(editor, /reusableContent/);
  assert.match(editor, /mediaAssets=\{mediaAssets\}/);
  assert.match(core, /export type CmsFieldControl/);
  assert.match(core, /export type CmsFieldSchema/);
  assert.match(core, /fieldSchema\?: Record<string, CmsFieldSchema>/);
  assert.match(core, /allowedContentTypes\?: CmsContentType\[\]/);
  assert.match(adapter, /const sharedFieldSchema/);
  assert.match(adapter, /function blockSchema/);
  assert.match(adapter, /allowedContentTypes: \['navigationMenu'\]/);
  assert.match(adapter, /allowedContentTypes: \['styleSettings'\]/);
  assert.match(adapter, /allowedContentTypes: \['stripeCatalog'\]/);
  assert.match(adapter, /fieldSchema: blockSchema/);
  assert.match(adapter, /checkoutMode:[\s\S]*control: 'select'/);
  assert.match(adapter, /editableAmounts: \{ control: 'boolean' \}/);
  assert.match(adapter, /durationHours: \{ control: 'number'/);
  assert.match(editor, /schema=\{mergedFieldSchema\(field, definition\?\.fieldSchema\?\.\[field\]\)\}/);
  assert.match(editor, /resolvedSchema\?\.control === 'select'/);
  assert.match(editor, /resolvedSchema\?\.control === 'boolean'/);
  assert.match(editor, /resolvedSchema\?\.control === 'number'/);
  assert.match(editor, /resolvedSchema\?\.control === 'textarea'/);
  assert.match(editor, /function MediaAssetPicker/);
  assert.match(editor, /function mediaFieldValue/);
  assert.match(editor, /schema\?\.mediaValue === 'id' \|\| field === 'assetId' \? asset\.id : asset\.url \|\| asset\.key/);
  assert.match(editor, /function fieldAcceptsMedia/);
  assert.match(editor, /'featuredImage'/);
  assert.match(editor, /'socialImage'/);
  assert.match(shell, /siteConfig/);
  assert.match(publicContent, /CmsPublicArchive/);
  assert.match(publicContent, /CmsPublicDetail/);
  assert.match(publicContent, /CmsRenderer/);
  assert.match(homePage, /home-stripe-catalog/);
  assert.match(publicContentLoader, /publishedOnly: true/);
  assert.match(publicContentLoader, /fallbackPublishedCmsContent/);
  assert.match(publicContentLoader, /activeCmsSiteAdapter\.fallbackContent/);
  assert.match(publicContentLoader, /contentIsPublished/);
  assert.match(blogPage, /listPublishedCmsContent\('blogPost'\)/);
  assert.match(productsPage, /listPublishedCmsContent\('productList'\)/);
  assert.match(blogDetailPage, /content\.contentType !== 'blogPost'/);
  assert.match(productDetailPage, /content\.contentType !== 'productList'/);
  assert.match(blogDetailPage, /activeCmsSiteAdapter\.loadContent/);
  assert.match(productDetailPage, /activeCmsSiteAdapter\.loadContent/);
  assert.match(defaultContent, /createCmsContentTemplate/);
  assert.match(defaultContent, /page: \['topbar', 'hero', 'rich-text', 'cta-band'\]/);
  assert.match(defaultContent, /blogPost: \['hero', 'rich-text', 'image', 'cta-band'\]/);
  assert.match(defaultContent, /productList: \['hero', 'product-list', 'faq', 'cta-band'\]/);
  assert.match(defaultContent, /reusableSection: \['rich-text', 'button-group', 'image'\]/);
  assert.match(defaultContent, /pattern: \['rich-text', 'button-group'\]/);
  assert.match(defaultContent, /navigationMenu: \['navigation-menu'\]/);
  assert.match(defaultContent, /styleSettings: \['style-tokens'\]/);
  assert.match(defaultContent, /stripeCatalog: \['stripe-product-list'\]/);

  for (const implementationDetail of [
    'function BlockFields',
    'function FieldEditor',
    'function CollectionEditor',
    'function StringListEditor',
    'function ObjectEditor',
    'defaultCollectionItem'
  ]) {
    assert.match(editor, new RegExp(implementationDetail));
  }

  for (const rendererCoverage of [
    "block.type === 'topbar'",
    "block.type === 'video'",
    "block.type === 'break'",
    'cms-renderer-button'
  ]) {
    assert.match(renderer, new RegExp(rendererCoverage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(renderer, /data-cms-preview-block-id/);
  assert.match(renderer, /cms-renderer-selectable-active/);
  assert.match(renderer, /onSelectBlock/);
});

test('CMS admin shell follows the provided Apple Minimal design reference', () => {
  assert.ok(existsSync('design.md'), 'design.md should exist as the CMS design reference');

  const design = readText('design.md');
  const globals = readText('src/app/globals.css');

  assert.match(design, /name: Apple Minimal/);
  assert.match(design, /primary: "#0071e3"/);
  assert.match(design, /surface: "#f5f5f7"/);
  assert.match(design, /rounded\.full/);
  assert.match(design, /Don't introduce gradients, heavy shadows, or noisy textures/);

  for (const token of [
    '--cms-primary: #0071e3',
    '--cms-primary-hover: #0066cc',
    '--cms-text: #1d1d1f',
    '--cms-muted: #6e6e73',
    '--cms-neutral: #ffffff',
    '--cms-surface: #f5f5f7',
    '--cms-border: #e5e7eb',
    '--cms-radius-full: 9999px',
    '.cms-save-state',
    '[data-cms-dirty="true"]',
    '.cms-media-field',
    '.cms-media-picker',
    '.cms-field-help',
    '.cms-public-page',
    '.cms-public-grid',
    '.cms-public-card',
    'SF Pro Text',
    'SF Pro Display'
  ]) {
    assert.match(globals, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(globals, /\.cms-admin-shell[\s\S]*background: var\(--cms-surface\)/);
  assert.match(globals, /\.cms-block-editor-active[\s\S]*border-color: var\(--cms-primary\)/);
  assert.match(globals, /\.cms-renderer-selectable-active::after[\s\S]*box-shadow/);
  assert.match(globals, /\.cms-form button[\s\S]*border-radius: var\(--cms-radius-full\)/);
  assert.match(globals, /\.cms-renderer-button[\s\S]*min-height: 44px/);
  assert.doesNotMatch(globals, /#09131f|#0d1b2a|#020617|#f59e0b|#38bdf8/);
});

test('Slaquatics CMS registry covers every public editable site page with WordPress-style blocks', async () => {
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const renderer = readText('src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx');
  const editor = readText('src/features/cms/CmsContentEditor.tsx');
  const registry = await import(`../../src/lib/site-cms/slaquatics.ts?case=registry-${Date.now()}`);
  const expectedSlugs = [
    'home',
    'jetski-booking',
    'jetski-booking-confirmation',
    'booking-thank-you',
    'waiver',
    'privacy-policy',
    'jet-ski-rental-denton',
    'jet-ski-rental-frisco',
    'jet-ski-rental-lewisville',
    'ops-login'
  ];

  assert.match(adapter, /CMS_SLAQUATICS_PAGE_CONTENT/);
  assert.match(adapter, /getSlaquaticsCmsFallbackContent/);
  const slugs = registry.CMS_SLAQUATICS_PAGE_CONTENT.map((content) => content.slug);
  for (const slug of expectedSlugs) {
    assert.ok(slugs.includes(slug), `${slug} should have editable CMS fallback content`);
  }
  const allBlocks = registry.CMS_SLAQUATICS_PAGE_CONTENT.flatMap((content) => content.blocks);
  const blockTypes = new Set(allBlocks.map((block) => block.type));
  for (const blockType of [
    'topbar',
    'hero',
    'rich-text',
    'image',
    'video',
    'button-group',
    'break',
    'cta-band',
    'service-list',
    'faq',
    'booking-entry',
    'booking-flow-panel',
    'waiver-payment-summary',
    'location-directions',
    'safety-requirements',
    'stripe-product-list'
  ]) {
    assert.ok(blockTypes.has(blockType), `${blockType} should be available in fallback content`);
  }
  for (const blockType of [
    'product-list',
    'rental-offering-list',
    'rental-product-cards',
    'booking-package-selector',
    'availability-checker',
    'live-availability-panel',
    'availability-waiver-payment-cta',
    'rental-rate-table',
    'reviews-social',
    'review-carousel',
    'add-ons',
    'addon-list',
    'booking-add-on-catalog',
    'policy-list',
    'policy-card-list',
    'rental-package-builder',
    'rental-offering-cards',
    'local-service-area-page',
    'seasonal-rental-offer',
    'review-summary-carousel',
    'rental-waiver-checklist',
    'rental-policy-cards',
    'trust-metric-bar',
    'rental-process-steps',
    'value-prop-grid',
    'seasonal-offer-banner',
    'location-service-area',
    'waiver-checklist',
    'navigation-menu',
    'pattern-ref',
    'style-tokens',
    'stripe-catalog-display',
    'stripe-checkout-products'
  ]) {
    assert.match(adapter, new RegExp(`type: '${blockType}'`), `${blockType} should be registered for Slaquatics`);
  }
  for (const businessField of [
    'baseRateCents',
    'depositCents',
    'processingFeeCents',
    'ctaHrefTemplate',
    'stripePriceId',
    'amountCents',
    'addonKey',
    'appliesToCraft',
    'termsVersion',
    'checkboxes',
    'offerKey',
    'eligibleCraft',
    'driveTime',
    'canonicalHref',
    'policyKey',
    'effectiveDate'
  ]) {
    assert.match(adapter, new RegExp(businessField), `${businessField} should be modeled in business-specific CMS block schemas`);
  }
  for (const promotedBlock of [
    'rental-package-builder',
    'rental-offering-cards',
    'local-service-area-page',
    'seasonal-rental-offer',
    'review-summary-carousel',
    'rental-waiver-checklist',
    'rental-policy-cards',
    'trust-metric-bar',
    'rental-process-steps',
    'value-prop-grid'
  ]) {
    assert.match(renderer, new RegExp(promotedBlock), `${promotedBlock} should have a renderer path`);
  }
  assert.match(adapter, /legalItems: \{ control: 'stringList' \}/);
  assert.match(adapter, /addons: \{ control: 'collection'/);
  assert.match(editor, /schema\.control === 'stringList'/);
  assert.match(adapter, /Stripe Product Display Catalog/);
  assert.match(adapter, /checkout amounts remain server-owned/);
  assert.match(renderer, /function renderBookingPackageSelector/);
  assert.match(renderer, /function renderRentalRateTable/);
  assert.match(renderer, /function renderBusinessCardList/);
  assert.match(renderer, /function renderAvailabilityChecker/);
  assert.match(renderer, /function renderWaiverPaymentCta/);
  assert.match(renderer, /data-pricing-source/);
  assert.match(renderer, /data-availability-source/);
  assert.match(renderer, /\/api\/public\/availability/);
  assert.match(renderer, /href=\{safeCmsUrl\(props\.mapsUrl\)\}/);
  assert.match(renderer, /availability-slot-grid/);
  assert.match(renderer, /availability-spotlight-copy/);
  assert.match(renderer, /data-cta-mode/);
  assert.doesNotMatch(renderer, /block\.type === 'booking-entry' \|\| block\.type === 'booking-package-selector'/);
  const buttons = allBlocks.flatMap((block) => Array.isArray(block.props?.buttons) ? block.props.buttons : []);
  assert.ok(buttons.some((button) => button.image), 'button images should be editable in the CMS model');
});

test('A second-site adapter can configure generic CMS blocks without changing CMS core', async () => {
  const core = readText('src/lib/cms/core.ts');
  const genericAdapter = readText('src/lib/site-cms/generic-example.ts');
  const example = await import(`../../src/lib/site-cms/generic-example.ts?case=generic-${Date.now()}`);

  assert.match(genericAdapter, /createCmsSiteConfig/);
  assert.doesNotMatch(genericAdapter, /slaquatics|shoreline/i);
  assert.doesNotMatch(core, /generic-example|genericExampleCmsSiteConfig/);
  assert.equal(example.genericExampleCmsSiteConfig.siteId, 'generic-example');
  assert.ok(example.genericExampleCmsSiteConfig.blocks.some((block) => block.type === 'product-list'));
  assert.ok(example.genericExampleCmsContent.blocks.some((block) => block.type === 'hero'));
  assert.ok(example.genericExampleCmsContent.blocks.some((block) => block.type === 'product-list'));
});

test('Stripe product CMS surface does not make checkout math CMS-owned', () => {
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const checkoutRoute = readText('src/app/api/public/create-checkout-session/route.ts');
  const stripePayments = readText('src/lib/ops/stripe-payments.ts');

  assert.match(adapter, /stripe-product-list/);
  assert.match(adapter, /stripe-catalog-display/);
  assert.match(adapter, /editableAmounts/);
  assert.match(adapter, /stripeProductId/);
  assert.match(adapter, /stripePriceId/);
  assert.match(adapter, /stripeLookupKey/);
  assert.match(adapter, /createRentalProductListContent/);
  assert.match(adapter, /contentType: 'productList'/);
  assert.match(adapter, /slug: 'rentals'/);
  assert.match(adapter, /Checkout totals still come from the booking system/);
  assert.match(adapter, /Amounts remain server-owned/);
  assert.match(checkoutRoute, /createStripeCheckoutSession/);
  assert.match(checkoutRoute, /unit_amount: 5000/);
  assert.match(checkoutRoute, /unit_amount: 500/);
  assert.doesNotMatch(checkoutRoute, /cms/i);
  assert.match(stripePayments, /priceForSelection/);
});

test('Booking and waiver panels use CMS-owned copy while runtime payment behavior stays code-owned', async () => {
  const bookingPageRoute = readText('src/app/jetski-booking/page.tsx');
  const confirmationPageRoute = readText('src/app/jetski-booking-confirmation/page.tsx');
  const bookingPage = readText('src/features/jetskiBooking/JetskiBookingPage.tsx');
  const confirmationPage = readText('src/features/jetskiBookingConfirmation/JetskiBookingConfirmationPage.tsx');
  const bookingForm = readText('src/features/jetskiBooking/components/JetskiBookingFormCard.tsx');
  const confirmationForm = readText('src/features/jetskiBookingConfirmation/components/JetskiBookingConfirmationForm.tsx');
  const helper = readText('src/lib/site-cms/booking-panels.ts');
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const registry = await import(`../../src/lib/site-cms/slaquatics.ts?case=booking-panels-${Date.now()}`);
  const helpers = await import(`../../src/lib/site-cms/booking-panels.ts?case=booking-helper-${Date.now()}`);
  const bookingContent = registry.getSlaquaticsCmsFallbackContent('jetski-booking');
  const confirmationContent = registry.getSlaquaticsCmsFallbackContent('jetski-booking-confirmation');

  assert.match(bookingPageRoute, /loadSlaquaticsCmsContent\('jetski-booking'\)/);
  assert.match(bookingPageRoute, /bookingFlowPanelFromCms/);
  assert.match(confirmationPageRoute, /loadSlaquaticsCmsContent\('jetski-booking-confirmation'\)/);
  assert.match(confirmationPageRoute, /waiverPaymentSummaryFromCms/);
  assert.match(bookingPage, /bookingPanel/);
  assert.match(confirmationPage, /waiverPaymentSummary/);
  assert.match(bookingForm, /BookingFlowPanelContent/);
  assert.match(bookingForm, /content\.submitLabel/);
  assert.match(bookingForm, /id="booking-form"/);
  assert.match(bookingForm, /id=\{addonInputIds\[addon\.id\]\}/);
  assert.match(confirmationForm, /WaiverPaymentSummaryContent/);
  assert.match(confirmationForm, /safeCmsUrl\(content\.waiverTermsHref\)/);
  assert.match(confirmationForm, /id="waiver-payment-form"/);
  assert.match(confirmationForm, /id="stripe-link"/);
  assert.match(helper, /defaultBookingFlowPanelContent/);
  assert.match(helper, /defaultWaiverPaymentSummaryContent/);
  assert.match(helper, /findBlockProps\(content, 'booking-flow-panel'\)/);
  assert.match(helper, /findBlockProps\(content, 'waiver-payment-summary'\)/);
  assert.match(adapter, /jetski-booking-flow-panel/);
  assert.match(adapter, /jetski-booking-waiver-payment-summary/);
  assert.equal(helpers.bookingFlowPanelFromCms(bookingContent).submitLabel, 'Continue To Contact + Waiver');
  assert.equal(helpers.waiverPaymentSummaryFromCms(confirmationContent).submitLabel, 'Pay $55 today');

  const bookingPanelSource = adapter.match(/id: 'jetski-booking-flow-panel'[\s\S]*?id: 'jetski-booking-waiver-payment-summary'/)?.[0] || '';
  assert.doesNotMatch(bookingPanelSource, /stripePriceId|stripeProductId|initialPrice|total=/);
  assert.doesNotMatch(bookingForm, /fetch\(|create-checkout-session|stripePriceId|stripeProductId/);
  assert.doesNotMatch(confirmationForm, /create-checkout-session|stripePriceId|stripeProductId|initialPrice/);
});

test('CMS public API can fall back to checked-in page content without exposing drafts', () => {
  const publicRoute = readText('src/app/api/cms/public/[slug]/route.ts');
  const publicListRoute = readText('src/app/api/cms/public/route.ts');
  const policy = readText('src/lib/cms/policy.ts');
  const storage = readText('src/lib/cms/storage.ts');

  assert.match(publicRoute, /activeCmsSiteAdapter\.loadContent/);
  assert.match(publicRoute, /toPublicCmsContent/);
  assert.doesNotMatch(publicRoute, /getDraftContent/);
  assert.match(publicListRoute, /store\.listContent/);
  assert.match(publicListRoute, /publishedOnly: true/);
  assert.match(publicListRoute, /cmsContentTypeIsPublic/);
  assert.match(publicListRoute, /content\.map\(toPublicCmsContent\)\.filter\(Boolean\)/);
  assert.doesNotMatch(publicListRoute, /requireCmsPermission/);
  assert.match(policy, /\['page', 'blogPost', 'productList'\]/);
  assert.doesNotMatch(policy.match(/const PUBLIC_CONTENT_TYPES[^\n]+/)?.[0] || '', /stripeCatalog|navigationMenu|styleSettings|pattern/);
  assert.match(storage, /publishedOnly\?: boolean/);
  assert.match(storage, /options\.publishedOnly \? row\.payload : row\.draft_payload \|\| row\.payload/);
  assert.match(storage, /contentIsPublished\(content\)/);
});

test('Slaquatics CMS loader prefers live published content and falls back safely', async () => {
  const registry = await import(`../../src/lib/site-cms/slaquatics.ts?case=loader-${Date.now()}`);
  const liveContent = {
    ...registry.CMS_SLAQUATICS_PAGE_CONTENT[0],
    id: 'live-home',
    title: 'Live CMS home'
  };
  const live = await registry.loadSlaquaticsCmsContent('home', async () => ({
    getPublishedContent: async () => liveContent
  }));
  const fallback = await registry.loadSlaquaticsCmsContent('home', async () => {
    throw new Error('CMS_DB unavailable');
  });

  assert.equal(live.id, 'live-home');
  assert.equal(live.title, 'Live CMS home');
  assert.equal(fallback.slug, 'home');
});

test('Slaquatics shared CMS references resolve only reusable published records or checked-in shared fallbacks', async () => {
  const registry = await import(`../../src/lib/site-cms/slaquatics.ts?case=references-${Date.now()}`);
  const now = '2026-06-30T00:00:00.000Z';
  const page = {
    id: 'reference-test-page',
    slug: 'reference-test-page',
    title: 'Reference Test Page',
    contentType: 'page',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: 'reference-topbar',
        type: 'topbar',
        props: {
          menuId: 'main-navigation-live',
          links: [{ label: 'Old Link', href: '#old' }]
        }
      },
      {
        id: 'reference-pattern-slot',
        type: 'pattern-ref',
        props: {
          patternId: 'promo-pattern-live'
        }
      }
    ]
  };
  const liveMenu = {
    id: 'main-navigation-live',
    slug: 'main-navigation-live',
    title: 'Live Main Navigation',
    contentType: 'navigationMenu',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: 'live-menu',
        type: 'navigation-menu',
        props: {
          menuItems: [{ label: 'Book', href: '/#booking' }]
        }
      }
    ]
  };
  const livePattern = {
    id: 'promo-pattern-live',
    slug: 'promo-pattern-live',
    title: 'Live Promo Pattern',
    contentType: 'pattern',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: 'promo-cta',
        type: 'cta-band',
        props: {
          heading: 'Live Promo',
          buttons: [{ label: 'Book Now', href: '/#booking', variant: 'primary' }]
        }
      }
    ]
  };
  const liveStyle = {
    id: 'shoreline-theme-live',
    slug: 'shoreline-theme',
    title: 'Live Theme',
    contentType: 'styleSettings',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: 'live-style-tokens',
        type: 'style-tokens',
        props: {
          styleTokens: {
            gold: '#abc123',
            blue: '#123456',
            green: '#0f8a5f',
            ink: '#102033',
            unsafe: 'url(javascript:alert(1))'
          }
        }
      }
    ]
  };
  const calls = [];
  const resolved = await registry.resolveSlaquaticsCmsReferences(page, {
    getPublishedContent: async (slug) => {
      calls.push(slug);
      if (slug === 'main-navigation-live') return liveMenu;
      if (slug === 'promo-pattern-live') return livePattern;
      if (slug === 'shoreline-theme') return liveStyle;
      return null;
    }
  });

  assert.deepEqual(calls, ['main-navigation-live', 'promo-pattern-live', 'shoreline-theme']);
  assert.deepEqual(resolved.blocks[0].props.links, [{ label: 'Book', href: '/#booking' }]);
  assert.equal(resolved.blocks[1].type, 'cta-band');
  assert.equal(resolved.blocks[1].id, 'reference-pattern-slot-promo-cta-0');
  assert.equal(resolved.blocks[1].props.heading, 'Live Promo');
  assert.equal(resolved.blocks.at(-1).type, 'style-tokens');
  assert.equal(resolved.blocks.at(-1).props.styleTokens.gold, '#abc123');
  assert.equal(resolved.blocks.at(-1).props.styleTokens.unsafe, undefined);

  const fallbackResolved = await registry.resolveSlaquaticsCmsReferences({
    ...page,
    blocks: [
      { ...page.blocks[0], props: { menuId: 'main-navigation', links: [] } },
      { ...page.blocks[1], props: { patternId: 'lake-day-cta-pattern' } }
    ]
  });
  assert.equal(fallbackResolved.blocks[0].props.links.some((link) => link.label === 'Fleet'), true);
  assert.equal(fallbackResolved.blocks[1].props.heading, 'Ready to get on Lake Lewisville?');
  assert.equal(fallbackResolved.blocks.at(-1).type, 'style-tokens');
  assert.equal(fallbackResolved.blocks.at(-1).props.styleTokens.gold, '#f7c948');

  const unsafeResolved = await registry.resolveSlaquaticsCmsReferences({
    ...page,
    blocks: [
      { ...page.blocks[0], props: { menuId: 'home', links: [{ label: 'Keep Me', href: '#keep' }] } },
      { ...page.blocks[1], props: { patternId: 'home' } }
    ]
  }, {
    getPublishedContent: async () => ({
      ...page,
      id: 'not-shared',
      slug: 'home',
      title: 'Not Shared',
      contentType: 'page',
      blocks: [{ id: 'should-not-render', type: 'hero', props: { heading: 'Unsafe' } }]
    })
  });
  assert.deepEqual(unsafeResolved.blocks[0].props.links, [{ label: 'Keep Me', href: '#keep' }]);
  assert.equal(unsafeResolved.blocks.some((block) => block.id.includes('should-not-render')), false);
  assert.equal(unsafeResolved.blocks.at(-1).type, 'style-tokens');
});

test('Every public page renders visible content from CMS-backed page sections by slug', () => {
  const pageFiles = new Map([
    ['home', 'src/features/home/HomePage.tsx'],
    ['jetski-booking', 'src/features/jetskiBooking/JetskiBookingPage.tsx'],
    ['jetski-booking-confirmation', 'src/features/jetskiBookingConfirmation/JetskiBookingConfirmationPage.tsx'],
    ['booking-thank-you', 'src/features/bookingThankYou/BookingThankYouPage.tsx'],
    ['waiver', 'src/features/waiver/WaiverPage.tsx'],
    ['privacy-policy', 'src/features/privacyPolicy/PrivacyPolicyPage.tsx'],
    ['jet-ski-rental-denton', 'src/features/jetSkiRentalDenton/JetSkiRentalDentonPage.tsx'],
    ['jet-ski-rental-frisco', 'src/features/jetSkiRentalFrisco/JetSkiRentalFriscoPage.tsx'],
    ['jet-ski-rental-lewisville', 'src/features/jetSkiRentalLewisville/JetSkiRentalLewisvillePage.tsx'],
    ['ops-login', 'src/features/opsLogin/OpsLoginPage.tsx']
  ]);

  for (const [slug, file] of pageFiles.entries()) {
    const source = readText(file);
    assert.match(source, /SlaquaticsCmsPublicPageSection/, `${file} should import and mount the CMS public page section`);
    assert.match(source, new RegExp(`slug="${slug}"`), `${file} should mount CMS content for ${slug}`);
  }

  const wrapper = readText('src/features/siteCms/SlaquaticsCmsPublicPageSection.tsx');
  const publicRenderer = readText('src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx');
  assert.match(wrapper, /async function SlaquaticsCmsPublicPageSection/);
  assert.match(wrapper, /loadSlaquaticsCmsContent/);
  assert.doesNotMatch(publicRenderer, /loadSlaquaticsCmsContent/);
  assert.match(wrapper, /includeTypes/);
  assert.match(wrapper, /excludeTypes/);
});

test('Slaquatics renderer applies style token blocks without rendering token records as page content', () => {
  const renderer = readText('src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx');

  assert.match(renderer, /function styleFromTokens/);
  assert.match(renderer, /allowedStyleTokenNames/);
  assert.match(renderer, /safeColor/);
  assert.match(renderer, /--gold/);
  assert.match(renderer, /--blue/);
  assert.match(renderer, /--green/);
  assert.match(renderer, /--ink/);
  assert.match(renderer, /style=\{style\}/);
  assert.match(renderer, /block\.type !== 'style-tokens'/);
  assert.match(renderer, /cms-site-editor-preview/);
});


test('Functional public pages no longer append generic CMS content after hardcoded hero/topbar chrome', () => {
  const replacements = new Map([
    ['src/features/jetskiBooking/JetskiBookingPage.tsx', ['JetskiBookingHero', 'JetskiBookingTopbar']],
    ['src/features/jetskiBookingConfirmation/JetskiBookingConfirmationPage.tsx', ['JetskiBookingConfirmationHero', 'JetskiBookingConfirmationTopbar']],
    ['src/features/bookingThankYou/BookingThankYouPage.tsx', ['BookingThankYouHero', 'BookingThankYouTopbar']],
    ['src/features/waiver/WaiverPage.tsx', ['WaiverHero', 'WaiverTopbar']],
    ['src/features/privacyPolicy/PrivacyPolicyPage.tsx', ['PrivacyPolicyContent', 'PrivacyPolicyBrandLink']],
    ['src/features/opsLogin/OpsLoginPage.tsx', ['OpsLoginHero']],
    ['src/features/jetSkiRentalDenton/JetSkiRentalDentonPage.tsx', ['CityRentalPage']],
    ['src/features/jetSkiRentalFrisco/JetSkiRentalFriscoPage.tsx', ['CityRentalPage']],
    ['src/features/jetSkiRentalLewisville/JetSkiRentalLewisvillePage.tsx', ['CityRentalPage']]
  ]);

  for (const [file, removedComponents] of replacements.entries()) {
    const source = readText(file);
    assert.match(source, /SlaquaticsCmsPublicPageSection/);
    for (const component of removedComponents) {
      assert.doesNotMatch(source, new RegExp(`import \\{ ${component} \\}`), `${file} should not import ${component}`);
      assert.doesNotMatch(source, new RegExp(`<${component}\\b`), `${file} should not render ${component}`);
    }
  }
});

test('Homepage static marketing sections are represented as CMS-owned blocks', () => {
  const page = readText('src/features/home/HomePage.tsx');
  const homePage = readText('src/features/home/HomePage.tsx');
  const bookingCalculator = readText('src/features/home/components/HomeBookingCalculator.tsx');
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const renderer = readText('src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx');

  for (const removedComponent of [
    'HomeNav',
    'HomeMobileNav',
    'HomeTrustBar',
    'HomeAddOnsSection',
    'HomeHowSection',
    'HomeWhySection',
    'HomeLocationSection',
    'HomeFaqSection',
    'HomeCtaBand',
    'HomeFooter',
    'HomeMobileCtaBar',
    'HomeReviewsSection',
    'HomeInstagramSection'
  ]) {
    assert.doesNotMatch(page, new RegExp(`import \\{ ${removedComponent} \\}`));
    assert.doesNotMatch(page, new RegExp(`<${removedComponent}\\b`));
  }

  for (const blockId of [
    'home-topbar',
    'home-hero',
    'home-booking-packages',
    'home-trust',
    'home-addons',
    'home-how',
    'home-why',
    'home-location',
    'home-faq',
    'home-final-cta',
    'home-mobile-nav',
    'home-footer',
    'home-mobile-cta',
    'home-reviews',
    'home-instagram'
  ]) {
    assert.match(`${page}\n${bookingCalculator}`, new RegExp(blockId));
    assert.match(adapter, new RegExp(blockId));
  }

  for (const layout of [
    'home-nav',
    'home-hero',
    'trust-bar',
    'home-addons',
    'home-steps',
    'home-why',
    'home-location',
    'home-faq',
    'home-cta',
    'mobile-nav',
    'site-footer',
    'mobile-cta',
    'home-reviews',
    'home-social-gallery'
  ]) {
    assert.match(renderer, new RegExp(layout));
  }
  assert.match(bookingCalculator, /loadSlaquaticsCmsContent\('home'\)/);
  assert.match(bookingCalculator, /bookingCalculatorFromCms/);
  assert.match(bookingCalculator, /data-pricing-source=\{content\.pricingSource\}/);
  assert.match(bookingCalculator, /id=\{`tab-\$\{tab\.id\}`\}/);
  assert.match(bookingCalculator, /id=\{`panel-\$\{tab\.id\}`\}/);
  assert.match(bookingCalculator, /data-craft/);
  assert.match(bookingCalculator, /data-hours/);
  assert.match(bookingCalculator, /data-drone/);
  assert.match(bookingCalculator, /fallbackOption/);
  assert.match(bookingCalculator, /initialPrice: fallback\.result\.initialPrice/);
  assert.match(bookingCalculator, /bookHref: fallback\.result\.bookHref/);
  assert.match(homePage, /home-stripe-catalog/);
  assert.doesNotMatch(adapter.match(/id: 'home-booking-packages'[\s\S]*?id: 'home-stripe-catalog'/)?.[0] || '', /initialPrice|depositItems|bookHref|stripePriceId|stripeProductId|total=/);
});

test('Ops install banner presentation is CMS-owned while login form remains code-owned', () => {
  const page = readText('src/features/opsLogin/OpsLoginPage.tsx');
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const renderer = readText('src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx');

  assert.doesNotMatch(page, /OpsLoginInstallBanner/);
  assert.match(page, /OpsLoginPanel/);
  assert.match(page, /ops-login-install-banner/);
  assert.match(adapter, /ops-login-install-banner/);
  assert.match(renderer, /ops-install-banner/);
  assert.match(renderer, /install-banner-close/);
});

test('Thank-you and waiver helper content is CMS-owned while runtime forms remain code-owned', () => {
  const thankYouPage = readText('src/features/bookingThankYou/BookingThankYouPage.tsx');
  const waiverPage = readText('src/features/waiver/WaiverPage.tsx');
  const adapter = readText('src/lib/site-cms/slaquatics.ts');
  const renderer = readText('src/features/siteCms/SlaquaticsCmsPublicRenderer.tsx');

  for (const removedComponent of ['BookingThankYouConfirmation', 'BookingThankYouArrival', 'BookingThankYouLaunchPhoto']) {
    assert.doesNotMatch(thankYouPage, new RegExp(`import \\{ ${removedComponent} \\}`));
    assert.doesNotMatch(thankYouPage, new RegExp(`<${removedComponent}\\b`));
  }
  assert.match(thankYouPage, /BookingThankYouSummary/);

  for (const removedComponent of ['WaiverSuccessCard', 'WaiverTerms']) {
    assert.doesNotMatch(waiverPage, new RegExp(`import \\{ ${removedComponent} \\}`));
    assert.doesNotMatch(waiverPage, new RegExp(`<${removedComponent}\\b`));
  }
  assert.match(waiverPage, /WaiverFormSection/);

  for (const blockId of [
    'booking-thank-you-confirmation-copy',
    'booking-thank-you-arrival',
    'booking-thank-you-launch-photo',
    'waiver-success-copy',
    'waiver-terms'
  ]) {
    assert.match(adapter, new RegExp(blockId));
    assert.match(`${thankYouPage}\n${waiverPage}`, new RegExp(blockId));
  }

  for (const layout of ['thank-you-confirmation', 'thank-you-arrival', 'thank-you-photo', 'waiver-success', 'waiver-legal']) {
    assert.match(renderer, new RegExp(layout));
  }
});
