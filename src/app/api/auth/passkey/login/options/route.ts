import { jsonResponse } from '../../../../../../lib/cloudflare/http.ts';
import { createPasskeyAuthenticationOptions } from '../../../../../../lib/ops/passkeys.ts';

export async function GET(request: Request) {
  const result = await createPasskeyAuthenticationOptions(request);
  return jsonResponse({ ok: true, options: result.options });
}
