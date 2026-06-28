export function trackerDateTimeInputValue(value: unknown = ''): string {
  const text = String(value || '').trim();
  return text ? text.slice(0, 16) : '';
}

export function trackerStatusValue(status: unknown = ''): string {
  return String(status || '').trim().toLowerCase();
}

export function trackerSerialKey(value: unknown = ''): string {
  return String(value || '').trim().toLowerCase();
}

export function normalizeTrackerShareUrl(value: unknown = ''): string {
  const text = String(value || '').trim();
  if (!text) return '';
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}
