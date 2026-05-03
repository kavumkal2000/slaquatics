import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 10000);
const HOST = '0.0.0.0';
const PUBLIC_DIR = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'ops-store.json');
const COOKIE_NAME = 'sla_ops_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const OPS_PASSWORD = process.env.OPS_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'shoreline-admin');
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';
const GOOGLE_REVIEW_URL = process.env.GOOGLE_REVIEW_URL || '';
const FACEBOOK_REVIEW_URL = process.env.FACEBOOK_REVIEW_URL || '';
const AUTO_SEND_REVIEW_REQUESTS = /^true$/i.test(process.env.AUTO_SEND_REVIEW_REQUESTS || 'false');
const REVIEW_REQUEST_CHANNEL = String(process.env.REVIEW_REQUEST_CHANNEL || 'sms').toLowerCase();
const SOCIAL_AUTOMATION_WEBHOOK_URL = process.env.SOCIAL_AUTOMATION_WEBHOOK_URL || '';
const SOCIAL_AUTOMATION_WEBHOOK_SECRET = process.env.SOCIAL_AUTOMATION_WEBHOOK_SECRET || '';
const SOCIAL_FACEBOOK_WEBHOOK_URL = process.env.SOCIAL_FACEBOOK_WEBHOOK_URL || '';
const SOCIAL_INSTAGRAM_WEBHOOK_URL = process.env.SOCIAL_INSTAGRAM_WEBHOOK_URL || '';
const SOCIAL_X_WEBHOOK_URL = process.env.SOCIAL_X_WEBHOOK_URL || '';
const SOCIAL_TIKTOK_WEBHOOK_URL = process.env.SOCIAL_TIKTOK_WEBHOOK_URL || '';

const DEFAULT_STATE = {
  bookings: [
    {id:1,name:'Marcus R.',phone:'(214) 555-0181',email:'marcus@email.com',craft:'yamaha',duration:4,date:'2026-04-22',time:'09:00',drone:true,status:'confirmed',deposit:true,notes:'Group of 4, birthday'},
    {id:2,name:'Ashley L.',phone:'(972) 555-0344',email:'ashley@email.com',craft:'yamaha',duration:2,date:'2026-04-22',time:'13:00',drone:false,status:'pending',deposit:false,notes:''},
    {id:3,name:'James T.',phone:'(469) 555-0092',email:'james@email.com',craft:'boat',duration:4,date:'2026-04-24',time:'10:00',drone:true,status:'confirmed',deposit:true,notes:'Family of 8'},
    {id:4,name:'Sandra P.',phone:'(817) 555-0228',email:'sandra@email.com',craft:'yamaha',duration:8,date:'2026-04-19',time:'08:30',drone:true,status:'completed',deposit:true,notes:''},
    {id:5,name:'Derek K.',phone:'(214) 555-0416',email:'derek@email.com',craft:'yamaha',duration:3,date:'2026-04-18',time:'11:00',drone:false,status:'noshow',deposit:false,notes:'No answer on day-of call'},
    {id:6,name:'Christina N.',phone:'(469) 555-0073',email:'christina@email.com',craft:'boat',duration:6,date:'2026-04-17',time:'09:00',drone:false,status:'completed',deposit:true,notes:''}
  ],
  customers: [
    {id:1,name:'Alex Harper',phone:'(214) 555-0180',email:'alex@example.com',bookings:2,totalSpent:860,lastBooking:'2026-04-09',source:'Google',tag:'repeat'},
    {id:2,name:'Jordan Lee',phone:'(972) 555-0194',email:'jordan@example.com',bookings:1,totalSpent:300,lastBooking:'2026-04-05',source:'Instagram',tag:''},
    {id:3,name:'Taylor Brooks',phone:'(469) 555-0162',email:'taylor@example.com',bookings:1,totalSpent:600,lastBooking:'2026-04-05',source:'Referral',tag:'repeat'},
    {id:4,name:'Casey Morgan',phone:'(817) 555-0118',email:'casey@example.com',bookings:1,totalSpent:330,lastBooking:'2026-03-31',source:'Google',tag:''},
    {id:5,name:'Riley Bennett',phone:'(512) 555-0141',email:'riley@example.com',bookings:3,totalSpent:1800,lastBooking:'2026-03-26',source:'Instagram',tag:'vip'},
    {id:6,name:'Cameron Ellis',phone:'(903) 555-0127',email:'cameron@example.com',bookings:1,totalSpent:500,lastBooking:'2026-03-25',source:'Facebook',tag:''},
    {id:7,name:'Morgan Hayes',phone:'(254) 555-0176',email:'morgan@example.com',bookings:2,totalSpent:1100,lastBooking:'2026-03-20',source:'Referral',tag:'repeat'},
    {id:8,name:'Avery Collins',phone:'(210) 555-0153',email:'avery@example.com',bookings:2,totalSpent:1600,lastBooking:'2026-03-18',source:'Direct',tag:'vip'}
  ],
  expenses: [
    {id:1,date:'2026-04-07',category:'delivery',name:'Trailer fuel and launch run',amount:65,notes:'Little Elm pickup'},
    {id:2,date:'2026-04-10',category:'marketing',name:'Instagram promotion',amount:85,notes:'Weekend promo push'},
    {id:3,date:'2026-04-14',category:'maintenance',name:'Life jacket replacements',amount:120,notes:'Two adult vests'}
  ],
  fuelLog: [
    {craft:'Yamaha VX #2',date:'2026-04-19',gallons:4.2,ppg:3.89,hours:8,ref:'Sandra P.'},
    {craft:'Yamaha VX #1',date:'2026-04-18',gallons:1.8,ppg:3.89,hours:3,ref:'Derek K.'},
    {craft:'Boat',date:'2026-04-17',gallons:3.5,ppg:3.89,hours:6,ref:'Christina N.'},
    {craft:'Boat',date:'2026-04-15',gallons:6.1,ppg:3.89,hours:4,ref:'James T.'}
  ],
  maintLog: [
    {craft:'Yamaha VX #1',type:'Oil change',date:'2026-03-10',hours:80,cost:45,notes:'Mobil 1 10W-30'},
    {craft:'Yamaha VX #2',type:'Full service',date:'2026-03-15',hours:95,cost:180,notes:'Pre-season service'},
    {craft:'Boat',type:'Impeller check',date:'2026-04-01',hours:110,cost:0,notes:'Looked good, no replacement needed'}
  ],
  invoices: [],
  communicationsLog: [],
  reviewRequests: [],
  reviews: [],
  socialPosts: [],
  importMeta: {lastType:'',fileName:'',importedAt:'',added:0,updated:0,recordCount:0,replacedSeed:false},
  invoiceImportMeta: {lastType:'',fileName:'',importedAt:'',added:0,updated:0,recordCount:0,replacedSeed:false}
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeArray(value, fallback) {
  return Array.isArray(value) ? value : clone(fallback);
}

function normalizeImportMeta(value) {
  return value && typeof value === 'object'
    ? {
        lastType: String(value.lastType || ''),
        fileName: String(value.fileName || ''),
        importedAt: String(value.importedAt || ''),
        added: Number(value.added || 0),
        updated: Number(value.updated || 0),
        recordCount: Number(value.recordCount || 0),
        replacedSeed: Boolean(value.replacedSeed)
      }
    : clone(DEFAULT_STATE.importMeta);
}

function sanitizeState(value = {}) {
  return {
    bookings: normalizeArray(value.bookings, DEFAULT_STATE.bookings),
    customers: normalizeArray(value.customers, DEFAULT_STATE.customers),
    expenses: normalizeArray(value.expenses, DEFAULT_STATE.expenses),
    fuelLog: normalizeArray(value.fuelLog, DEFAULT_STATE.fuelLog),
    maintLog: normalizeArray(value.maintLog, DEFAULT_STATE.maintLog),
    invoices: normalizeArray(value.invoices, DEFAULT_STATE.invoices),
    communicationsLog: normalizeArray(value.communicationsLog, DEFAULT_STATE.communicationsLog),
    reviewRequests: normalizeArray(value.reviewRequests, DEFAULT_STATE.reviewRequests),
    reviews: normalizeArray(value.reviews, DEFAULT_STATE.reviews),
    socialPosts: normalizeArray(value.socialPosts, DEFAULT_STATE.socialPosts),
    importMeta: normalizeImportMeta(value.importMeta),
    invoiceImportMeta: normalizeImportMeta(value.invoiceImportMeta)
  };
}

async function createFileStore(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  return {
    kind: 'file',
    async read() {
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        return sanitizeState(JSON.parse(raw));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        const seed = sanitizeState(DEFAULT_STATE);
        await this.write(seed);
        return seed;
      }
    },
    async write(state) {
      const next = sanitizeState(state);
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(next, null, 2));
      await fs.rename(tempPath, filePath);
      return next;
    }
  };
}

async function createPostgresStore(connectionString) {
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS ops_state (
      id INTEGER PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  return {
    kind: 'postgres',
    async read() {
      const result = await client.query('SELECT payload FROM ops_state WHERE id = 1');
      if (!result.rows.length) {
        const seed = sanitizeState(DEFAULT_STATE);
        await this.write(seed);
        return seed;
      }
      return sanitizeState(result.rows[0].payload);
    },
    async write(state) {
      const next = sanitizeState(state);
      await client.query(
        `
          INSERT INTO ops_state (id, payload, updated_at)
          VALUES (1, $1::jsonb, NOW())
          ON CONFLICT (id)
          DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `,
        [JSON.stringify(next)]
      );
      return next;
    }
  };
}

async function createStore() {
  if (process.env.DATABASE_URL) {
    try {
      return await createPostgresStore(process.env.DATABASE_URL);
    } catch (error) {
      console.error('Postgres store unavailable, falling back to file store.', error);
    }
  }
  return createFileStore(STORE_FILE);
}

const stateStore = await createStore();

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        if (separator === -1) return [part, ''];
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

function signToken(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function createSessionToken() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${nonce}.${expiresAt}`;
  return `${payload}.${signToken(payload)}`;
}

function verifySessionToken(token = '') {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expiresAt, signature] = parts;
  if (!nonce || !expiresAt || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;
  const expected = signToken(`${nonce}.${expiresAt}`);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function isAuthenticated(request) {
  const cookies = parseCookies(request.headers.cookie || '');
  return verifySessionToken(cookies[COOKIE_NAME] || '');
}

function setSessionCookie(response) {
  const token = createSessionToken();
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
}

function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function setCommonHeaders(response, overrides = {}) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'same-origin');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  Object.entries(overrides).forEach(([key, value]) => response.setHeader(key, value));
}

function sendJson(response, statusCode, payload, headers = {}) {
  setCommonHeaders(response, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  response.writeHead(statusCode);
  response.end(JSON.stringify(payload));
}

function publicCorsHeaders(request) {
  const origin = request?.headers?.origin;
  return {
    'Access-Control-Allow-Origin': origin && origin !== 'null' ? origin : '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function sendPublicJson(response, request, statusCode, payload) {
  sendJson(response, statusCode, payload, publicCorsHeaders(request));
}

function sendPublicNoContent(response, request) {
  setCommonHeaders(response, publicCorsHeaders(request));
  response.writeHead(204);
  response.end();
}

function sendRedirect(response, location) {
  setCommonHeaders(response, { Location: location, 'Cache-Control': 'no-store' });
  response.writeHead(302);
  response.end();
}

async function readRequestBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 5 * 1024 * 1024) {
      throw new Error('Request body too large');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function normalizePhone(value = '') {
  const digits = String(value).replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function phoneDigits(value = '') {
  return String(value || '').replace(/\D/g, '');
}

function htmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstName(value = '') {
  return String(value || '').trim().split(/\s+/)[0] || 'there';
}

function nextId(items = []) {
  return items.reduce((max, item) => Math.max(max, Number(item?.id || 0)), 0) + 1;
}

function parseIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(`${String(value)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function latestDateValue(first, second) {
  if (!second) return first || '';
  if (!first) return second;
  const firstDate = parseIsoDate(first);
  const secondDate = parseIsoDate(second);
  if (!firstDate) return second;
  if (!secondDate) return first;
  return secondDate > firstDate ? second : first;
}

function isTruthyWaiver(value) {
  return Boolean(value?.acceptedRisk && value?.acceptedDamage && value?.signature);
}

function sanitizePublicCustomer(customer = {}) {
  return {
    id: Number(customer.id || 0),
    name: String(customer.name || '').trim(),
    phone: String(customer.phone || '').trim(),
    email: String(customer.email || '').trim(),
    bookings: Number(customer.bookings || 0),
    totalSpent: Number(customer.totalSpent || 0),
    lastBooking: String(customer.lastBooking || ''),
    waiverOnFile: Boolean(customer.waiverSignedAt || customer.waiver?.signedAt || customer.waiverSignature),
    waiverSignedAt: String(customer.waiverSignedAt || customer.waiver?.signedAt || ''),
    waiverSignature: String(customer.waiverSignature || customer.waiver?.signature || ''),
    emergencyName: String(customer.emergencyName || customer.waiver?.emergencyName || ''),
    emergencyPhone: String(customer.emergencyPhone || customer.waiver?.emergencyPhone || '')
  };
}

function findMatchingCustomer(state, payload = {}) {
  const phoneKey = phoneDigits(payload.phone);
  const emailKey = normalizeEmail(payload.email);
  return state.customers.find((customer) => (
    (phoneKey && phoneDigits(customer.phone) === phoneKey) ||
    (emailKey && normalizeEmail(customer.email) === emailKey)
  )) || null;
}

function findMatchingBooking(state, payload = {}) {
  const phoneKey = phoneDigits(payload.phone);
  const emailKey = normalizeEmail(payload.email);
  const craftLabel = String(payload.craftLabel || '').trim();
  return state.bookings.find((booking) => (
    booking.date === payload.date &&
    booking.time === payload.time &&
    Number(booking.duration || 0) === Number(payload.duration || 0) &&
    String(booking.craftLabel || '').trim() === craftLabel &&
    (
      (phoneKey && phoneDigits(booking.phone) === phoneKey) ||
      (emailKey && normalizeEmail(booking.email) === emailKey)
    )
  )) || null;
}

function updateCustomerRollup(state, customer) {
  const phoneKey = phoneDigits(customer.phone);
  const emailKey = normalizeEmail(customer.email);
  const relatedBookings = state.bookings.filter((booking) => (
    (phoneKey && phoneDigits(booking.phone) === phoneKey) ||
    (emailKey && normalizeEmail(booking.email) === emailKey)
  ));
  customer.bookings = relatedBookings.length;
  customer.totalSpent = relatedBookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0);
  customer.lastBooking = relatedBookings.reduce((latest, booking) => latestDateValue(latest, booking.date), customer.lastBooking || '');
  if (customer.bookings > 1 && customer.tag !== 'vip') customer.tag = 'repeat';
}

function publicCustomerPayload(customer) {
  return sanitizePublicCustomer(customer);
}

function publicCraftKey(type = '', craft = '') {
  if (type === 'boat') return 'boat';
  if (type === 'bundle') return 'bundle';
  return 'yamaha';
}

function integrationStatus() {
  const socialPlatforms = [
    SOCIAL_FACEBOOK_WEBHOOK_URL ? 'facebook' : '',
    SOCIAL_INSTAGRAM_WEBHOOK_URL ? 'instagram' : '',
    SOCIAL_X_WEBHOOK_URL ? 'x' : '',
    SOCIAL_TIKTOK_WEBHOOK_URL ? 'tiktok' : ''
  ].filter(Boolean);
  return {
    smsConfigured: Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER),
    emailConfigured: Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL),
    reviewLinksConfigured: Boolean(GOOGLE_REVIEW_URL || FACEBOOK_REVIEW_URL),
    reviewAutomationEnabled: AUTO_SEND_REVIEW_REQUESTS,
    reviewChannel: REVIEW_REQUEST_CHANNEL,
    socialConfigured: Boolean(SOCIAL_AUTOMATION_WEBHOOK_URL || socialPlatforms.length),
    socialAutomationConfigured: Boolean(SOCIAL_AUTOMATION_WEBHOOK_URL),
    socialPlatforms
  };
}

function reviewLinksText() {
  const links = [];
  if (GOOGLE_REVIEW_URL) links.push(`Google: ${GOOGLE_REVIEW_URL}`);
  if (FACEBOOK_REVIEW_URL) links.push(`Facebook: ${FACEBOOK_REVIEW_URL}`);
  return links.join('\n');
}

function reviewLinksHtml() {
  const links = [];
  if (GOOGLE_REVIEW_URL) links.push(`<a href="${htmlEscape(GOOGLE_REVIEW_URL)}">Leave a Google review</a>`);
  if (FACEBOOK_REVIEW_URL) links.push(`<a href="${htmlEscape(FACEBOOK_REVIEW_URL)}">Leave a Facebook review</a>`);
  return links.join('<br>');
}

async function sendTwilioSms({ to, body }) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error('Twilio SMS is not configured yet.');
  }
  const destination = normalizePhone(to);
  if (!destination) {
    throw new Error('A valid destination phone number is required.');
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const payload = new URLSearchParams({
    To: destination,
    From: TWILIO_FROM_NUMBER,
    Body: String(body || '')
  });
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.message || 'Twilio rejected the message request.');
  }
  return json;
}

async function sendResendEmail({ to, subject, text, html, bcc = [] }) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error('Resend email is not configured yet.');
  }
  const recipients = Array.isArray(to) ? to.map(normalizeEmail).filter(Boolean) : [normalizeEmail(to)].filter(Boolean);
  const bccRecipients = Array.isArray(bcc) ? bcc.map(normalizeEmail).filter(Boolean) : [normalizeEmail(bcc)].filter(Boolean);
  if (!recipients.length) {
    throw new Error('At least one valid recipient email is required.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: recipients,
      bcc: bccRecipients.length ? bccRecipients : undefined,
      subject: subject || 'Shoreline Aquatics',
      text: text || '',
      html: html || `<p>${htmlEscape(text || '')}</p>`
    })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.message || json?.error?.message || 'Resend rejected the email request.';
    throw new Error(message);
  }
  return json;
}

async function postWebhook(url, payload, extraHeaders = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(text || `Webhook request failed (${response.status})`);
  }
  return { status: response.status, body: text };
}

async function dispatchSocialPost(payload) {
  const selected = Array.isArray(payload.platforms) ? payload.platforms : [];
  const platformMap = {
    facebook: SOCIAL_FACEBOOK_WEBHOOK_URL,
    instagram: SOCIAL_INSTAGRAM_WEBHOOK_URL,
    x: SOCIAL_X_WEBHOOK_URL,
    tiktok: SOCIAL_TIKTOK_WEBHOOK_URL
  };
  const secretHeaders = SOCIAL_AUTOMATION_WEBHOOK_SECRET
    ? { 'X-Shoreline-Webhook-Secret': SOCIAL_AUTOMATION_WEBHOOK_SECRET }
    : {};

  const results = [];
  const unmatched = [];

  for (const platform of selected) {
    const targetUrl = platformMap[platform];
    if (!targetUrl) {
      unmatched.push(platform);
      continue;
    }
    const response = await postWebhook(targetUrl, { ...payload, platform }, secretHeaders);
    results.push({ platform, ...response });
  }

  if (SOCIAL_AUTOMATION_WEBHOOK_URL) {
    const response = await postWebhook(SOCIAL_AUTOMATION_WEBHOOK_URL, payload, secretHeaders);
    results.push({ platform: 'automation', ...response });
  } else if (unmatched.length) {
    throw new Error(`No social webhook configured for: ${unmatched.join(', ')}`);
  }

  if (!results.length) {
    throw new Error('No social webhook is configured yet.');
  }
  return results;
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.zip': 'application/zip'
  }[extension] || 'application/octet-stream';
}

async function resolveStaticFile(pathname) {
  let relativePath = decodeURIComponent(pathname);
  if (relativePath === '/') relativePath = '/index.html';
  const withoutLeadingSlash = relativePath.replace(/^\/+/, '');
  let filePath = path.resolve(PUBLIC_DIR, withoutLeadingSlash);
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {
    if (!path.extname(filePath)) {
      filePath = path.resolve(PUBLIC_DIR, withoutLeadingSlash, 'index.html');
    }
  }
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  return filePath;
}

async function serveFile(response, filePath, headers = {}) {
  try {
    const data = await fs.readFile(filePath);
    setCommonHeaders(response, {
      'Content-Type': contentTypeFor(filePath),
      'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
      ...headers
    });
    response.writeHead(200);
    response.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }
    console.error('Static file error:', error);
    sendJson(response, 500, { error: 'Failed to load file' });
  }
}

async function handleApi(request, response, pathname) {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (pathname === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, { ok: true, storage: stateStore.kind });
    return true;
  }

  if (pathname === '/api/auth/session' && request.method === 'GET') {
    sendJson(response, 200, { authenticated: isAuthenticated(request), storage: stateStore.kind });
    return true;
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    if (!OPS_PASSWORD) {
      sendJson(response, 503, { error: 'OPS_PASSWORD is not configured yet for this service.' });
      return true;
    }
    try {
      const body = JSON.parse(await readRequestBody(request) || '{}');
      if (String(body.password || '') !== OPS_PASSWORD) {
        sendJson(response, 401, { error: 'Incorrect operations password.' });
        return true;
      }
      setSessionCookie(response);
      sendJson(response, 200, { ok: true });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: 'Invalid login payload.' });
      return true;
    }
  }

  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    clearSessionCookie(response);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (pathname.startsWith('/api/public/') && request.method === 'OPTIONS') {
    sendPublicNoContent(response, request);
    return true;
  }

  if (pathname === '/api/public/customer-lookup' && request.method === 'GET') {
    const state = await stateStore.read();
    const customer = findMatchingCustomer(state, {
      phone: requestUrl.searchParams.get('phone') || '',
      email: requestUrl.searchParams.get('email') || ''
    });
    sendPublicJson(response, request, 200, {
      ok: true,
      found: Boolean(customer),
      customer: customer ? publicCustomerPayload(customer) : null
    });
    return true;
  }

  if (pathname === '/api/public/booking-request' && request.method === 'POST') {
    try {
      const payload = JSON.parse(await readRequestBody(request) || '{}');
      if (!payload?.name || !payload?.phone || !payload?.date || !payload?.time) {
        throw new Error('Customer name, phone number, requested date, and start time are required.');
      }
      if (!payload?.craft || !payload?.craftLabel || !payload?.duration || !payload?.total) {
        throw new Error('A valid package, duration, and total are required.');
      }
      if (!isTruthyWaiver(payload.waiver)) {
        throw new Error('A completed waiver is required before saving this booking request.');
      }

      const state = await stateStore.read();
      const now = new Date().toISOString();
      const existingCustomer = findMatchingCustomer(state, payload);
      const customer = existingCustomer || {
        id: nextId(state.customers),
        name: String(payload.name || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim(),
        bookings: 0,
        totalSpent: 0,
        lastBooking: '',
        source: 'Website Booking',
        tag: '',
        company: '',
        crmTags: '',
        crmNotes: '',
        createdAt: now.split('T')[0],
        lastActivity: now,
        importSource: 'website'
      };

      customer.name = String(payload.name || customer.name || '').trim();
      customer.phone = String(payload.phone || customer.phone || '').trim();
      customer.email = String(payload.email || customer.email || '').trim();
      customer.lastActivity = now;
      customer.source = customer.source || 'Website Booking';
      customer.importSource = customer.importSource || 'website';
      customer.waiverSignedAt = String(payload.waiver.signatureDate || payload.date || now.split('T')[0]).trim();
      customer.waiverSignature = String(payload.waiver.signature || '').trim();
      customer.emergencyName = String(payload.waiver.emergencyName || '').trim();
      customer.emergencyPhone = String(payload.waiver.emergencyPhone || '').trim();
      customer.waiver = {
        acceptedRisk: true,
        acceptedDamage: true,
        signature: customer.waiverSignature,
        signedAt: customer.waiverSignedAt,
        emergencyName: customer.emergencyName,
        emergencyPhone: customer.emergencyPhone
      };

      if (!existingCustomer) {
        state.customers.push(customer);
      }

      const existingBooking = findMatchingBooking(state, payload);
      const booking = existingBooking || {
        id: nextId(state.bookings),
        status: 'pending',
        deposit: false
      };

      booking.name = customer.name;
      booking.phone = customer.phone;
      booking.email = customer.email;
      booking.craft = publicCraftKey(payload.type, payload.craft);
      booking.craftLabel = String(payload.craftLabel || '').trim();
      booking.duration = Number(payload.duration || 0);
      booking.durationLabel = String(payload.durationLabel || '').trim();
      booking.total = Number(payload.total || 0);
      booking.drone = Boolean(payload.drone);
      booking.date = String(payload.date || '').trim();
      booking.time = String(payload.time || '').trim();
      booking.location = String(payload.location || '').trim();
      booking.contactMethod = String(payload.contactMethod || 'text').trim();
      booking.partySize = String(payload.partySize || '').trim();
      booking.notes = String(payload.notes || '').trim();
      booking.customerId = customer.id;
      booking.source = 'Website Booking';
      booking.updatedAt = now;
      booking.waiverSignedAt = customer.waiverSignedAt;
      booking.waiverSignature = customer.waiverSignature;
      booking.emergencyName = customer.emergencyName;
      booking.emergencyPhone = customer.emergencyPhone;
      booking.waiverAccepted = true;

      if (!existingBooking) {
        booking.createdAt = now;
        state.bookings.push(booking);
      }

      updateCustomerRollup(state, customer);
      await stateStore.write(state);

      sendPublicJson(response, request, 200, {
        ok: true,
        bookingId: booking.id,
        matchedExistingCustomer: Boolean(existingCustomer),
        waiverStored: true,
        customer: publicCustomerPayload(customer)
      });
      return true;
    } catch (error) {
      sendPublicJson(response, request, 400, {
        error: error.message || 'Could not save the booking request.'
      });
      return true;
    }
  }

  if (!pathname.startsWith('/api/ops/')) return false;
  if (!isAuthenticated(request)) {
    sendJson(response, 401, { error: 'Authentication required.' });
    return true;
  }

  if (pathname === '/api/ops/integrations/status' && request.method === 'GET') {
    sendJson(response, 200, { ok: true, integrations: integrationStatus() });
    return true;
  }

  if (pathname === '/api/ops/state' && request.method === 'GET') {
    const state = await stateStore.read();
    sendJson(response, 200, { state, storage: stateStore.kind });
    return true;
  }

  if (pathname === '/api/ops/state' && (request.method === 'PUT' || request.method === 'POST')) {
    try {
      const body = JSON.parse(await readRequestBody(request) || '{}');
      const state = await stateStore.write(body);
      sendJson(response, 200, { ok: true, state });
      return true;
    } catch (error) {
      console.error('State write failed:', error);
      sendJson(response, 400, { error: 'Could not save operations state.' });
      return true;
    }
  }

  if (pathname === '/api/ops/messages/send' && request.method === 'POST') {
    try {
      const body = JSON.parse(await readRequestBody(request) || '{}');
      const channel = String(body.channel || '').toLowerCase();
      if (channel === 'sms') {
        const result = await sendTwilioSms({ to: body.to, body: body.body });
        sendJson(response, 200, { ok: true, channel, result });
        return true;
      }
      if (channel === 'email') {
        const result = await sendResendEmail({
          to: body.to,
          subject: body.subject,
          text: body.body,
          html: body.html
        });
        sendJson(response, 200, { ok: true, channel, result });
        return true;
      }
      if (channel === 'mass-email') {
        const toRecipients = Array.isArray(body.to) && body.to.length ? body.to : [RESEND_FROM_EMAIL];
        const result = await sendResendEmail({
          to: toRecipients,
          bcc: body.bcc || [],
          subject: body.subject,
          text: body.body,
          html: body.html
        });
        sendJson(response, 200, { ok: true, channel, result });
        return true;
      }
      sendJson(response, 400, { error: 'Unsupported messaging channel.' });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error.message || 'Could not send message.' });
      return true;
    }
  }

  if (pathname === '/api/ops/reviews/send' && request.method === 'POST') {
    try {
      const body = JSON.parse(await readRequestBody(request) || '{}');
      if (!GOOGLE_REVIEW_URL && !FACEBOOK_REVIEW_URL) {
        throw new Error('Review links are not configured yet.');
      }
      const channel = String(body.channel || REVIEW_REQUEST_CHANNEL || 'sms').toLowerCase();
      const customerName = body.customerName || 'there';
      const subject = 'Thanks for riding with Shoreline Aquatics';
      const text = [
        `Hey ${firstName(customerName)}! Thanks again for riding with Shoreline Aquatics.`,
        'If you had a great time, we would really appreciate a quick review:',
        reviewLinksText()
      ].filter(Boolean).join('\n\n');
      const html = `<p>Hey ${htmlEscape(firstName(customerName))}! Thanks again for riding with Shoreline Aquatics.</p><p>If you had a great time, we would really appreciate a quick review:</p><p>${reviewLinksHtml()}</p>`;

      let result;
      if (channel === 'email') {
        result = await sendResendEmail({ to: body.email, subject, text, html });
      } else {
        result = await sendTwilioSms({ to: body.phone, body: text });
      }
      sendJson(response, 200, { ok: true, channel, result });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error.message || 'Could not send review request.' });
      return true;
    }
  }

  if (pathname === '/api/ops/social/publish' && request.method === 'POST') {
    try {
      const body = JSON.parse(await readRequestBody(request) || '{}');
      const caption = String(body.caption || '').trim();
      if (!caption) {
        throw new Error('A caption is required before publishing.');
      }
      const payload = {
        source: 'shoreline-ops',
        caption,
        link: String(body.link || '').trim(),
        platforms: Array.isArray(body.platforms) ? body.platforms : [],
        createdAt: new Date().toISOString()
      };
      const result = await dispatchSocialPost(payload);
      sendJson(response, 200, { ok: true, result });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error.message || 'Could not dispatch the social post.' });
      return true;
    }
  }

  sendJson(response, 404, { error: 'Unknown API route.' });
  return true;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (await handleApi(request, response, pathname)) return;

    if (pathname === '/ops') {
      sendRedirect(response, '/ops.html');
      return;
    }

    if (pathname === '/ops-login') {
      sendRedirect(response, '/ops-login.html');
      return;
    }

    if (pathname === '/ops.html') {
      if (!isAuthenticated(request)) {
        sendRedirect(response, '/ops-login.html');
        return;
      }
      await serveFile(response, path.join(PUBLIC_DIR, 'ops.html'), {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex'
      });
      return;
    }

    if (pathname === '/ops-login.html') {
      if (isAuthenticated(request)) {
        sendRedirect(response, '/ops.html');
        return;
      }
      await serveFile(response, path.join(PUBLIC_DIR, 'ops-login.html'), {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex'
      });
      return;
    }

    const filePath = await resolveStaticFile(pathname);
    if (!filePath) {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }
    await serveFile(response, filePath);
  } catch (error) {
    console.error('Unhandled request error:', error);
    sendJson(response, 500, { error: 'Internal server error.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Shoreline ops server listening on http://${HOST}:${PORT} using ${stateStore.kind} storage`);
});
