export type LocalDateParts = {
  year: number;
  month: number;
  day: number;
};

export type TimeParts = {
  hour: number;
  minute: number;
};

export function localDateParts(iso: unknown): LocalDateParts | null {
  if (!iso || iso === 'TBD') return null;
  const parts = String(iso).split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  return {year: parts[0], month: parts[1] - 1, day: parts[2]};
}

export function isoFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: unknown): Date | null {
  const parts = localDateParts(iso);
  return parts ? new Date(parts.year, parts.month, parts.day) : null;
}

export function parseFlexibleDate(value: unknown): Date | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const parsedIso = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsedIso.getTime()) ? null : parsedIso;
  }
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?)?$/i);
  if (!match) return null;
  let [, month, day, year, hour = '0', minute = '0', meridiem = ''] = match;
  let hourNum = Number(hour);
  if (meridiem) {
    const upper = meridiem.toUpperCase();
    if (upper === 'PM' && hourNum < 12) hourNum += 12;
    if (upper === 'AM' && hourNum === 12) hourNum = 0;
  }
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), hourNum, Number(minute));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dateValue(value: unknown): Date | null {
  if (!value || value === 'N/A' || value === 'TBD') return null;
  return parseFlexibleDate(value) || parseIsoDate(value);
}

export function isoDate(value: unknown): string {
  const parsed = value instanceof Date ? value : parseFlexibleDate(value);
  return parsed ? isoFromDate(parsed) : 'N/A';
}

export function inputDateValue(value: unknown): string {
  const parsed = dateValue(value);
  return parsed ? isoFromDate(parsed) : '';
}

export function formatShortDate(value: unknown): string {
  const parsed = dateValue(value);
  return parsed ? parsed.toLocaleDateString('en-US', {month:'numeric', day:'numeric', year:'numeric'}) : '—';
}

export function parseBookingTimeParts(timeValue: unknown): TimeParts | null {
  const raw = String(timeValue || '').trim();
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?(?:\s*([AP]M))?$/i);
  if (!match) return null;
  let [, hourText = '0', minuteText = '00', meridiem = ''] = match;
  let hour = Number(hourText);
  const minute = Number(minuteText || '00');
  if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) return null;
  if (meridiem) {
    const upper = meridiem.toUpperCase();
    if (hour < 1 || hour > 12) return null;
    if (upper === 'PM' && hour < 12) hour += 12;
    if (upper === 'AM' && hour === 12) hour = 0;
  } else if (hour < 0 || hour > 23) {
    return null;
  }
  return {hour, minute};
}

export function formatTime(value: unknown): string {
  const parsed = value instanceof Date ? value : parseFlexibleDate(value);
  if (parsed) return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
  const timeParts = parseBookingTimeParts(value);
  if (!timeParts) return '10:00';
  return `${String(timeParts.hour).padStart(2, '0')}:${String(timeParts.minute).padStart(2, '0')}`;
}

export function formatTimeLabel(value: unknown): string {
  const parsed = parseBookingTimeParts(value);
  if (!parsed) return String(value || '').trim() || 'TBD';
  const suffix = parsed.hour >= 12 ? 'PM' : 'AM';
  const twelveHour = parsed.hour % 12 || 12;
  return `${twelveHour}:${String(parsed.minute).padStart(2, '0')} ${suffix}`;
}
