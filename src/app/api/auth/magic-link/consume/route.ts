import { clearSessionCookie, consumeClientMagicLink, publicAuthOrigin } from '../../../../../lib/ops/auth.ts';

function redirectWithCookie(location: string, cookie: string, status = 303) {
  return new Response(null, {
    status,
    headers: {
      Location: location,
      'Set-Cookie': cookie
    }
  });
}

function errorUrl(request: Request, reason: string) {
  const url = new URL('/ops-login', publicAuthOrigin(request));
  url.searchParams.set('auth_error', reason);
  return String(url);
}

function clientUrl(request: Request) {
  const url = new URL('/', publicAuthOrigin(request));
  url.searchParams.set('client_login', 'ok');
  return String(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = String(url.searchParams.get('token') || '').trim();
  if (!token) return redirectWithCookie(errorUrl(request, 'magic-link-invalid'), clearSessionCookie());

  const session = await consumeClientMagicLink(token, request);
  if (!session) return redirectWithCookie(errorUrl(request, 'magic-link-invalid'), clearSessionCookie());

  return redirectWithCookie(clientUrl(request), session.cookie);
}
