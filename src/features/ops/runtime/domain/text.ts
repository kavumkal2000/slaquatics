export function shortText(value: unknown, max = 110): string {
  const text = String(value || '').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function phoneHref(phone: unknown): string {
  return String(phone ?? '').replace(/[^\d+]/g, '');
}

export function firstName(name: unknown): string {
  return String(name || 'there').trim().split(/\s+/)[0] || 'there';
}

export function initials(name: unknown): string {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '?') + (parts[1]?.[0] || '');
}

export function normalizePhone(phone: unknown): string {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

export function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

export function uniqueValues<T>(list: T[] = []): T[] {
  return Array.from(new Set(list.filter(Boolean)));
}

export function normalizeName(name: unknown): string {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
