export type D1DatabaseLike = {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
};

type StoreOptions<TState> = {
  defaultState: TState;
  sanitizeState: (value: any) => TState;
  now?: () => string;
};

export type OpsStateStore<TState> = {
  kind: 'd1' | 'memory';
  read(): Promise<TState>;
  write(value: TState): Promise<TState>;
};

type OpsStateRow = {
  payload: string;
  version?: number;
};

const OPS_STATE_VERSION = Symbol.for('slaquatics.opsStateVersion');

const CREATE_OPS_STATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ops_state (
    id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`;

function isMissingOpsStateTableError(error: unknown) {
  return error instanceof Error && /no such table:\s*ops_state/i.test(error.message);
}

function attachVersion<TState>(state: TState, version: number): TState {
  if (state && typeof state === 'object') {
    Object.defineProperty(state, OPS_STATE_VERSION, {
      value: version,
      enumerable: false,
      configurable: true
    });
  }
  return state;
}

function stateVersion(value: unknown) {
  return value && typeof value === 'object'
    ? Number((value as Record<symbol, unknown>)[OPS_STATE_VERSION] || 0)
    : 0;
}

export function copyOpsStateVersion(source: unknown, target: unknown) {
  const version = stateVersion(source);
  if (version && target && typeof target === 'object') attachVersion(target, version);
  return target;
}

export function createD1OpsStateStore<TState>(
  db: D1DatabaseLike,
  options: StoreOptions<TState>
): OpsStateStore<TState> {
  const now = options.now || (() => new Date().toISOString());

  async function ensureOpsStateTable() {
    await db.prepare(CREATE_OPS_STATE_TABLE_SQL).bind().run();
  }

  async function write(value: TState) {
    const next = options.sanitizeState(value);
    const expectedVersion = stateVersion(value);

    async function insertDefault() {
      const result = await db
        .prepare('INSERT OR IGNORE INTO ops_state (id, payload, version, updated_at) VALUES (?, ?, ?, ?)')
        .bind(1, JSON.stringify(next), 1, now())
        .run();
      return result;
    }

    async function updateWithVersion(version: number) {
      return db
        .prepare('UPDATE ops_state SET payload = ?, version = ?, updated_at = ? WHERE id = ? AND version = ?')
        .bind(JSON.stringify(next), version + 1, now(), 1, version)
        .run();
    }

    function changed(result: any) {
      const changes = result?.meta?.changes ?? result?.changes;
      return changes === undefined ? true : Number(changes) > 0;
    }

    async function selectVersion() {
      return db
        .prepare('SELECT version FROM ops_state WHERE id = ?')
        .bind(1)
        .first<{ version: number }>();
    }

    async function upsert() {
      if (expectedVersion) {
        const result = await updateWithVersion(expectedVersion);
        if (changed(result)) return expectedVersion + 1;
        throw new Error('Ops state write conflict. Please retry.');
      }
      const row = await selectVersion();
      if (!row) {
        await insertDefault();
        return 1;
      }
      const result = await updateWithVersion(Number(row.version || 1));
      if (!changed(result)) throw new Error('Ops state write conflict. Please retry.');
      return Number(row.version || 1) + 1;
    }

    try {
      const version = await upsert();
      attachVersion(next, version);
    } catch (error) {
      if (!isMissingOpsStateTableError(error)) throw error;
      await ensureOpsStateTable();
      const version = await upsert();
      attachVersion(next, version);
    }
    return next;
  }

  return {
    kind: 'd1',
    async read() {
      async function selectRow() {
        return db
          .prepare('SELECT payload, version FROM ops_state WHERE id = ?')
          .bind(1)
          .first<OpsStateRow>();
      }

      let row: OpsStateRow | null;
      try {
        row = await selectRow();
      } catch (error) {
        if (!isMissingOpsStateTableError(error)) throw error;
        await ensureOpsStateTable();
        row = await selectRow();
      }
      if (!row) {
        return write(options.defaultState);
      }
      return attachVersion(options.sanitizeState(JSON.parse(row.payload)), Number(row.version || 1));
    },
    write
  };
}
