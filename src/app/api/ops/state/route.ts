import { getSession } from '../../../../lib/ops/auth.ts';
import { sameOriginMutationError } from '../../../../lib/ops/api-auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';
import { copyOpsStateVersion } from '../../../../lib/cloudflare/ops-state-store.ts';
import { opsStateStorageKind, readOpsState, writeOpsState } from '../../../../lib/ops/public-state.ts';
import { DEFAULT_STATE, sanitizeState, type OpsState } from '../../../../lib/ops/default-state.ts';
import { syncBookingsFromInvoices, syncCustomersFromBookings, syncWebsiteBookingInvoices } from '../../../../lib/ops/state-sync.ts';

const EMPLOYEE_VISIBLE_BOOKING_FIELDS = ['id', 'name', 'craft', 'craftKey', 'craftLabel', 'date', 'time', 'status', 'duration', 'durationLabel', 'location', 'checkedIn', 'waiverSignedAt', 'source', 'createdAt', 'updatedAt'];
const EMPLOYEE_VISIBLE_CUSTOMER_FIELDS = ['id', 'name', 'waiverSignedAt', 'bookings', 'lastBooking', 'createdAt'];
const EMPLOYEE_EDITABLE_BOOKING_FIELDS = ['name', 'craft', 'craftKey', 'craftLabel', 'date', 'time', 'status', 'duration', 'durationLabel', 'location', 'checkedIn', 'updatedAt'];

function unauthorized() {
  return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeOwnerWeeklyDigest(value: any) {
  return value && typeof value === 'object'
    ? {
        lastSentAt: String(value.lastSentAt || ''),
        lastMessageId: String(value.lastMessageId || ''),
        lastWeekKey: String(value.lastWeekKey || '')
      }
    : clone(DEFAULT_STATE.ownerWeeklyDigest);
}

function ownerWeeklyDigestTimestamp(value: any) {
  const parsed = Date.parse(String(value?.lastSentAt || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeOwnerWeeklyDigestState(currentValue: any, incomingValue: any) {
  const current = normalizeOwnerWeeklyDigest(currentValue);
  const incoming = normalizeOwnerWeeklyDigest(incomingValue);
  const currentTimestamp = ownerWeeklyDigestTimestamp(current);
  const incomingTimestamp = ownerWeeklyDigestTimestamp(incoming);
  if (!current.lastWeekKey && !currentTimestamp) return incoming;
  if (!incoming.lastWeekKey && !incomingTimestamp) return current;
  if (current.lastWeekKey && incoming.lastWeekKey && current.lastWeekKey > incoming.lastWeekKey) return current;
  if (currentTimestamp > incomingTimestamp) return current;
  return incoming;
}

function communicationEntryKey(entry: any = {}) {
  return [
    String(entry.channel || '').trim(),
    String(entry.date || '').trim(),
    String(entry.message || '').trim()
  ].join('|');
}

function mergeServerOwnedCommunications(currentLog: any[] = [], incomingLog: any[] = []) {
  const merged = Array.isArray(incomingLog) ? clone(incomingLog) : [];
  const seen = new Set(merged.map((entry) => communicationEntryKey(entry)));
  (Array.isArray(currentLog) ? currentLog : []).forEach((entry) => {
    if (String(entry?.channel || '').trim() !== 'owner-weekly-digest-email') return;
    const key = communicationEntryKey(entry);
    if (seen.has(key)) return;
    merged.push(clone(entry));
    seen.add(key);
  });
  merged.sort((left, right) => {
    const leftTime = Date.parse(String(left?.date || ''));
    const rightTime = Date.parse(String(right?.date || ''));
    const normalizedLeft = Number.isFinite(leftTime) ? leftTime : 0;
    const normalizedRight = Number.isFinite(rightTime) ? rightTime : 0;
    if (normalizedRight !== normalizedLeft) return normalizedRight - normalizedLeft;
    return Number(right?.id || 0) - Number(left?.id || 0);
  });
  return merged;
}

function normalizeRole(session: any) {
  const role = String(session?.role || '').trim().toLowerCase();
  if (role === 'developer' || role === 'owner' || role === 'employee' || role === 'crew') return role;
  return 'none';
}

function pickFields(record: any = {}, fields: string[]) {
  const out: Record<string, any> = {};
  for (const field of fields) {
    if (record[field] !== undefined) out[field] = record[field];
  }
  return out;
}

function waiverSignedFlag(record: any = {}) {
  return Boolean(record.waiverOnFile || record.waiverSignedAt || record.waiver?.signedAt || record.waiverSignature || record.waiverSigned);
}

function employeeVisibleState(state: OpsState): OpsState {
  return {
    ...clone(DEFAULT_STATE),
    bookings: state.bookings.map((booking) => ({
      ...pickFields(booking, EMPLOYEE_VISIBLE_BOOKING_FIELDS),
      waiverSigned: waiverSignedFlag(booking)
    })),
    customers: state.customers.map((customer) => ({
      ...pickFields(customer, EMPLOYEE_VISIBLE_CUSTOMER_FIELDS),
      waiverOnFile: waiverSignedFlag(customer),
      waiverSigned: waiverSignedFlag(customer)
    })),
    reviewSettings: clone(DEFAULT_STATE.reviewSettings),
    ownerWeeklyDigest: clone(DEFAULT_STATE.ownerWeeklyDigest),
    importMeta: clone(DEFAULT_STATE.importMeta),
    invoiceImportMeta: clone(DEFAULT_STATE.invoiceImportMeta)
  };
}

function crewVisibleState(state: OpsState): OpsState {
  return {
    ...clone(DEFAULT_STATE),
    bookings: state.bookings.map((booking) => ({
      id: booking.id,
      name: String(booking.name || '').trim(),
      date: String(booking.date || '').trim(),
      time: String(booking.time || '').trim(),
      craftLabel: String(booking.craftLabel || booking.craft || '').trim(),
      location: String(booking.location || '').trim(),
      status: String(booking.status || '').trim(),
      checkedIn: Boolean(booking.checkedIn)
    })),
    reviewSettings: clone(DEFAULT_STATE.reviewSettings),
    ownerWeeklyDigest: clone(DEFAULT_STATE.ownerWeeklyDigest),
    importMeta: clone(DEFAULT_STATE.importMeta),
    invoiceImportMeta: clone(DEFAULT_STATE.invoiceImportMeta)
  };
}

function statePayloadForSession(state: OpsState, session: any) {
  const role = normalizeRole(session);
  if (role === 'crew') return crewVisibleState(state);
  if (role === 'employee') return employeeVisibleState(state);
  return state;
}

function mergeEmployeeState(currentState: OpsState, incomingState: OpsState) {
  const next = sanitizeState(currentState);
  const incoming = sanitizeState(incomingState);
  const currentBookingsById = new Map(next.bookings.map((booking) => [Number(booking.id), booking]));
  let maxBookingId = next.bookings.reduce((max, booking) => Math.max(max, Number(booking.id) || 0), 0);
  next.bookings = incoming.bookings.map((booking) => {
    const existing = currentBookingsById.get(Number(booking.id));
    if (!existing) {
      const created = pickFields(booking, EMPLOYEE_EDITABLE_BOOKING_FIELDS);
      created.id = ++maxBookingId;
      created.status = created.status || 'pending';
      created.deposit = false;
      created.paymentStatus = 'unpaid';
      created.source = 'Employee Entry';
      created.createdAt = new Date().toISOString();
      return created;
    }
    const merged = { ...existing };
    for (const field of EMPLOYEE_EDITABLE_BOOKING_FIELDS) {
      if (booking[field] !== undefined) merged[field] = booking[field];
    }
    return merged;
  });
  return next;
}

function mergeCrewState(currentState: OpsState, incomingState: OpsState) {
  const next = sanitizeState(currentState);
  const updates = new Map((Array.isArray(incomingState.bookings) ? incomingState.bookings : []).map((booking: any) => [Number(booking.id), booking]));
  next.bookings = next.bookings.map((booking) => {
    const update: any = updates.get(Number(booking.id));
    if (!update) return booking;
    const out = { ...booking };
    if (typeof update.checkedIn === 'boolean') out.checkedIn = update.checkedIn;
    if (String(update.status || '').toLowerCase() === 'completed') out.status = 'completed';
    return out;
  });
  return next;
}

function isOpsStateConflict(error: unknown) {
  return error instanceof Error && /ops state write conflict/i.test(error.message);
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return unauthorized();
  if (normalizeRole(session) === 'none') return jsonResponse({ error: 'Ops access required.' }, { status: 403 });
  const state = await readOpsState();
  const invoiceChanged = syncBookingsFromInvoices(state);
  const customerChanged = syncCustomersFromBookings(state);
  const websiteInvoiceChanged = syncWebsiteBookingInvoices(state);
  if (invoiceChanged || customerChanged || websiteInvoiceChanged) await writeOpsState(state);
  return jsonResponse({ state: statePayloadForSession(state, session), storage: await opsStateStorageKind() });
}

export async function POST(request: Request) {
  const originError = sameOriginMutationError(request);
  if (originError) return originError;
  const session = await getSession(request);
  if (!session) return unauthorized();
  const body = await request.json();
  const currentState = await readOpsState();
  const role = normalizeRole(session);
  if (role === 'none') return jsonResponse({ error: 'Ops access required.' }, { status: 403 });
  const nextState = role === 'crew'
    ? mergeCrewState(currentState, body)
    : role === 'employee'
      ? mergeEmployeeState(currentState, body)
      : sanitizeState(body);
  copyOpsStateVersion(currentState, nextState);
  nextState.ownerWeeklyDigest = mergeOwnerWeeklyDigestState(currentState.ownerWeeklyDigest, nextState.ownerWeeklyDigest);
  nextState.communicationsLog = mergeServerOwnedCommunications(currentState.communicationsLog, nextState.communicationsLog);
  syncBookingsFromInvoices(nextState);
  syncCustomersFromBookings(nextState);
  syncWebsiteBookingInvoices(nextState);
  try {
    const state = await writeOpsState(nextState);
    return jsonResponse({ ok: true, state: statePayloadForSession(state, session) });
  } catch (error) {
    if (isOpsStateConflict(error)) {
      return jsonResponse({ error: 'Ops state changed while saving. Reload and try again.' }, { status: 409 });
    }
    throw error;
  }
}

export const PUT = POST;
