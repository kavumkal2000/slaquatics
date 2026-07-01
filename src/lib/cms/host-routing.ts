import { cmsResponse } from './security-headers.ts';

const CMS_INTERNAL_ROUTES: Record<string, string> = {
  '/': '/cms',
  '/login': '/cms-login',
  '/content': '/cms/content',
  '/media': '/cms/media',
  '/users': '/cms/users'
};

export function isCmsHost(host: string, env: Record<string, unknown> = {}): boolean {
  const normalized = host.split(':')[0].toLowerCase();
  const configured = [
    env.CMS_DEV_HOST,
    env.CMS_PROD_HOST,
    env.CMS_HOST
  ].map((value) => String(value || '').toLowerCase()).filter(Boolean);
  return configured.includes(normalized);
}

export function isCmsAdminPath(pathname: string): boolean {
  return pathname === '/cms'
    || pathname === '/cms-login'
    || pathname.startsWith('/cms/')
    || pathname.startsWith('/api/cms/admin')
    || pathname.startsWith('/api/cms/preview');
}

function isCmsHostAssetPath(pathname: string): boolean {
  return pathname.startsWith('/_next/')
    || pathname === '/favicon.ico'
    || pathname === '/robots.txt'
    || pathname === '/sitemap.xml';
}

export function routeCmsHostRequest(request: Request, env: Record<string, unknown> = {}): Request | Response | null {
  const url = new URL(request.url);
  const cmsHost = isCmsHost(url.host, env);

  if (!cmsHost && isCmsAdminPath(url.pathname)) {
    return cmsResponse('Not found', { status: 404 });
  }

  if (!cmsHost) return null;

  if (url.pathname.startsWith('/api/cms/')) return null;
  if (url.pathname.startsWith('/cms') || url.pathname === '/cms-login' || isCmsHostAssetPath(url.pathname)) return null;

  if (url.pathname.startsWith('/preview/')) {
    url.pathname = `/cms${url.pathname}`;
    return new Request(url.toString(), request);
  }

  const destination = CMS_INTERNAL_ROUTES[url.pathname];
  if (destination) {
    url.pathname = destination;
    return new Request(url.toString(), request);
  }

  return cmsResponse('Not found', { status: 404 });
}
