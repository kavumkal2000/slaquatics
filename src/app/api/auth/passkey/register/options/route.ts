import { jsonResponse } from '../../../../../../lib/cloudflare/http.ts';
import { createPasskeyRegistrationOptions } from '../../../../../../lib/ops/passkeys.ts';

export async function GET(request: Request) {
  const result = await createPasskeyRegistrationOptions(request);
  if ('error' in result) return jsonResponse({ error: result.error }, { status: result.status });
  return jsonResponse({ ok: true, options: result.options });
}
