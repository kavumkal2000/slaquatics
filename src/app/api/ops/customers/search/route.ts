import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { requireMessagingSession } from '../../../../../lib/ops/api-auth.ts';
import { readOpsState } from '../../../../../lib/ops/public-state.ts';

function normalize(value: any) {
  return String(value || '').trim().toLowerCase();
}

function searchableText(customer: any = {}) {
  return [
    customer.name,
    customer.email,
    customer.phone,
    customer.company,
    customer.source,
    customer.tag,
    customer.crmTags,
    customer.crmNotes,
    customer.notes,
    customer.lastBooking,
    customer.createdAt
  ].flatMap((value) => Array.isArray(value) ? value : [value]).map(normalize).join(' ');
}

function customerPayload(customer: any = {}) {
  return {
    id: customer.id,
    name: String(customer.name || 'Customer').trim(),
    email: String(customer.email || '').trim(),
    phone: String(customer.phone || '').trim(),
    company: String(customer.company || '').trim(),
    source: String(customer.source || '').trim(),
    tag: String(customer.tag || '').trim(),
    crmTags: customer.crmTags,
    crmNotes: String(customer.crmNotes || '').trim(),
    bookings: Number(customer.bookings || 0),
    totalSpent: Number(customer.totalSpent || 0),
    lastBooking: String(customer.lastBooking || '').trim(),
    lastActivity: String(customer.lastActivity || '').trim(),
    waiverSignedAt: String(customer.waiverSignedAt || '').trim()
  };
}

export async function GET(request: Request) {
  const auth = await requireMessagingSession(request, 'This login cannot search CRM message recipients.');
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const query = normalize(url.searchParams.get('q'));
  const emailOnly = /^true$/i.test(url.searchParams.get('emailOnly') || '');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 25) || 25, 1), 100);
  const state = await readOpsState();
  const terms = query.split(/\s+/).filter(Boolean);
  const customers = state.customers
    .filter((customer) => !emailOnly || normalize(customer.email))
    .filter((customer) => {
      if (!terms.length) return true;
      const haystack = searchableText(customer);
      return terms.every((term) => haystack.includes(term));
    })
    .sort((left, right) => {
      const leftName = normalize(left.name || left.email);
      const rightName = normalize(right.name || right.email);
      return leftName.localeCompare(rightName);
    })
    .slice(0, limit)
    .map(customerPayload);

  return jsonResponse({ ok: true, customers });
}
