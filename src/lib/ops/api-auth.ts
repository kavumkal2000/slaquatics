import { getSession } from './auth.ts';
import { jsonResponse } from '../cloudflare/http.ts';

type AuthResult = {
  response?: Response;
  session?: any;
};

export async function requireOpsSession(request: Request): Promise<AuthResult> {
  const session = await getSession(request);
  if (!session) return { response: jsonResponse({ error: 'Authentication required.' }, { status: 401 }) };
  if (String(session.role || '').toLowerCase() === 'client') {
    return { response: jsonResponse({ error: 'Ops access required.' }, { status: 403 }) };
  }
  return { session };
}

export function canManageMessagingOps(session: any) {
  return ['developer', 'owner'].includes(String(session?.role || '').toLowerCase());
}

export function sameOriginMutationError(request: Request) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return null;
  const url = new URL(request.url);
  const source = request.headers.get('origin') || request.headers.get('referer') || '';
  if (!source) return jsonResponse({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const sourceUrl = new URL(source);
    if (sourceUrl.origin === url.origin) return null;
  } catch {
    return jsonResponse({ error: 'Invalid request origin.' }, { status: 403 });
  }
  return jsonResponse({ error: 'Invalid request origin.' }, { status: 403 });
}

export async function requireMessagingSession(request: Request, message: string): Promise<AuthResult> {
  const originError = sameOriginMutationError(request);
  if (originError) return { response: originError };
  const auth = await requireOpsSession(request);
  if (auth.response) return auth;
  if (!canManageMessagingOps(auth.session)) {
    return { response: jsonResponse({ error: message }, { status: 403 }) };
  }
  return { session: auth.session };
}
