// @ts-expect-error OpenNext generates this file during `npm run cf:build`.
import openNextWorker from '../.open-next/worker.js';
import { isCmsHost, routeCmsHostRequest } from './lib/cms/host-routing.ts';

const legacyHtmlRedirects: Record<string, string> = {
  '/ops.html': '/ops',
  '/ops-login.html': '/ops-login'
};

// CMS hosts expose /cms-login, /cms/content, /cms/media, and /cms/preview through routeCmsHostRequest.

function applyEnv(env: Record<string, unknown>) {
  for (const [key, value] of Object.entries(env || {})) {
    if (typeof value === 'string') process.env[key] = value;
  }
}

function redirectLegacyHtmlRequest(request: Request) {
  const url = new URL(request.url);
  const destination = legacyHtmlRedirects[url.pathname];

  if (!destination) return null;

  url.pathname = destination;
  return Response.redirect(url.toString(), 308);
}

async function dispatchScheduledDigest(env: Record<string, unknown>, ctx: any) {
  const siteUrl = String(env.PUBLIC_SITE_URL || 'https://slaquatics.com').replace(/\/+$/, '');
  const secret = String(env.OWNER_WEEKLY_CRON_SECRET || '');
  if (!secret) {
    console.warn('OWNER_WEEKLY_CRON_SECRET is not set; skipping owner weekly digest cron.');
    return;
  }
  const request = new Request(`${siteUrl}/api/internal/owner-weekly-cron`, {
    method: 'POST',
    headers: { 'x-shoreline-cron-secret': secret }
  });
  const response = await openNextWorker.fetch(request, env, ctx);
  if (!response.ok) {
    console.warn(`Owner weekly digest cron failed with status ${response.status}.`);
  }
}

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: any) {
    const cmsEnv = {
      CMS_DEV_HOST: 'cms.dev.slaquatics.com',
      CMS_PROD_HOST: 'cms.slaquatics.com',
      ...env
    };
    const cmsRoute = routeCmsHostRequest(request, cmsEnv);
    if (cmsRoute instanceof Response) return cmsRoute;
    const routedRequest = cmsRoute || request;
    if (isCmsHost(new URL(routedRequest.url).host, cmsEnv)) {
      applyEnv(cmsEnv);
      return openNextWorker.fetch(routedRequest, cmsEnv, ctx);
    }

    const legacyRedirect = redirectLegacyHtmlRequest(routedRequest);
    if (legacyRedirect) return legacyRedirect;

    applyEnv(env);
    return openNextWorker.fetch(routedRequest, env, ctx);
  },

  async scheduled(_event: any, env: Record<string, unknown>, ctx: any) {
    applyEnv(env);
    ctx.waitUntil(dispatchScheduledDigest(env, ctx));
  }
};
