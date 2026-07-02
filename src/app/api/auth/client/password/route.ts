import { sameOriginMutationError } from '../../../../../lib/ops/api-auth.ts';
import { createPasswordHash, getSession, passwordPolicyError } from '../../../../../lib/ops/auth.ts';
import { getOpsAuthStore } from '../../../../../lib/ops/auth-store.ts';
import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';

export async function POST(request: Request) {
  const originError = sameOriginMutationError(request);
  if (originError) return originError;

  const session = await getSession(request);
  if (!session) return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
  if (String(session.role || '').toLowerCase() !== 'client') {
    return jsonResponse({ error: 'Client account required.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password || '');
  const policyError = passwordPolicyError(password);
  if (policyError) return jsonResponse({ error: policyError }, { status: 400 });

  const store = await getOpsAuthStore();
  await store.updateUserPassword(session.id, createPasswordHash(password), 'magic-link-password');
  await store.audit({ event: 'client_password_set', username: session.username, userId: session.id });
  return jsonResponse({ ok: true });
}
