export function normalizeInvoiceStatus(status: unknown): string {
  const normalized = String(status || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (normalized === 'paid in full') return 'paid';
  if (normalized === 'fully paid' || normalized === 'full paid') return 'paid';
  if (normalized === 'partial' || normalized === 'partial paid' || normalized === 'partiallypaid') return 'partially paid';
  if (normalized === 'over due') return 'overdue';
  if (normalized === 'canceled') return 'cancelled';
  return normalized;
}
