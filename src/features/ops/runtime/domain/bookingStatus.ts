export const CANONICAL_BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'noshow', 'cancelled', 'draft'] as const;

export type CanonicalBookingStatus = (typeof CANONICAL_BOOKING_STATUSES)[number];

export function normalizeBookingStatusValue(status: unknown): string {
  const normalized = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (normalized === 'no show') return 'noshow';
  if (normalized === 'canceled') return 'cancelled';
  return normalized;
}

export function isCanonicalBookingStatus(status: string): status is CanonicalBookingStatus {
  return (CANONICAL_BOOKING_STATUSES as readonly string[]).includes(status);
}
