import { collectAuthConfigWarnings, getSession } from '../../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { integrationStatus } from '../../../../../lib/cloudflare/integrations.ts';
import { opsStateStorageKind } from '../../../../../lib/ops/public-state.ts';

export async function GET(request: Request) {
  const session = getSession(request);
  if (!session) return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'developer') return jsonResponse({ error: 'Developer access required.' }, { status: 403 });
  const warnings = collectAuthConfigWarnings();
  let storage = 'unavailable';
  try {
    storage = await opsStateStorageKind();
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Persistent ops state store is unavailable.');
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
    auth: { ok: warnings.length === 0, warnings },
    integrations: integrationStatus()
  });
}
