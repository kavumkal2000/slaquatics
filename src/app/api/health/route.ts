import { jsonResponse } from '../../../lib/cloudflare/http.ts';
import { opsStateStorageKind } from '../../../lib/ops/public-state.ts';

export async function GET() {
  try {
    const storage = await opsStateStorageKind();
    return jsonResponse({
      ok: true,
      runtime: 'cloudflare',
      storage
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      runtime: 'cloudflare',
      storage: 'unavailable',
      error: error instanceof Error ? error.message : 'Persistent ops state store is unavailable.'
    }, { status: 503 });
  }
}
