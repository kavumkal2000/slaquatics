import crypto from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

const email = process.env.CMS_OWNER_EMAIL;
const password = process.env.CMS_OWNER_PASSWORD;
const name = process.env.CMS_OWNER_NAME || 'CMS Owner';

if (!email || !password) {
  console.error('Set CMS_OWNER_EMAIL and CMS_OWNER_PASSWORD before running this script.');
  process.exit(1);
}

const id = `cms-owner-${crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16)}`;
const iterations = 210000;
const salt = crypto.randomBytes(16).toString('base64');
const derived = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), iterations, 32, 'sha256').toString('base64');
const passwordHash = `pbkdf2-sha256$${iterations}$${salt}$${derived}`;
const now = new Date().toISOString();

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const sql = [
  'INSERT INTO cms_users (id, email, role, name, password_hash, created_at)',
  `VALUES (${sqlString(id)}, ${sqlString(email)}, 'owner', ${sqlString(name)}, ${sqlString(passwordHash)}, ${sqlString(now)})`,
  'ON CONFLICT(email) DO UPDATE SET role = excluded.role, name = excluded.name, password_hash = excluded.password_hash;'
].join('\n');

mkdirSync('tmp', { recursive: true });
writeFileSync('tmp/seed-cms-owner.sql', `${sql}\n`);
console.log('Wrote tmp/seed-cms-owner.sql');
