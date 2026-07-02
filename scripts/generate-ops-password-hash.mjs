#!/usr/bin/env node
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const PBKDF2_ITERATIONS = 210000;
const PBKDF2_KEY_LENGTH = 32;

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\"'\"'")}'`;
}

function sqlQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function createPasswordHash(password, salt = crypto.randomBytes(16).toString('base64url')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256').toString('base64url');
  return `pbkdf2-sha256:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  args.set(arg.slice(2), process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[++index] : 'true');
}

const username = String(args.get('username') || '').trim().toLowerCase();
const env = String(args.get('env') || 'development').trim();
if (!username) {
  console.error('Usage: npm run ops-auth:hash -- --username owner --env production');
  process.exit(1);
}

const rl = readline.createInterface({ input, output });
const password = await rl.question('New password: ');
const confirm = await rl.question('Confirm password: ');
rl.close();

if (!password || password.length < 14) {
  console.error('Password must be at least 14 characters.');
  process.exit(1);
}
if (password !== confirm) {
  console.error('Passwords do not match.');
  process.exit(1);
}

const hash = createPasswordHash(password);
const updateSql = [
  'UPDATE ops_auth_users',
  `SET password_hash = ${sqlQuote(hash)}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  `WHERE username = ${sqlQuote(username)} OR email = ${sqlQuote(username)};`
].join(' ');
const revokeSql = [
  'UPDATE ops_auth_sessions',
  "SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')",
  'WHERE user_id IN (SELECT id FROM ops_auth_users',
  `WHERE username = ${sqlQuote(username)} OR email = ${sqlQuote(username)})`,
  'AND revoked_at IS NULL;'
].join(' ');

console.log('\nPassword hash generated. Do not store the plaintext password.');
console.log('\nUpdate password hash:');
console.log(`npx wrangler d1 execute --env ${env} --remote OPS_DB --command ${shellQuote(updateSql)}`);
console.log('\nRevoke existing sessions for this user:');
console.log(`npx wrangler d1 execute --env ${env} --remote OPS_DB --command ${shellQuote(revokeSql)}`);
