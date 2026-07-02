import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getOpsAuthStore } from './auth-store.ts';

type RateLimitBinding = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

const localBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIpFor(request: Request) {
  const cloudflareIp = request.headers.get('cf-connecting-ip');
  if (cloudflareIp) return cloudflareIp;
  if (process.env.NODE_ENV === 'production') return 'unknown';
  const forwardedFor = String(request.headers.get('x-forwarded-for') || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return forwardedFor[0] || 'unknown';
}

function localRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (localBuckets.size > 5000) {
    for (const [bucketKey, record] of localBuckets) {
      if (record.resetAt <= now) localBuckets.delete(bucketKey);
    }
  }
  const current = localBuckets.get(key);
  const record = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + windowMs };
  record.count += 1;
  localBuckets.set(key, record);
  return {
    allowed: record.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000))
  };
}

async function cloudflareRateLimit(bindingName: string, key: string) {
  if (!bindingName) return null;
  try {
    const context = await getCloudflareContext({ async: true });
    const binding = (context.env as Record<string, unknown>)[bindingName] as RateLimitBinding | undefined;
    if (!binding || typeof binding.limit !== 'function') return null;
    const result = await binding.limit({ key });
    return { allowed: Boolean(result.success), retryAfterSeconds: 60 };
  } catch {
    return null;
  }
}

export async function authRateLimit(request: Request, options: {
  scope: string;
  subject?: string;
  limit: number;
  windowMs?: number;
  bindingName?: string;
}) {
  const windowMs = Math.max(1000, Number(options.windowMs || 60_000));
  const normalizedSubject = String(options.subject || '').trim().toLowerCase();
  const key = `${options.scope}:${clientIpFor(request)}:${normalizedSubject || 'anonymous'}`;
  const bindingResult = await cloudflareRateLimit(options.bindingName || 'AUTH_RATE_LIMITER', key);
  if (bindingResult && !bindingResult.allowed) return bindingResult;

  try {
    const store = await getOpsAuthStore();
    return await store.incrementRateLimit({ key, limit: options.limit, windowMs });
  } catch {
    return localRateLimit(key, options.limit, windowMs);
  }
}

export function rateLimitHeaders(result: { retryAfterSeconds: number }) {
  return { 'Retry-After': String(result.retryAfterSeconds) };
}
