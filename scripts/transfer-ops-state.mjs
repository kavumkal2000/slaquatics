import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { Client } from 'pg';
import { sanitizeState } from '../src/lib/ops/default-state.ts';

const REPO_ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BACKUP_DIR = path.join(REPO_ROOT, 'data', 'ops-state-backups');
const WRANGLER_PATH = path.join(REPO_ROOT, 'wrangler.toml');

function parseArgs(argv) {
  const args = {
    env: 'production',
    apply: false,
    out: '',
    fromFile: '',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--env') args.env = argv[++index] || args.env;
    else if (arg === '--out') args.out = argv[++index] || '';
    else if (arg === '--from-file') args.fromFile = argv[++index] || '';
    else if (arg === '--account-id') args.accountId = argv[++index] || '';
    else if (arg === '--api-token') args.apiToken = argv[++index] || '';
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  DATABASE_URL="postgres://..." node scripts/transfer-ops-state.mjs [--env production] [--apply]

Options:
  --env <name>          D1 environment from wrangler.toml. Default: production.
  --apply               Upsert into Cloudflare D1. Without this, only exports and validates.
  --from-file <path>    Import a previously exported JSON payload instead of reading Postgres.
  --out <path>          Backup JSON output path. Default: data/ops-state-backups/<timestamp>.json.
  --account-id <id>     Cloudflare account id. Defaults to CLOUDFLARE_ACCOUNT_ID.
  --api-token <token>   Cloudflare API token. Defaults to CLOUDFLARE_API_TOKEN.
`);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

const KNOWN_TOP_LEVEL_KEYS = new Set([
  'bookings',
  'customers',
  'expenses',
  'fuelLog',
  'maintLog',
  'trackers',
  'invoices',
  'communicationsLog',
  'reviewRequests',
  'reviews',
  'reviewSettings',
  'socialPosts',
  'ownerWeeklyDigest',
  'importMeta',
  'invoiceImportMeta'
]);

function stableJson(value) {
  return JSON.stringify(value);
}

function hashPayload(payload) {
  return crypto.createHash('sha256').update(stableJson(payload)).digest('hex');
}

function summarizeState(payload) {
  const summary = {};
  for (const key of KNOWN_TOP_LEVEL_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) summary[key] = value.length;
    else if (value && typeof value === 'object') summary[key] = 'object';
    else summary[key] = typeof value;
  }
  return summary;
}

function unknownTopLevelKeys(payload) {
  return Object.keys(payload).filter((key) => !KNOWN_TOP_LEVEL_KEYS.has(key)).sort();
}

async function readLegacyPostgresState() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required unless --from-file is provided.');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const tableCheck = await client.query(
      "SELECT to_regclass('public.ops_state') AS table_name"
    );
    if (!tableCheck.rows[0]?.table_name) {
      throw new Error('Legacy Postgres database does not contain public.ops_state.');
    }

    const result = await client.query(
      'SELECT payload, updated_at FROM ops_state WHERE id = 1'
    );
    if (!result.rows.length) {
      throw new Error('Legacy Postgres ops_state has no row with id = 1.');
    }

    return {
      payload: normalizePayload(result.rows[0].payload),
      sourceUpdatedAt: result.rows[0].updated_at
    };
  } finally {
    await client.end();
  }
}

async function readFileState(filePath) {
  const raw = await fs.readFile(path.resolve(filePath), 'utf8');
  return { payload: normalizePayload(JSON.parse(raw)), sourceUpdatedAt: null };
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('ops_state.payload must be a JSON object.');
  }
  stableJson(payload);
  return payload;
}

async function writeBackup(payload, outputPath, suffix = '') {
  const basePath = outputPath
    ? path.resolve(outputPath)
    : path.join(BACKUP_DIR, `ops-state-${timestamp()}.json`);
  const parsed = path.parse(basePath);
  const resolved = suffix
    ? path.join(parsed.dir, `${parsed.name}.${suffix}${parsed.ext || '.json'}`)
    : basePath;
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`);
  return resolved;
}

async function readWranglerD1Config(envName) {
  const raw = await fs.readFile(WRANGLER_PATH, 'utf8');
  const block =
    findTomlSection(raw, `[[env.${envName}.d1_databases]]`) ||
    findTomlSection(raw, '[[d1_databases]]') ||
    '';
  const databaseName = /database_name\s*=\s*"([^"]+)"/.exec(block)?.[1] || '';
  const databaseId = /database_id\s*=\s*"([^"]+)"/.exec(block)?.[1] || '';
  if (!databaseName || !databaseId) {
    throw new Error(`Could not find D1 database config for env "${envName}" in wrangler.toml.`);
  }
  return { databaseName, databaseId };
}

function findTomlSection(raw, header) {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === header);
  if (start === -1) return '';
  const section = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s*\[/.test(line)) break;
    section.push(line);
  }
  return section.join('\n');
}

async function d1Query({ accountId, apiToken, databaseId, sql, params = [] }) {
  if (!accountId) throw new Error('Cloudflare account id is required for --apply.');
  if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN is required for --apply.');

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(`Cloudflare D1 query failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function ensureD1Schema(config) {
  await d1Query({
    ...config,
    sql: `CREATE TABLE IF NOT EXISTS ops_state (
      id INTEGER PRIMARY KEY,
      payload TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`
  });
}

async function writeD1State(config, payload) {
  const now = new Date().toISOString();
  const existing = await d1Query({
    ...config,
    sql: 'SELECT version FROM ops_state WHERE id = ?',
    params: [1]
  });
  const currentVersion = Number(existing?.result?.[0]?.results?.[0]?.version || 0);
  const nextVersion = currentVersion + 1 || 1;
  const write = currentVersion
    ? await d1Query({
        ...config,
        sql: 'UPDATE ops_state SET payload = ?, version = ?, updated_at = ? WHERE id = ? AND version = ?',
        params: [JSON.stringify(payload), nextVersion, now, 1, currentVersion]
      })
    : await d1Query({
        ...config,
        sql: 'INSERT OR IGNORE INTO ops_state (id, payload, version, updated_at) VALUES (?, ?, ?, ?)',
        params: [1, JSON.stringify(payload), nextVersion, now]
      });
  const changes = Number(write?.result?.[0]?.meta?.changes ?? write?.result?.[0]?.changes ?? 0);
  if (changes < 1) {
    throw new Error('D1 ops_state changed during import. Re-run after pausing app writes or exporting a fresh backup.');
  }
  return now;
}

async function readD1State(config) {
  const body = await d1Query({
    ...config,
    sql: 'SELECT payload, version, updated_at FROM ops_state WHERE id = ?',
    params: [1]
  });
  const row = body?.result?.[0]?.results?.[0];
  if (!row) throw new Error('D1 ops_state row 1 was not found after import.');
  return {
    payload: normalizePayload(JSON.parse(row.payload)),
    version: row.version,
    updatedAt: row.updated_at
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.fromFile
    ? await readFileState(args.fromFile)
    : await readLegacyPostgresState();
  const sanitizedPayload = sanitizeState(source.payload);
  const rawBackupPath = await writeBackup(source.payload, args.out, 'raw');
  const sanitizedBackupPath = await writeBackup(sanitizedPayload, args.out, 'sanitized');
  const summary = summarizeState(sanitizedPayload);
  const d1Config = await readWranglerD1Config(args.env);
  const rawHash = hashPayload(source.payload);
  const sanitizedHash = hashPayload(sanitizedPayload);

  console.log(JSON.stringify({
    ok: true,
    mode: args.apply ? 'applied' : 'dry-run',
    source: args.fromFile ? 'file' : 'postgres',
    sourceUpdatedAt: source.sourceUpdatedAt,
    backups: {
      raw: rawBackupPath,
      sanitized: sanitizedBackupPath
    },
    destination: {
      env: args.env,
      databaseName: d1Config.databaseName,
      databaseId: d1Config.databaseId
    },
    payloadBytes: {
      raw: Buffer.byteLength(stableJson(source.payload)),
      sanitized: Buffer.byteLength(stableJson(sanitizedPayload))
    },
    hashes: {
      raw: rawHash,
      sanitized: sanitizedHash
    },
    unknownTopLevelKeys: unknownTopLevelKeys(source.payload),
    summary
  }, null, 2));

  if (!args.apply) {
    console.log('Dry run only. Re-run with --apply to upsert this payload into D1.');
    return;
  }

  await ensureD1Schema({ ...args, databaseId: d1Config.databaseId });
  const updatedAt = await writeD1State({ ...args, databaseId: d1Config.databaseId }, sanitizedPayload);
  const readback = await readD1State({ ...args, databaseId: d1Config.databaseId });
  const readbackHash = hashPayload(sanitizeState(readback.payload));
  if (readbackHash !== sanitizedHash) {
    throw new Error(`D1 readback hash mismatch: expected ${sanitizedHash}, got ${readbackHash}`);
  }
  console.log(JSON.stringify({
    ok: true,
    d1UpdatedAt: updatedAt,
    d1ReadbackUpdatedAt: readback.updatedAt,
    d1Version: readback.version,
    readbackHash,
    readbackSummary: summarizeState(readback.payload)
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
