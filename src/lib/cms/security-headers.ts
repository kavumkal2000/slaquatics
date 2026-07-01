export const CMS_CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests";

export const CMS_SECURITY_HEADERS: [string, string][] = [
  ['Cache-Control', 'no-store, private'],
  ['X-Robots-Tag', 'noindex'],
  ['Content-Security-Policy', CMS_CONTENT_SECURITY_POLICY],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'same-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()']
];

export function applyCmsSecurityHeaders(response: Response): Response {
  for (const [key, value] of CMS_SECURITY_HEADERS) {
    response.headers.set(key, value);
  }
  return response;
}

export function cmsJson(body: unknown, init: ResponseInit = {}): Response {
  return applyCmsSecurityHeaders(Response.json(body, init));
}

export function cmsResponse(body: BodyInit | null, init: ResponseInit = {}): Response {
  return applyCmsSecurityHeaders(new Response(body, init));
}

export function cmsRedirect(url: string | URL, status = 303): Response {
  return applyCmsSecurityHeaders(Response.redirect(url, status));
}
