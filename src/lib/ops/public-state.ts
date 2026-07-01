import { createD1OpsStateStore, type D1DatabaseLike, type OpsStateStore } from '../cloudflare/ops-state-store.ts';
import { DEFAULT_STATE, sanitizeState, type OpsState } from './default-state.ts';

let memoryState = sanitizeState(DEFAULT_STATE);
let opsStateMutationChain = Promise.resolve();

function createMemoryStore(): OpsStateStore<OpsState> {
  return {
    kind: 'memory',
    async read() {
      return sanitizeState(memoryState);
    },
    async write(value) {
      memoryState = sanitizeState(value);
      return memoryState;
    }
  };
}

function serverStoreRequired() {
  return /^true$/i.test(process.env.REQUIRE_SERVER_STORE || '') || process.env.NODE_ENV === 'production';
}

export async function getOpsStateStore(): Promise<OpsStateStore<OpsState>> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const context = await getCloudflareContext({ async: true });
    const env = context.env as Record<string, unknown>;
    const db = env.OPS_DB as D1DatabaseLike | undefined;
    if (db) {
      return createD1OpsStateStore(db, {
        defaultState: DEFAULT_STATE,
        sanitizeState
      });
    }
  } catch {
    // Local node tests and plain Next builds do not have a Cloudflare request context.
  }
  if (serverStoreRequired()) {
    throw new Error('Persistent ops state store is required, but OPS_DB is not available.');
  }
  return createMemoryStore();
}

export async function opsStateStorageKind() {
  return (await getOpsStateStore()).kind;
}

export async function readOpsState() {
  return (await getOpsStateStore()).read();
}

export async function writeOpsState(state: OpsState) {
  const run = opsStateMutationChain.then(async () => (await getOpsStateStore()).write(state));
  opsStateMutationChain = run.then(() => {}, () => {});
  return run;
}

function isOpsStateConflict(error: unknown) {
  return error instanceof Error && /ops state write conflict/i.test(error.message);
}

export async function mutateOpsState<T>(updater: (state: OpsState) => T | Promise<T>, maxAttempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const state = await readOpsState();
      const result = await updater(state);
      await writeOpsState(state);
      return result;
    } catch (error) {
      lastError = error;
      if (!isOpsStateConflict(error) || attempt === maxAttempts) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not update ops state.');
}
