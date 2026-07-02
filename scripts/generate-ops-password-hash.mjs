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

async function readStdinText() {
  let text = '';
  for await (const chunk of input) text += chunk;
  return text;
}

function passwordPolicyError(password = '') {
  const value = String(password || '');
  if (value.length < 6) return 'Password must be at least 6 characters and include an uppercase letter and a special character.';
  if (!/[A-Z]/.test(value)) return 'Password must be at least 6 characters and include an uppercase letter and a special character.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must be at least 6 characters and include an uppercase letter and a special character.';
  return '';
}

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  args.set(arg.slice(2), process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[++index] : 'true');
}

const username = String(args.get('username') || '').trim().toLowerCase();
const env = String(args.get('env') || 'development').trim();
const role = String(args.get('role') || (username === 'owner' ? 'owner' : 'developer')).trim().toLowerCase();
const email = String(args.get('email') || '').trim().toLowerCase();
const displayName = String(args.get('display-name') || (role === 'owner' ? 'Owner' : 'Developer')).trim();
if (!username) {
  console.error('Usage: npm run ops-auth:hash -- --username owner --role owner --email owner@example.com --display-name "Owner" --env production');
  process.exit(1);
}
if (!['developer', 'owner', 'employee', 'crew'].includes(role)) {
  console.error('Role must be developer, owner, employee, or crew.');
  process.exit(1);
}

let password = '';
let confirm = '';
if (args.get('password-stdin') === 'true') {
  const lines = (await readStdinText()).split(/\r?\n/);
  password = lines[0] || '';
  confirm = lines[1] || '';
} else {
  const rl = readline.createInterface({ input, output });
  password = await rl.question('New password: ');
  confirm = await rl.question('Confirm password: ');
  rl.close();
}

const policyError = passwordPolicyError(password);
if (policyError) {
  console.error(policyError);
  process.exit(1);
}
if (password !== confirm) {
  console.error('Passwords do not match.');
  process.exit(1);
}

const hash = createPasswordHash(password);
const upsertSql = [
  'INSERT INTO ops_auth_users (username, email, role, display_name, password_hash, auth_provider, enabled)',
  `VALUES (${sqlQuote(username)}, ${email ? sqlQuote(email) : 'NULL'}, ${sqlQuote(role)}, ${sqlQuote(displayName || username)}, ${sqlQuote(hash)}, 'password', 1)`,
  'ON CONFLICT(username) DO UPDATE SET',
  `email = excluded.email, role = excluded.role, display_name = excluded.display_name, password_hash = excluded.password_hash, auth_provider = excluded.auth_provider, enabled = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`
].join(' ');
const revokeSql = [
  'UPDATE ops_auth_sessions',
  "SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')",
  'WHERE user_id IN (SELECT id FROM ops_auth_users',
  `WHERE username = ${sqlQuote(username)} OR email = ${sqlQuote(username)})`,
  'AND revoked_at IS NULL;'
].join(' ');

console.log('\nPassword hash generated. Do not store the plaintext password.');
console.log('\nCreate or update user password hash:');
console.log(`npx wrangler d1 execute --env ${env} --remote OPS_DB --command ${shellQuote(upsertSql)}`);
console.log('\nRevoke existing sessions for this user:');
console.log(`npx wrangler d1 execute --env ${env} --remote OPS_DB --command ${shellQuote(revokeSql)}`);
