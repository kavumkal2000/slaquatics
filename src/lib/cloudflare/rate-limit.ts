type LimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, LimitRecord>();

function clientIpFor(request: Request) {
  const forwardedFor = String(request.headers.get('x-forwarded-for') || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return request.headers.get('cf-connecting-ip') || forwardedFor[0] || 'unknown';
}

export function publicMutationRateLimit(request: Request, scope: string, limit = 40, windowMs = 60_000) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, record] of buckets) {
      if (record.resetAt <= now) buckets.delete(key);
    }
  }
  const key = `${scope}:${clientIpFor(request)}`;
  const current = buckets.get(key);
  const record = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + windowMs };
  record.count += 1;
  buckets.set(key, record);
  return {
    allowed: record.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000))
  };
}

export async function readLimitedJson(request: Request, options: {
  scope: string;
  rateLimit?: number;
  windowMs?: number;
  maxBytes?: number;
}) {
  const limit = publicMutationRateLimit(request, options.scope, options.rateLimit, options.windowMs);
  if (!limit.allowed) {
    const error: any = new Error('Too many requests. Please try again shortly.');
    error.status = 429;
    error.retryAfterSeconds = limit.retryAfterSeconds;
    throw error;
  }
  const raw = await request.text();
  const maxBytes = options.maxBytes || 64 * 1024;
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    const error: any = new Error('Request payload is too large.');
    error.status = 413;
    throw error;
  }
  return raw ? JSON.parse(raw) : {};
}
