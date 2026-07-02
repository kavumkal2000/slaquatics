import { clearCurrentSession } from '../../../../lib/ops/auth.ts';
import { sameOriginMutationError } from '../../../../lib/ops/api-auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';

export async function POST(request: Request) {
  const originError = sameOriginMutationError(request);
  if (originError) return originError;
  return jsonResponse({ ok: true }, { headers: { 'Set-Cookie': await clearCurrentSession(request) } });
}
