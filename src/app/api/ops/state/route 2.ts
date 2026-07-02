import { getSession } from '../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';
import { readOpsState, writeOpsState } from '../../../../lib/ops/public-state.ts';
import { sanitizeState } from '../../../../lib/ops/default-state.ts';

function unauthorized() {
  return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
}

export async function GET(request: Request) {
  if (!getSession(request)) return unauthorized();
  return jsonResponse({ state: await readOpsState(), storage: 'd1' });
}

export async function POST(request: Request) {
  if (!getSession(request)) return unauthorized();
  const body = await request.json();
  const state = await writeOpsState(sanitizeState(body));
  return jsonResponse({ ok: true, state });
}

export const PUT = POST;
