#!/usr/bin/env node

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_MAX_HOSTNAMES = 10;

function usage() {
  console.error(`Usage:
  node scripts/sync-turnstile-hostnames.mjs --add <hostname> [--remove <hostname>] [--base <hostnames>] [--dry-run]

Required environment:
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN
  TURNSTILE_WIDGET_ID or TURNSTILE_SITE_KEY

Examples:
  TURNSTILE_WIDGET_ID=0x... node scripts/sync-turnstile-hostnames.mjs --add preview.example.workers.dev
  TURNSTILE_WIDGET_ID=0x... node scripts/sync-turnstile-hostnames.mjs --remove old-preview.example.workers.dev
  TURNSTILE_WIDGET_ID=0x... node scripts/sync-turnstile-hostnames.mjs --base slaquatics.com,dev.slaquatics.com,localhost,127.0.0.1 --add "$PREVIEW_HOSTNAME"`);
}

function parseArgs(argv) {
  const args = {
    add: [],
    remove: [],
    base: [],
    dryRun: false,
    maxHostnames: DEFAULT_MAX_HOSTNAMES
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : '';
    if (arg === '--add' || arg === '--hostname') args.add.push(value);
    else if (arg === '--remove') args.remove.push(value);
    else if (arg === '--base') args.base.push(...String(value).split(','));
    else if (arg === '--max-hostnames') args.maxHostnames = Number(value || DEFAULT_MAX_HOSTNAMES);
    else {
      console.error(`Unknown argument: ${arg}`);
      usage();
      process.exit(1);
    }
  }
  return args;
}

function normalizeHostname(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  try {
    const parsed = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return parsed.hostname;
  } catch {
    return raw.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  }
}

function uniqueHostnames(values) {
  return [...new Set(values.map(normalizeHostname).filter(Boolean))].sort();
}

async function cloudflareFetch(path, init = {}) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN.');
    process.exit(1);
  }
  const response = await fetch(`${API_BASE}/accounts/${accountId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = Array.isArray(payload.errors) && payload.errors.length
      ? payload.errors.map((error) => error.message || JSON.stringify(error)).join('; ')
      : `Cloudflare API request failed (${response.status})`;
    throw new Error(message);
  }
  return payload.result;
}

const args = parseArgs(process.argv);
const widgetId = process.env.TURNSTILE_WIDGET_ID || process.env.TURNSTILE_SITE_KEY;
if (!widgetId) {
  console.error('Missing TURNSTILE_WIDGET_ID or TURNSTILE_SITE_KEY.');
  usage();
  process.exit(1);
}

const add = uniqueHostnames(args.add);
const remove = new Set(uniqueHostnames(args.remove));
const base = uniqueHostnames(args.base);
if (!add.length && !remove.size && !base.length) {
  usage();
  process.exit(1);
}

try {
  const widget = await cloudflareFetch(`/challenges/widgets/${encodeURIComponent(widgetId)}`);
  const current = uniqueHostnames(widget.domains || []);
  const next = uniqueHostnames([...current, ...base, ...add]).filter((hostname) => !remove.has(hostname));

  if (!Number.isFinite(args.maxHostnames) || args.maxHostnames < 1) {
    throw new Error('--max-hostnames must be a positive number.');
  }
  if (next.length > args.maxHostnames) {
    throw new Error(`Turnstile hostname limit would be exceeded: ${next.length}/${args.maxHostnames}. Remove stale preview hostnames or use a parent hostname that covers subdomains.`);
  }

  console.log(`Current hostnames (${current.length}): ${current.join(', ') || '(none)'}`);
  console.log(`Next hostnames (${next.length}): ${next.join(', ') || '(none)'}`);

  if (args.dryRun) {
    console.log('Dry run only. No Turnstile widget changes were made.');
    process.exit(0);
  }

  await cloudflareFetch(`/challenges/widgets/${encodeURIComponent(widgetId)}`, {
    method: 'PUT',
    body: JSON.stringify({ domains: next })
  });
  console.log('Turnstile hostnames updated.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
