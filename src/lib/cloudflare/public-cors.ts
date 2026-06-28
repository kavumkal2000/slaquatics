import { jsonResponse } from './http.ts';

export function publicCorsHeaders(request?: Request) {
  const origin = request?.headers.get('origin') || '';
  const allowedOrigins = String(process.env.PUBLIC_CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const allowedOrigin = allowedOrigins.length && origin
    ? (allowedOrigins.includes(origin) ? origin : 'https://slaquatics.com')
    : (origin && origin !== 'null' ? origin : '*');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

export function publicOptionsResponse(request: Request) {
  return new Response(null, {
    status: 204,
    headers: publicCorsHeaders(request)
  });
}

export function publicJsonResponse(request: Request, payload: unknown, init: ResponseInit = {}) {
  return jsonResponse(payload, {
    ...init,
    headers: {
      ...publicCorsHeaders(request),
      ...(init.headers || {})
    }
  });
}
