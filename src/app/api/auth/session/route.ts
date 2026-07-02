import { authResendFromEmail, clientPasswordStatusForUser, getSession, passkeyStatusForUser, sessionUserPayload } from '../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';
import { opsStateStorageKind } from '../../../../lib/ops/public-state.ts';
import { publicTurnstileSiteKey } from '../../../../lib/ops/turnstile.ts';

export async function GET(request: Request) {
  const session = await getSession(request);
  const passkey = await passkeyStatusForUser(session);
  const clientPassword = clientPasswordStatusForUser(session);
  return jsonResponse({
    authenticated: Boolean(session),
    storage: await opsStateStorageKind(),
    user: sessionUserPayload(session),
    passkey,
    clientPassword,
    auth: {
      magicLinkConfigured: Boolean(process.env.RESEND_API_KEY && authResendFromEmail()),
      turnstileSiteKey: publicTurnstileSiteKey()
    }
  });
}
