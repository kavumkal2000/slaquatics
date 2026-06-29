#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ENVIRONMENTS = {
  development: {
    bucket: 'slaquatics-media-development',
    cdnBaseUrl: 'https://cdn.dev.slaquatics.com'
  },
  production: {
    bucket: 'slaquatics-media-production',
    cdnBaseUrl: 'https://cdn.slaquatics.com'
  }
};

const IMAGE_DIR = 'public/assets/images';
const VIDEO_DIR = 'public/assets/videos';
const MANIFEST_PATH = 'public/assets/media-manifest.json';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

function parseArgs(argv) {
  const args = {
    env: 'development',
    dryRun: false,
    includeOriginals: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--env') {
      args.env = argv[index + 1];
      index += 1;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--include-originals') {
      args.includeOriginals = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!ENVIRONMENTS[args.env]) {
    throw new Error(`Unsupported --env value "${args.env}". Use development or production.`);
  }

  if (args.env === 'production' && !argv.includes('--env')) {
    throw new Error('Production uploads require explicit --env production.');
  }

  return args;
}

function listFiles(dir) {
  return readdirSync(dir)
    .map((entry) => `${dir}/${entry}`)
    .filter((file) => statSync(file).isFile())
    .sort((a, b) => a.localeCompare(b));
}

function contentType(file) {
  const ext = extname(file).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  return 'application/octet-stream';
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function mediaEntries({ includeOriginals }) {
  const entries = [];

  for (const file of listFiles(IMAGE_DIR)) {
    const filename = basename(file);
    const isOpsIcon = filename.startsWith('shoreline-ops-app-icon');
    const isBrandAsset = filename === 'shoreline-logo.webp';
    const key = isOpsIcon ? `ops/${filename}` : isBrandAsset ? `brand/${filename}` : `site/images/${filename}`;
    entries.push({ localPath: file, key });
  }

  for (const file of listFiles(VIDEO_DIR)) {
    entries.push({ localPath: file, key: `site/videos/${basename(file)}` });
  }

  if (includeOriginals) {
    for (const file of [...listFiles(IMAGE_DIR), ...listFiles(VIDEO_DIR)]) {
      entries.push({ localPath: file, key: `originals/${file}` });
    }
  }

  return entries;
}

function assertNoLegacyInput(entries) {
  for (const entry of entries) {
    const normalized = entry.localPath.replaceAll('\\', '/');
    if (normalized.startsWith('legacy/') || normalized.includes('/legacy/')) {
      throw new Error(`Refusing to publish legacy archive input: ${entry.localPath}`);
    }
  }
}

function runWrangler(args, dryRun) {
  const command = ['npx', 'wrangler', ...args];
  console.log(command.join(' '));
  if (dryRun) return;

  const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`Wrangler command failed: ${command.join(' ')}`);
  }
}

function putObject({ bucket, key, file, type, dryRun }) {
  runWrangler([
    'r2',
    'object',
    'put',
    `${bucket}/${key}`,
    '--remote',
    '--file',
    file,
    '--content-type',
    type,
    '--cache-control',
    CACHE_CONTROL
  ], dryRun);
}

const args = parseArgs(process.argv.slice(2));
const target = ENVIRONMENTS[args.env];
const entries = mediaEntries({ includeOriginals: args.includeOriginals });
assertNoLegacyInput(entries);

const manifest = {
  generatedAt: new Date().toISOString(),
  environment: args.env,
  bucket: target.bucket,
  cdnBaseUrl: target.cdnBaseUrl,
  cacheControl: CACHE_CONTROL,
  includeOriginals: args.includeOriginals,
  keyLayout: {
    siteImages: 'site/images/',
    siteVideos: 'site/videos/',
    brand: 'brand/',
    ops: 'ops/',
    originals: 'originals/',
    manifest: 'manifests/media-manifest.json'
  },
  objects: entries.map((entry) => ({
    localPath: entry.localPath,
    key: entry.key,
    url: `${target.cdnBaseUrl}/${entry.key}`,
    contentType: contentType(entry.localPath),
    bytes: statSync(entry.localPath).size,
    sha256: sha256(entry.localPath)
  }))
};

writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

for (const object of manifest.objects) {
  putObject({
    bucket: target.bucket,
    key: object.key,
    file: object.localPath,
    type: object.contentType,
    dryRun: args.dryRun
  });
}

putObject({
  bucket: target.bucket,
  key: 'manifests/media-manifest.json',
  file: MANIFEST_PATH,
  type: 'application/json',
  dryRun: args.dryRun
});

console.log(`Published ${manifest.objects.length} media objects to ${target.bucket}.`);
console.log(`Manifest: ${relative(process.cwd(), MANIFEST_PATH)} -> ${target.cdnBaseUrl}/manifests/media-manifest.json`);
