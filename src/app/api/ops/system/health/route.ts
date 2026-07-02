import { collectAuthConfigWarnings, getSession } from '../../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { integrationStatus } from '../../../../../lib/cloudflare/integrations.ts';
import { getOpsAuthStore } from '../../../../../lib/ops/auth-store.ts';
import { opsStateStorageKind } from '../../../../../lib/ops/public-state.ts';
import { publicTurnstileSiteKey } from '../../../../../lib/ops/turnstile.ts';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'developer') return jsonResponse({ error: 'Developer access required.' }, { status: 403 });
  const warnings = collectAuthConfigWarnings();
  let storage = 'unavailable';
  let authStorage = 'unavailable';
  let authReady = false;
  try {
    storage = await opsStateStorageKind();
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Persistent ops state store is unavailable.');
  }
  try {
    const authStore = await getOpsAuthStore();
    authStorage = authStore.kind;
    authReady = await authStore.authReady();
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Persistent ops auth store is unavailable.');
  }
  return jsonResponse({
    ok: true,
    runtime: {
      node: typeof process.version === 'string' ? process.version : 'unknown',
      uptimeSeconds: typeof process.uptime === 'function' ? Math.floor(process.uptime()) : null,
      production: process.env.NODE_ENV === 'production',
      storage,
      sessionSecretSet: Boolean(process.env.SESSION_SECRET)
    },
    auth: {
      ok: warnings.length === 0,
      warnings,
      storage: authStorage,
      d1Ready: authReady,
      magicLinkConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      turnstileConfigured: Boolean(process.env.TURNSTILE_SECRET_KEY && publicTurnstileSiteKey())
    },
    integrations: integrationStatus()
  });
}
