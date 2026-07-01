import type { ReactNode } from 'react';
import type { CmsBlockDefinition, CmsContent, CmsSiteConfig } from '../../lib/cms/core.ts';
import { CmsContentEditor } from './CmsContentEditor';
import { CmsMediaLibrary } from './CmsMediaLibrary';
import { CmsUserManagement } from './CmsUserManagement';

const editingSurfaces = [
  'Pages',
  'Sections',
  'Media',
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
];

const workflow = ['Draft', 'Preview', 'Publish', 'Rollback'];

type CmsAdminShellProps = {
  view?: 'dashboard' | 'content' | 'media' | 'users' | 'login';
  pages?: { slug: string; title: string; content?: CmsContent }[];
  blockLabels?: string[];
  blocks?: CmsBlockDefinition[];
  siteConfig?: CmsSiteConfig;
  children?: ReactNode;
};

export function CmsAdminShell({ view = 'dashboard', pages = [], blockLabels = [], blocks = [], siteConfig, children }: CmsAdminShellProps) {
  if (view === 'login') {
    return (
      <main className="cms-admin-shell cms-admin-login">
        <section className="cms-panel">
          <div className="cms-kicker">CMS Login</div>
          <h1>Sign in to edit content</h1>
          <form action="/api/cms/admin/login" method="post" className="cms-form">
            <label>Email<input name="email" type="email" required /></label>
            <label>Password<input name="password" type="password" required /></label>
            <button type="submit">Sign in</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="cms-admin-shell">
      <aside className="cms-sidebar">
        <div className="cms-brand">Content Studio</div>
        <a href="/">Dashboard</a>
        <a href="/content">Content</a>
        <a href="/media">Media</a>
        <a href="/users">Users</a>
        <a href="/content#import">Import</a>
        <a href="/api/cms/admin/export" download>Export</a>
        <form action="/api/cms/admin/logout" method="post" className="cms-sidebar-form">
          <button type="submit">Logout</button>
        </form>
      </aside>
      <section className="cms-workspace">
        <div className="cms-topbar">
          <div>
            <div className="cms-kicker">Embedded CMS</div>
            <h1>{view === 'media' ? 'Media Library' : view === 'content' ? 'Content Editor' : view === 'users' ? 'User Management' : 'Dashboard'}</h1>
          </div>
          <div className="cms-workflow">
            {workflow.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        {view === 'content' ? children || (
          siteConfig ? (
            <CmsContentEditor
              pages={pages.filter((page): page is { slug: string; title: string; content: CmsContent } => Boolean(page.content))}
              blocks={blocks}
              siteConfig={siteConfig}
            />
          ) : (
            <article className="cms-panel">
              <h2>Missing site adapter</h2>
              <p>Provide a CMS site config before editing structured content.</p>
            </article>
          )
        ) : view === 'media' ? (
          <CmsMediaLibrary />
        ) : view === 'users' ? (
          <CmsUserManagement />
        ) : (
        <div className="cms-grid">
          {pages.map((page) => (
            <article className="cms-panel" key={page.slug}>
              <div className="cms-kicker">Editable Page</div>
              <h2>{page.title}</h2>
              <p>Slug: {page.slug}. Edit text, videos, images, sections, breaks, hero, topbar, and buttons from structured blocks.</p>
            </article>
          ))}
          {editingSurfaces.map((item) => (
            <article className="cms-panel" key={item}>
              <h2>{item}</h2>
              <p>Edit approved structured blocks, preserve responsive layouts, and publish only after preview.</p>
            </article>
          ))}
          {blockLabels.map((label) => (
            <article className="cms-panel" key={label}>
              <div className="cms-kicker">Block Type</div>
              <h2>{label}</h2>
              <p>This reusable block can be enabled for another embedded site adapter.</p>
            </article>
          ))}
        </div>
        )}
      </section>
    </main>
  );
}
