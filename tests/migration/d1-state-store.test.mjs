import assert from 'node:assert/strict';
import { test } from 'node:test';

class FakePreparedStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    if (this.db.failSelect) throw new Error(this.db.failSelect);
    if (!this.db.hasTable && /ops_state/.test(this.sql)) {
      throw new Error('D1_ERROR: no such table: ops_state: SQLITE_ERROR');
    }
    if (/SELECT payload, version FROM ops_state WHERE id = \?/.test(this.sql)) {
      const row = this.db.rows.get(this.params[0]);
      return row ? { payload: row.payload, version: row.version } : null;
    }
    if (/SELECT version FROM ops_state WHERE id = \?/.test(this.sql)) {
      const row = this.db.rows.get(this.params[0]);
      return row ? { version: row.version } : null;
    }
    throw new Error(`Unexpected first SQL: ${this.sql}`);
  }

  async run() {
    if (/CREATE TABLE IF NOT EXISTS ops_state/.test(this.sql)) {
      this.db.hasTable = true;
      return { success: true };
    }
    if (!this.db.hasTable && /ops_state/.test(this.sql)) {
      throw new Error('D1_ERROR: no such table: ops_state: SQLITE_ERROR');
    }
    if (/INSERT OR IGNORE INTO ops_state/.test(this.sql)) {
      const [id, payload, version, updatedAt] = this.params;
      if (!this.db.rows.has(id)) {
        this.db.rows.set(id, { payload, version, updated_at: updatedAt });
      }
      return { success: true, meta: { changes: 1 } };
    }
    if (/UPDATE ops_state SET payload = \?, version = \?, updated_at = \? WHERE id = \? AND version = \?/.test(this.sql)) {
      const [payload, nextVersion, updatedAt, id, expectedVersion] = this.params;
      const current = this.db.rows.get(id);
      if (!current || current.version !== expectedVersion) return { success: true, meta: { changes: 0 } };
      this.db.rows.set(id, { payload, version: nextVersion, updated_at: updatedAt });
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error(`Unexpected run SQL: ${this.sql}`);
  }
}

class FakeD1Database {
  constructor({ hasTable = true, failSelect = '' } = {}) {
    this.rows = new Map();
    this.hasTable = hasTable;
    this.failSelect = failSelect;
  }

  prepare(sql) {
    return new FakePreparedStatement(this, sql);
  }
}

test('readOpsState creates and seeds the compatibility table when D1 is bound but unmigrated', async () => {
  const { createD1OpsStateStore } = await import('../../src/lib/cloudflare/ops-state-store.ts');
  const db = new FakeD1Database({ hasTable: false });
  const store = createD1OpsStateStore(db, {
    defaultState: { bookings: [], customers: [], unsafe: undefined },
    sanitizeState: (state) => ({ bookings: state.bookings || [], customers: state.customers || [] }),
    now: () => '2026-06-28T00:00:00.000Z'
  });

  const state = await store.read();

  assert.equal(db.hasTable, true);
  assert.deepEqual(state, { bookings: [], customers: [] });
  assert.equal(db.rows.get(1).payload, JSON.stringify({ bookings: [], customers: [] }));
});

test('writeOpsState creates the compatibility table when D1 is bound but unmigrated', async () => {
  const { createD1OpsStateStore } = await import('../../src/lib/cloudflare/ops-state-store.ts');
  const db = new FakeD1Database({ hasTable: false });
  const store = createD1OpsStateStore(db, {
    defaultState: {},
    sanitizeState: (state) => ({ bookings: state.bookings || [], customers: state.customers || [] }),
    now: () => '2026-06-28T00:00:00.000Z'
  });

  const written = await store.write({ bookings: [{ id: 2 }] });

  assert.equal(db.hasTable, true);
  assert.deepEqual(written, { bookings: [{ id: 2 }], customers: [] });
  assert.equal(db.rows.get(1).payload, JSON.stringify({ bookings: [{ id: 2 }], customers: [] }));
});

test('readOpsState does not hide unrelated D1 errors', async () => {
  const { createD1OpsStateStore } = await import('../../src/lib/cloudflare/ops-state-store.ts');
  const db = new FakeD1Database({ failSelect: 'D1_ERROR: database is locked' });
  const store = createD1OpsStateStore(db, {
    defaultState: {},
    sanitizeState: (state) => state
  });

  await assert.rejects(() => store.read(), /database is locked/);
});

test('readOpsState seeds D1 with the sanitized default state when no row exists', async () => {
  const { createD1OpsStateStore } = await import('../../src/lib/cloudflare/ops-state-store.ts');
  const db = new FakeD1Database();
  const store = createD1OpsStateStore(db, {
    defaultState: { bookings: [], customers: [], unsafe: undefined },
    sanitizeState: (state) => ({ bookings: state.bookings || [], customers: state.customers || [] }),
    now: () => '2026-06-28T00:00:00.000Z'
  });

  const state = await store.read();

  assert.deepEqual(state, { bookings: [], customers: [] });
  assert.equal(db.rows.get(1).payload, JSON.stringify({ bookings: [], customers: [] }));
});

test('writeOpsState stores sanitized JSON payload in the compatibility row', async () => {
  const { createD1OpsStateStore } = await import('../../src/lib/cloudflare/ops-state-store.ts');
  const db = new FakeD1Database();
  const store = createD1OpsStateStore(db, {
    defaultState: {},
    sanitizeState: (state) => ({ bookings: state.bookings || [], customers: state.customers || [] }),
    now: () => '2026-06-28T00:00:00.000Z'
  });

  const written = await store.write({ bookings: [{ id: 1 }], ignored: true });

  assert.deepEqual(written, { bookings: [{ id: 1 }], customers: [] });
  assert.equal(db.rows.get(1).payload, JSON.stringify({ bookings: [{ id: 1 }], customers: [] }));
  assert.equal(db.rows.get(1).version, 1);
});

test('writeOpsState increments version after a read-modify-write', async () => {
  const { createD1OpsStateStore } = await import('../../src/lib/cloudflare/ops-state-store.ts');
  const db = new FakeD1Database();
  db.rows.set(1, { payload: JSON.stringify({ bookings: [], customers: [] }), version: 3, updated_at: 'seeded' });
  const store = createD1OpsStateStore(db, {
    defaultState: {},
    sanitizeState: (state) => ({ bookings: state.bookings || [], customers: state.customers || [] }),
    now: () => '2026-06-28T00:00:00.000Z'
  });

  const state = await store.read();
  state.bookings.push({ id: 7 });
  await store.write(state);

  assert.equal(db.rows.get(1).version, 4);
  assert.equal(db.rows.get(1).payload, JSON.stringify({ bookings: [{ id: 7 }], customers: [] }));
});

test('writeOpsState rejects stale read-modify-write conflicts', async () => {
  const { createD1OpsStateStore } = await import('../../src/lib/cloudflare/ops-state-store.ts');
  const db = new FakeD1Database();
  db.rows.set(1, { payload: JSON.stringify({ bookings: [], customers: [] }), version: 5, updated_at: 'seeded' });
  const store = createD1OpsStateStore(db, {
    defaultState: {},
    sanitizeState: (state) => ({ bookings: state.bookings || [], customers: state.customers || [] }),
    now: () => '2026-06-28T00:00:00.000Z'
  });

  const stale = await store.read();
  db.rows.set(1, { payload: JSON.stringify({ bookings: [{ id: 8 }], customers: [] }), version: 6, updated_at: 'other-write' });
  stale.bookings.push({ id: 9 });

  await assert.rejects(() => store.write(stale), /write conflict/i);
  assert.equal(db.rows.get(1).payload, JSON.stringify({ bookings: [{ id: 8 }], customers: [] }));
});
