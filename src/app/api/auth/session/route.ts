import { getSession, sessionUserPayload } from '../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';
import { opsStateStorageKind } from '../../../../lib/ops/public-state.ts';

export async function GET(request: Request) {
  const session = getSession(request);
  return jsonResponse({
    authenticated: Boolean(session),
    storage: await opsStateStorageKind(),
    user: sessionUserPayload(session)
  });
}
