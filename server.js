import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import Stripe from 'stripe';

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
const LEGACY_OPS_PASSWORD = process.env.OPS_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'shoreline-admin');
const OPS_DEV_USERNAME = String(process.env.OPS_DEV_USERNAME || 'developer').trim().toLowerCase();
const OPS_DEV_PASSWORD = process.env.OPS_DEV_PASSWORD || LEGACY_OPS_PASSWORD || '';
const OPS_OWNER_USERNAME = String(process.env.OPS_OWNER_USERNAME || 'owner').trim().toLowerCase();
const OPS_OWNER_PASSWORD = process.env.OPS_OWNER_PASSWORD || '';
const OPS_OWNER_PASSWORD_HASH = process.env.OPS_OWNER_PASSWORD_HASH || '';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'Shoreline Aquatics';
const RESEND_REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || '';
const BOOKING_ALERT_EMAILS = process.env.BOOKING_ALERT_EMAILS || process.env.BOOKING_ALERT_EMAIL || '';
const SEND_BOOKING_REQUEST_CUSTOMER_EMAILS = /^true$/i.test(process.env.SEND_BOOKING_REQUEST_CUSTOMER_EMAILS || 'false');
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
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const PUBLIC_SITE_URL = String(process.env.PUBLIC_SITE_URL || 'https://slaquatics.com').replace(/\/+$/, '');
const REQUIRE_SERVER_STORE = /^true$/i.test(process.env.REQUIRE_SERVER_STORE || '') || process.env.NODE_ENV === 'production';
const STRIPE_API_VERSION = '2026-02-25.clover';
const BOOKING_DEPOSIT_CENTS = 5000;
const PROCESSING_FEE_CENTS = 500;
const DRONE_ADDON_CENTS = 5000;
const TOTAL_PUBLIC_JET_SKIS = 4;
const PUBLIC_BOOKING_START_TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const SHORELINE_PHONE_DISPLAY = '(469) 693-7164';
const SHORELINE_PHONE_LINK = '4696937164';
const SHORELINE_LOCATION_NAME = 'Shoreline Aquatics launch';
const SHORELINE_ADDRESS = '2000 Main St, Hickory Creek, TX 75065';
const ARRIVAL_INSTRUCTIONS = [
  'Proceed down Main Street until you pass the storage units on your left.',
  'Continue straight ahead and enter the park.',
  'Upon entering, make an immediate left.',
  'Follow the road straight to the boat ramp.',
  'The cabanas will be on your left — Shoreline Aquatics and the jet skis will be located in this area.'
];
const SAFETY_BRIEFING_POINTS = [
  'Life jackets stay on for every rider from launch to return.',
  'The driver keeps the safety lanyard clipped in while operating the jet ski.',
  'No alcohol or drugs. If you are impaired, you do not ride.',
  'Idle out from the launch and stay slow near docks, swimmers, boats, and shoreline.',
  'If weather changes or anything feels wrong, slow down, stop safely, and call Shoreline.'
];
const PRICING_CENTS = {
  jetski2: { 2: 30000, 3: 45000, 4: 56000, 6: 72000, 8: 90000 },
  jetski3: { 2: 45000, 3: 67500, 4: 84000, 6: 108000, 8: 135000 },
  jetski4: { 2: 60000, 3: 90000, 4: 112000, 6: 144000, 8: 180000 },
  boat: { 1: 12000, 2: 24000, 3: 36000, 4: 48000, 6: 72000, 8: 96000 },
  bundle2: { 2: 54000, 3: 81000, 4: 104000, 6: 144000, 8: 186000 },
  bundle3: { 2: 69000, 3: 103500, 4: 132000, 6: 180000, 8: 231000 },
  bundle4: { 2: 84000, 3: 126000, 4: 160000, 6: 216000, 8: 276000 }
};
const CRAFT_LABELS = {
  jetski2: '2 Yamaha Jet Skis',
  jetski3: '3 Yamaha Jet Skis',
  jetski4: '4 Yamaha Jet Skis',
  boat: 'Boat Rental',
  bundle2: '2 Yamaha Jet Skis + Boat',
  bundle3: '3 Yamaha Jet Skis + Boat',
  bundle4: '4 Yamaha Jet Skis + Boat'
};
const LEGACY_CRAFT_MAP = {
  yamaha: 'jetski2',
  seadoo2: 'jetski2',
  seadoo4: 'jetski4'
};
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  : null;

const DEFAULT_STATE = {
  bookings: [],
  customers: [],
  expenses: [],
  fuelLog: [],
  maintLog: [],
  trackers: [],
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
    trackers: normalizeArray(value.trackers, DEFAULT_STATE.trackers),
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
      if (REQUIRE_SERVER_STORE) {
        throw new Error(`Postgres store unavailable and file fallback is disabled: ${error.message}`);
      }
      console.error('Postgres store unavailable, falling back to file store.', error);
    }
  }
  if (REQUIRE_SERVER_STORE) {
    throw new Error('DATABASE_URL is required because server-side file fallback is disabled.');
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

function normalizeUsername(value = '') {
  return String(value || '').trim().toLowerCase();
}

function safeSecretEquals(left, right) {
  const leftHash = crypto.createHash('sha256').update(String(left || '')).digest();
  const rightHash = crypto.createHash('sha256').update(String(right || '')).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function verifyPasswordHash(password, encoded = '') {
  const [salt = '', expected = ''] = String(encoded || '').split(':');
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return safeSecretEquals(derived, expected);
}

function authPermissionsForRole(role = 'owner') {
  return {
    canAccessBusinessData: true,
    canAccessSystem: role === 'developer',
    canAccessWebsiteDevelopment: role === 'developer'
  };
}

function listOpsUsers() {
  return [
    {
      username: normalizeUsername(OPS_DEV_USERNAME || 'developer'),
      role: 'developer',
      displayName: 'Developer',
      matches(password = '') {
        return Boolean(OPS_DEV_PASSWORD) && safeSecretEquals(password, OPS_DEV_PASSWORD);
      }
    },
    {
      username: normalizeUsername(OPS_OWNER_USERNAME || 'owner'),
      role: 'owner',
      displayName: 'Owner',
      matches(password = '') {
        if (OPS_OWNER_PASSWORD) return safeSecretEquals(password, OPS_OWNER_PASSWORD);
        return verifyPasswordHash(password, OPS_OWNER_PASSWORD_HASH);
      }
    }
  ];
}

function findOpsUser(username = '', password = '') {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return listOpsUsers().find((user) => user.username === normalized && user.matches(password)) || null;
}

function createSessionToken(user = {}) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = Buffer.from(JSON.stringify({
    nonce,
    expiresAt: Date.now() + SESSION_TTL_MS,
    username: normalizeUsername(user.username || ''),
    role: user.role === 'developer' ? 'developer' : 'owner'
  })).toString('base64url');
  return `${payload}.${signToken(payload)}`;
}

function verifySessionToken(token = '') {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  const expected = signToken(payload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded || Number(decoded.expiresAt || 0) < Date.now()) return null;
    return {
      username: normalizeUsername(decoded.username || ''),
      role: decoded.role === 'developer' ? 'developer' : 'owner',
      expiresAt: Number(decoded.expiresAt || 0),
      permissions: authPermissionsForRole(decoded.role)
    };
  } catch {
    return null;
  }
}

function getSession(request) {
  const cookies = parseCookies(request.headers.cookie || '');
  return verifySessionToken(cookies[COOKIE_NAME] || '');
}

function sessionUserPayload(session) {
  if (!session) return null;
  const matchedUser = listOpsUsers().find((user) => user.username === session.username);
  return {
    username: session.username,
    role: session.role,
    displayName: matchedUser?.displayName || (session.role === 'developer' ? 'Developer' : 'Owner'),
    permissions: session.permissions || authPermissionsForRole(session.role)
  };
}

function isAuthenticated(request) {
  return Boolean(getSession(request));
}

function sessionCookieAttributes() {
  const attributes = [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`
  ];
  if (process.env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }
  return attributes.join('; ');
}

function setSessionCookie(response, user) {
  const token = createSessionToken(user);
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; ${sessionCookieAttributes()}; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
}

function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${sessionCookieAttributes()}; Max-Age=0`);
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

function normalizeName(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeEmailList(value = '') {
  return String(value || '')
    .split(/[,\n;]+/)
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

function formattedResendFromAddress() {
  const fromAddress = String(RESEND_FROM_EMAIL || '').trim();
  if (!fromAddress) return '';
  if (/[<>]/.test(fromAddress)) return fromAddress;
  const displayName = String(RESEND_FROM_NAME || '').trim();
  return displayName ? `${displayName} <${fromAddress}>` : fromAddress;
}

function resendReplyToAddress() {
  const explicitReplyTo = normalizeEmail(RESEND_REPLY_TO_EMAIL);
  if (explicitReplyTo) return explicitReplyTo;
  const alertReplyTo = normalizeEmailList(BOOKING_ALERT_EMAILS)[0];
  if (alertReplyTo) return alertReplyTo;
  return '';
}

function normalizeCraftKey(value = '') {
  return LEGACY_CRAFT_MAP[String(value || '').trim()] || String(value || '').trim();
}

function bookingTypeForCraft(craft = '') {
  if (craft === 'boat') return 'boat';
  if (craft.startsWith('bundle')) return 'bundle';
  return 'jetski';
}

function durationLabel(hours) {
  const amount = Number(hours || 0);
  return amount === 8 ? 'Full Day (8 hours)' : `${amount} ${amount === 1 ? 'hour' : 'hours'}`;
}

function priceForSelection(craft = '', duration = 0, drone = false) {
  const normalizedCraft = normalizeCraftKey(craft);
  const normalizedDuration = Number(duration || 0);
  const droneEnabled = drone === true || drone === 'true' || drone === 'yes' || drone === 1 || drone === '1';
  const baseAmount = PRICING_CENTS[normalizedCraft]?.[normalizedDuration];
  if (!baseAmount) {
    throw new Error('Please choose a valid package and duration before continuing.');
  }
  return {
    craft: normalizedCraft,
    type: bookingTypeForCraft(normalizedCraft),
    craftLabel: CRAFT_LABELS[normalizedCraft] || normalizedCraft,
    duration: normalizedDuration,
    durationLabel: durationLabel(normalizedDuration),
    drone: droneEnabled,
    baseAmount,
    droneAmount: droneEnabled ? DRONE_ADDON_CENTS : 0,
    totalAmount: baseAmount + (droneEnabled ? DRONE_ADDON_CENTS : 0),
    bookingDepositAmount: BOOKING_DEPOSIT_CENTS
  };
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

function formatCurrency(value = 0) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number(value || 0) % 1 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

function formatDateLabel(value = '') {
  const parsed = parseIsoDate(value);
  if (!parsed) return value || '-';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function formatTimeLabel(value = '') {
  const [hourText = '', minuteText = '00'] = String(value || '').split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return value || '-';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minuteText} ${suffix}`;
}

function timeToMinutes(value = '') {
  const [hourText = '', minuteText = '00'] = String(value || '').split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return (hour * 60) + minute;
}

function craftUsesBoat(craft = '') {
  const normalized = normalizeCraftKey(craft);
  return normalized === 'boat' || normalized.startsWith('bundle');
}

function craftJetSkiCount(craft = '') {
  const normalized = normalizeCraftKey(craft);
  if (normalized.startsWith('jetski')) return Number.parseInt(normalized.replace('jetski', ''), 10) || 0;
  if (normalized.startsWith('bundle')) return Number.parseInt(normalized.replace('bundle', ''), 10) || 0;
  return 0;
}

function craftAvailabilityType(craft = '') {
  const usesBoat = craftUsesBoat(craft);
  const jetSkiCount = craftJetSkiCount(craft);
  if (usesBoat && jetSkiCount) return 'bundle';
  if (usesBoat) return 'boat';
  if (jetSkiCount) return 'jetski';
  return 'none';
}

function bookingBlocksAvailability(booking = {}) {
  const status = String(booking.status || '').trim().toLowerCase();
  return Boolean(
    booking.date &&
    booking.time &&
    Number(booking.duration || 0) > 0 &&
    !['draft', 'cancelled', 'canceled', 'noshow', 'no-show', 'void', 'expired'].includes(status)
  );
}

function intervalsOverlap(startMinutesA, durationHoursA, startMinutesB, durationHoursB) {
  const endMinutesA = startMinutesA + (Number(durationHoursA || 0) * 60);
  const endMinutesB = startMinutesB + (Number(durationHoursB || 0) * 60);
  return startMinutesA < endMinutesB && startMinutesB < endMinutesA;
}

function findOverlappingBookings(state, options = {}) {
  const requestedDate = String(options.date || '').trim();
  const requestedTime = String(options.time || '').trim();
  const requestedDuration = Number(options.duration || 0);
  const requestedStart = timeToMinutes(requestedTime);
  const ignoredId = Number(options.bookingId || 0);
  const ignoredToken = String(options.publicToken || '').trim();

  if (!requestedDate || !requestedTime || !requestedDuration || Number.isNaN(requestedStart)) {
    return [];
  }

  return state.bookings.filter((booking) => {
    if (!bookingBlocksAvailability(booking)) return false;
    if (String(booking.date || '').trim() !== requestedDate) return false;
    if (ignoredId && Number(booking.id || 0) === ignoredId) return false;
    if (ignoredToken && String(booking.publicToken || '').trim() === ignoredToken) return false;

    const bookingStart = timeToMinutes(booking.time);
    const bookingDuration = Number(booking.duration || 0);
    if (Number.isNaN(bookingStart) || !bookingDuration) return false;

    return intervalsOverlap(requestedStart, requestedDuration, bookingStart, bookingDuration);
  });
}

function findBoatConflicts(state, options = {}) {
  return findOverlappingBookings(state, options).filter((booking) => (
    craftUsesBoat(String(booking.craftKey || booking.craft || ''))
  ));
}

function findJetSkiConflicts(state, options = {}) {
  return findOverlappingBookings(state, options).filter((booking) => (
    craftJetSkiCount(String(booking.craftKey || booking.craft || '')) > 0
  ));
}

function jetSkiUnitsBooked(state, options = {}) {
  return findJetSkiConflicts(state, options).reduce((sum, booking) => (
    sum + craftJetSkiCount(String(booking.craftKey || booking.craft || ''))
  ), 0);
}

function hasInventoryConflict(state, options = {}) {
  const craft = String(options.craft || '').trim();
  const requiresBoat = craftUsesBoat(craft);
  const requestedJetSkis = craftJetSkiCount(craft);
  if (!requiresBoat && !requestedJetSkis) return false;
  if (requiresBoat && findBoatConflicts(state, options).length) return true;
  if (requestedJetSkis > 0) {
    return (jetSkiUnitsBooked(state, options) + requestedJetSkis) > TOTAL_PUBLIC_JET_SKIS;
  }
  return false;
}

function blockedStartTimesForCraft(state, options = {}) {
  const requestedDate = String(options.date || '').trim();
  const requestedDuration = Number(options.duration || 0);
  const requestedCraft = String(options.craft || '').trim();
  if (!requestedDate || !requestedDuration) return [];

  return PUBLIC_BOOKING_START_TIMES.filter((time) => (
    hasInventoryConflict(state, {
      ...options,
      craft: requestedCraft,
      date: requestedDate,
      time,
      duration: requestedDuration
    })
  ));
}

function assertPublicAvailability(state, options = {}) {
  const availabilityType = craftAvailabilityType(options.craft);
  if (availabilityType === 'none') return;
  if (hasInventoryConflict(state, options)) {
    if (availabilityType === 'boat') {
      throw new Error('That boat time is already booked. Please choose a different start time.');
    }
    throw new Error('That rental time is no longer available. Please choose a different start time.');
  }
}

function nextId(items = []) {
  return items.reduce((max, item) => Math.max(max, Number(item?.id || 0)), 0) + 1;
}

function createPublicToken() {
  return crypto.randomBytes(18).toString('base64url');
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
    dateOfBirth: String(customer.dateOfBirth || customer.waiver?.dateOfBirth || ''),
    waiverInitials: String(customer.waiverInitials || customer.waiver?.initials || ''),
    waiverVerified: Boolean(customer.waiverVerified || customer.waiver?.verified),
    emergencyName: String(customer.emergencyName || customer.waiver?.emergencyName || ''),
    emergencyPhone: String(customer.emergencyPhone || customer.waiver?.emergencyPhone || '')
  };
}

function applyWaiverToCustomer(customer, waiver = {}, fallbackDate = '', now = new Date().toISOString()) {
  customer.dateOfBirth = String(waiver.dateOfBirth || customer.dateOfBirth || '').trim();
  customer.waiverSignedAt = String(waiver.signatureDate || fallbackDate || customer.waiverSignedAt || now.split('T')[0]).trim();
  customer.waiverSignature = String(waiver.signature || customer.waiverSignature || '').trim();
  customer.waiverInitials = String(waiver.initials || customer.waiverInitials || '').trim();
  customer.waiverVerified = Boolean(waiver.verified || customer.waiverVerified);
  customer.emergencyName = String(waiver.emergencyName || customer.emergencyName || '').trim();
  customer.emergencyPhone = String(waiver.emergencyPhone || customer.emergencyPhone || '').trim();
  customer.waiver = {
    acceptedRisk: Boolean(waiver.acceptedRisk),
    acceptedDamage: Boolean(waiver.acceptedDamage),
    signature: customer.waiverSignature,
    signedAt: customer.waiverSignedAt,
    dateOfBirth: customer.dateOfBirth,
    initials: customer.waiverInitials,
    verified: customer.waiverVerified,
    emergencyName: customer.emergencyName,
    emergencyPhone: customer.emergencyPhone
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

function findBookingByPublicToken(state, token = '') {
  const normalized = String(token || '').trim();
  if (!normalized) return null;
  return state.bookings.find((booking) => String(booking.publicToken || '').trim() === normalized) || null;
}

function ensureBookingPublicToken(booking) {
  if (!booking.publicToken) booking.publicToken = createPublicToken();
  return booking.publicToken;
}

function invoiceMatchesCustomer(customer = {}, invoice = {}) {
  const customerPhone = phoneDigits(customer.phone);
  const invoicePhone = phoneDigits(invoice.customerPhone);
  if (customerPhone && invoicePhone && customerPhone === invoicePhone) return true;
  const customerEmail = normalizeEmail(customer.email);
  const invoiceEmail = normalizeEmail(invoice.customerEmail);
  if (customerEmail && invoiceEmail && customerEmail === invoiceEmail) return true;
  const customerName = normalizeName(customer.name);
  const invoiceName = normalizeName(invoice.customerName);
  return Boolean(customerName && invoiceName && customerName === invoiceName);
}

function normalizeInvoiceStatus(status = '') {
  return String(status || '').trim().toLowerCase();
}

function updateCustomerRollup(state, customer) {
  const phoneKey = phoneDigits(customer.phone);
  const emailKey = normalizeEmail(customer.email);
  const relatedBookings = state.bookings.filter((booking) => (
    (phoneKey && phoneDigits(booking.phone) === phoneKey) ||
    (emailKey && normalizeEmail(booking.email) === emailKey)
  ));
  const paidInvoiceTotal = (state.invoices || [])
    .filter((invoice) => invoiceMatchesCustomer(customer, invoice))
    .filter((invoice) => normalizeInvoiceStatus(invoice.status) === 'paid')
    .reduce((sum, invoice) => sum + Number(invoice.paidAmount || invoice.total || 0), 0);
  customer.bookings = relatedBookings.length;
  customer.totalSpent = Math.max(
    relatedBookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0),
    paidInvoiceTotal,
    Number(customer.totalSpent || 0)
  );
  customer.lastBooking = relatedBookings.reduce((latest, booking) => latestDateValue(latest, booking.date), customer.lastBooking || '');
  if (customer.bookings > 1 && customer.tag !== 'vip') customer.tag = 'repeat';
}

function publicCustomerPayload(customer) {
  return sanitizePublicCustomer(customer);
}

function publicBookingPayload(booking = {}) {
  return {
    id: Number(booking.id || 0),
    publicToken: String(booking.publicToken || ''),
    name: String(booking.name || '').trim(),
    phone: String(booking.phone || '').trim(),
    email: String(booking.email || '').trim(),
    craft: String(booking.craft || '').trim(),
    craftKey: String(booking.craftKey || '').trim(),
    craftLabel: String(booking.craftLabel || '').trim(),
    duration: Number(booking.duration || 0),
    durationLabel: String(booking.durationLabel || '').trim(),
    total: Number(booking.total || 0),
    baseTotal: Number(booking.baseTotal || 0),
    drone: Boolean(booking.drone),
    droneAmount: Number(booking.droneAmount || 0),
    date: String(booking.date || '').trim(),
    time: String(booking.time || '').trim(),
    location: String(booking.location || '').trim(),
    contactMethod: String(booking.contactMethod || 'text').trim(),
    partySize: String(booking.partySize || '').trim(),
    notes: String(booking.notes || '').trim(),
    status: String(booking.status || 'pending').trim(),
    source: String(booking.source || '').trim(),
    customerId: Number(booking.customerId || 0),
    waiverAccepted: Boolean(booking.waiverAccepted),
    waiver: booking.waiver && typeof booking.waiver === 'object'
      ? {
          acceptedRisk: Boolean(booking.waiver.acceptedRisk),
          acceptedDamage: Boolean(booking.waiver.acceptedDamage),
          verified: Boolean(booking.waiver.verified),
          dateOfBirth: String(booking.waiver.dateOfBirth || '').trim(),
          initials: String(booking.waiver.initials || '').trim(),
          signature: String(booking.waiver.signature || '').trim(),
          signatureDate: String(booking.waiver.signedAt || booking.waiver.signatureDate || '').trim(),
          emergencyName: String(booking.waiver.emergencyName || '').trim(),
          emergencyPhone: String(booking.waiver.emergencyPhone || '').trim()
        }
      : null,
    ...bookingPaymentSummary(booking)
  };
}

function publicCraftKey(type = '', craft = '') {
  const normalizedCraft = normalizeCraftKey(craft);
  if (normalizedCraft) return normalizedCraft;
  if (type === 'boat') return 'boat';
  if (type === 'bundle') return 'bundle2';
  return 'jetski2';
}

function stripTrailingSlash(value = '') {
  return String(value || '').replace(/\/+$/, '');
}

function isSafeHttpOrigin(value = '') {
  return /^https?:\/\/[^/]+$/i.test(stripTrailingSlash(value));
}

function deriveSiteOrigin(request, override = '') {
  const preferred = stripTrailingSlash(override);
  if (isSafeHttpOrigin(preferred)) return preferred;

  const origin = stripTrailingSlash(request?.headers?.origin || '');
  if (isSafeHttpOrigin(origin) && !/shoreline-aquatics-ops/i.test(origin)) {
    return origin;
  }

  return PUBLIC_SITE_URL;
}

function stripeConfigured() {
  return Boolean(stripe && STRIPE_SECRET_KEY);
}

function stripeWebhookConfigured() {
  return Boolean(stripeConfigured() && STRIPE_WEBHOOK_SECRET);
}

function bookingPaymentSummary(booking = {}) {
  const depositAmount = Number(booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100);
  const processingFeeAmount = Number(booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100);
  return {
    depositAmount,
    processingFeeAmount,
    amountDueToday: Number(booking.amountDueToday || (depositAmount + processingFeeAmount)),
    paymentStatus: String(booking.paymentStatus || (booking.deposit ? 'paid' : 'unpaid')),
    paymentSessionId: String(booking.paymentSessionId || ''),
    paymentCompletedAt: String(booking.paymentCompletedAt || ''),
    paymentIntentId: String(booking.paymentIntentId || '')
  };
}

function bookingEmailLocation(booking = {}) {
  return String(booking.location || `${SHORELINE_LOCATION_NAME} - ${SHORELINE_ADDRESS}`).trim();
}

function bookingRemainingBalance(booking = {}) {
  return Math.max(Number(booking.total || 0) - Number(booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100), 0);
}

function bookingConfirmationText(booking = {}) {
  const arrivalLines = ARRIVAL_INSTRUCTIONS.map((line, index) => `${index + 1}. ${line}`).join('\n');
  const safetyLines = SAFETY_BRIEFING_POINTS.map((line, index) => `${index + 1}. ${line}`).join('\n');
  const remainingBalance = bookingRemainingBalance(booking);
  return [
    `Hi ${firstName(booking.name)},`,
    '',
    `Your Shoreline Aquatics booking payment is confirmed and your rental date is reserved.`,
    '',
    'Booking details',
    `Package: ${booking.craftLabel || 'Rental package'}`,
    `Duration: ${booking.durationLabel || '-'}`,
    `Date: ${formatDateLabel(booking.date)}`,
    `Start time: ${formatTimeLabel(booking.time)}`,
    `Meeting spot: ${bookingEmailLocation(booking)}`,
    `Party size: ${booking.partySize || 'Not provided'}`,
    `Aerial drone coverage: ${booking.drone ? 'Included' : 'Not included'}`,
    `Quoted total: ${formatCurrency(booking.total || 0)}`,
    `Deposit received: ${formatCurrency(booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100)}`,
    `Processing fee: ${formatCurrency(booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100)}`,
    `Paid today: ${formatCurrency(booking.amountDueToday || ((booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100) + (booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100)))}`,
    `Remaining balance: ${formatCurrency(remainingBalance)}`,
    '',
    'Launch notes',
    '- Arrive about 15 minutes early so Shoreline can finish the walkthrough and get everyone fitted with life jackets.',
    '- Shoreline provides life jackets, fuel, cooler space, and the safety briefing before launch.',
    '- The remaining balance is handled directly with Shoreline before you head out on the water.',
    '',
    'Quick safety briefing',
    safetyLines,
    '',
    'Arrival instructions',
    arrivalLines,
    '',
    `Address: ${SHORELINE_ADDRESS}`,
    `Call or text Shoreline: ${SHORELINE_PHONE_DISPLAY}`,
    '',
    'If anything changes with your party size or timing, reply to this email or call/text Shoreline before your rental window.',
    '',
    'See you on the water,',
    'Shoreline Aquatics'
  ].join('\n');
}

function bookingConfirmationHtml(booking = {}) {
  const remainingBalance = bookingRemainingBalance(booking);
  const arrivalList = ARRIVAL_INSTRUCTIONS.map((line) => `<li>${htmlEscape(line)}</li>`).join('');
  const safetyList = SAFETY_BRIEFING_POINTS.map((line) => `<li>${htmlEscape(line)}</li>`).join('');
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10213a;max-width:680px;margin:0 auto;padding:24px;background:#f5f8fc;">
      <div style="background:#08111f;color:#ffffff;padding:24px;border-radius:20px 20px 0 0;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#f0b54a;font-weight:700;">Shoreline Aquatics</div>
        <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;">Your booking payment is confirmed</h1>
        <p style="margin:12px 0 0;color:#d8e1ee;">${htmlEscape(firstName(booking.name))}, your rental date is locked in and Shoreline has everything needed for launch day.</p>
      </div>
      <div style="background:#ffffff;padding:24px;border-radius:0 0 20px 20px;box-shadow:0 18px 48px rgba(8,17,31,0.08);">
        <h2 style="margin:0 0 12px;font-size:18px;">Booking details</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#5a6b85;">Package</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.craftLabel || 'Rental package')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Duration</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.durationLabel || '-')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Date</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatDateLabel(booking.date))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Start time</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatTimeLabel(booking.time))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Meeting spot</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(bookingEmailLocation(booking))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Party size</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.partySize || 'Not provided')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Drone coverage</td><td style="padding:8px 0;text-align:right;font-weight:700;">${booking.drone ? 'Included' : 'Not included'}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Quoted total</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatCurrency(booking.total || 0))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Deposit received</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#0f8b53;">${htmlEscape(formatCurrency(booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Processing fee</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatCurrency(booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Paid today</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatCurrency(booking.amountDueToday || ((booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100) + (booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100))))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Remaining balance</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatCurrency(remainingBalance))}</td></tr>
        </table>

        <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f5f8fc;">
          <h2 style="margin:0 0 10px;font-size:18px;">Launch notes</h2>
          <ul style="margin:0;padding-left:18px;">
            <li>Arrive about 15 minutes early so Shoreline can finish the walkthrough and get everyone fitted with life jackets.</li>
            <li>Life jackets, fuel, cooler space, and the pre-launch safety briefing are included.</li>
            <li>The remaining balance is handled directly with Shoreline before you head out on the water.</li>
          </ul>
        </div>

        <div style="margin-top:18px;padding:18px;border-radius:18px;background:#f5f8fc;">
          <h2 style="margin:0 0 10px;font-size:18px;">Quick safety briefing</h2>
          <ul style="margin:0;padding-left:18px;">
            ${safetyList}
          </ul>
        </div>

        <div style="margin-top:24px;">
          <h2 style="margin:0 0 10px;font-size:18px;">Arrival instructions</h2>
          <ol style="margin:0;padding-left:20px;">
            ${arrivalList}
          </ol>
          <p style="margin:16px 0 0;"><strong>Address:</strong> ${htmlEscape(SHORELINE_ADDRESS)}<br><strong>Call or text:</strong> <a href="tel:${htmlEscape(SHORELINE_PHONE_LINK)}">${htmlEscape(SHORELINE_PHONE_DISPLAY)}</a></p>
        </div>

        <p style="margin:24px 0 0;color:#5a6b85;">If anything changes with your party size or timing, reply to this email or call/text Shoreline before your rental window.</p>
      </div>
    </div>
  `;
}

function bookingConfirmationSubject(booking = {}) {
  return `Booking confirmed for ${formatDateLabel(booking.date)} • Shoreline Aquatics`;
}

function bookingRequestSubject(booking = {}) {
  return `Booking request received for ${formatDateLabel(booking.date)} • Shoreline Aquatics`;
}

function bookingRequestText(booking = {}) {
  return [
    `Hi ${firstName(booking.name)},`,
    '',
    'We received your Shoreline Aquatics booking details.',
    '',
    'Request details',
    `Package: ${booking.craftLabel || 'Rental package'}`,
    `Duration: ${booking.durationLabel || '-'}`,
    `Date: ${formatDateLabel(booking.date)}`,
    `Start time: ${formatTimeLabel(booking.time)}`,
    `Meeting spot: ${bookingEmailLocation(booking)}`,
    `Party size: ${booking.partySize || 'Not provided'}`,
    `Quoted total: ${formatCurrency(booking.total || 0)}`,
    '',
    'What to expect',
    '- If you already completed checkout, Shoreline will follow up with your full confirmation by text or email.',
    '- If checkout was not completed yet, finish the deposit to lock in the reservation.',
    `- If anything needs to change, call or text Shoreline at ${SHORELINE_PHONE_DISPLAY}.`,
    '',
    'See you soon,',
    'Shoreline Aquatics'
  ].join('\n');
}

function bookingRequestHtml(booking = {}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10213a;max-width:680px;margin:0 auto;padding:24px;background:#f5f8fc;">
      <div style="background:#08111f;color:#ffffff;padding:24px;border-radius:20px 20px 0 0;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#f0b54a;font-weight:700;">Shoreline Aquatics</div>
        <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;">Your booking request is in</h1>
        <p style="margin:12px 0 0;color:#d8e1ee;">${htmlEscape(firstName(booking.name))}, Shoreline received your rental details for ${htmlEscape(formatDateLabel(booking.date))} at ${htmlEscape(formatTimeLabel(booking.time))}.</p>
      </div>
      <div style="background:#ffffff;padding:24px;border-radius:0 0 20px 20px;box-shadow:0 18px 48px rgba(8,17,31,0.08);">
        <h2 style="margin:0 0 12px;font-size:18px;">Request details</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#5a6b85;">Package</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.craftLabel || 'Rental package')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Duration</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.durationLabel || '-')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Date</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatDateLabel(booking.date))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Start time</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatTimeLabel(booking.time))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Meeting spot</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(bookingEmailLocation(booking))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Party size</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.partySize || 'Not provided')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Quoted total</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatCurrency(booking.total || 0))}</td></tr>
        </table>
        <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f5f8fc;">
          <h2 style="margin:0 0 10px;font-size:18px;">What to expect</h2>
          <ul style="margin:0;padding-left:18px;">
            <li>If checkout is already complete, Shoreline will follow up with the full confirmation by text or email.</li>
            <li>If checkout was not completed yet, finish the deposit to lock in the reservation.</li>
            <li>If anything needs to change, call or text Shoreline at <a href="tel:${htmlEscape(SHORELINE_PHONE_LINK)}">${htmlEscape(SHORELINE_PHONE_DISPLAY)}</a>.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function ownerBookingAlertSubject(booking = {}) {
  return `New booking request • ${booking.name || booking.email || 'Customer'} • ${formatDateLabel(booking.date)}`;
}

function ownerBookingAlertText(booking = {}) {
  return [
    'A new Shoreline booking request was submitted.',
    '',
    `Name: ${booking.name || 'Unknown'}`,
    `Email: ${booking.email || 'Not provided'}`,
    `Phone: ${booking.phone || 'Not provided'}`,
    `Package: ${booking.craftLabel || 'Rental package'}`,
    `Duration: ${booking.durationLabel || '-'}`,
    `Date: ${formatDateLabel(booking.date)}`,
    `Start time: ${formatTimeLabel(booking.time)}`,
    `Party size: ${booking.partySize || 'Not provided'}`,
    `Quoted total: ${formatCurrency(booking.total || 0)}`,
    `Amount due today: ${formatCurrency(booking.amountDueToday || ((booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100) + (booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100)))}`,
    `Payment status: ${booking.paymentStatus || 'unpaid'}`,
    `Booking status: ${booking.status || 'pending'}`,
    `Meeting spot: ${bookingEmailLocation(booking)}`,
    `Notes: ${booking.notes || 'None'}`,
    '',
    'Open the Shoreline ops CRM to review or update the booking.'
  ].join('\n');
}

function ownerBookingAlertHtml(booking = {}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10213a;max-width:680px;margin:0 auto;padding:24px;background:#f5f8fc;">
      <div style="background:#08111f;color:#ffffff;padding:24px;border-radius:20px 20px 0 0;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#f0b54a;font-weight:700;">Shoreline Aquatics</div>
        <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;">New booking request</h1>
        <p style="margin:12px 0 0;color:#d8e1ee;">${htmlEscape(booking.name || booking.email || 'A customer')} submitted a new booking request.</p>
      </div>
      <div style="background:#ffffff;padding:24px;border-radius:0 0 20px 20px;box-shadow:0 18px 48px rgba(8,17,31,0.08);">
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#5a6b85;">Name</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.name || 'Unknown')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Email</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.email || 'Not provided')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Phone</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.phone || 'Not provided')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Package</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.craftLabel || 'Rental package')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Duration</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.durationLabel || '-')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Date</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatDateLabel(booking.date))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Start time</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatTimeLabel(booking.time))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Party size</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.partySize || 'Not provided')}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Quoted total</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatCurrency(booking.total || 0))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Amount due today</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(formatCurrency(booking.amountDueToday || ((booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100) + (booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100))))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Payment status</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(String(booking.paymentStatus || 'unpaid'))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Booking status</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(String(booking.status || 'pending'))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Meeting spot</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(bookingEmailLocation(booking))}</td></tr>
          <tr><td style="padding:8px 0;color:#5a6b85;">Notes</td><td style="padding:8px 0;text-align:right;font-weight:700;">${htmlEscape(booking.notes || 'None')}</td></tr>
        </table>
      </div>
    </div>
  `;
}

async function sendBookingRequestCustomerEmail(state, booking, now = new Date().toISOString()) {
  if (!SEND_BOOKING_REQUEST_CUSTOMER_EMAILS) {
    return { sent: false, reason: 'disabled' };
  }
  if (!booking || booking.requestConfirmationEmailSentAt) {
    return { sent: false, reason: 'already-sent-or-missing-booking' };
  }
  if (!booking.email) {
    return { sent: false, reason: 'missing-recipient' };
  }
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return { sent: false, reason: 'email-not-configured' };
  }
  const result = await sendResendEmail({
    to: booking.email,
    subject: bookingRequestSubject(booking),
    text: bookingRequestText(booking),
    html: bookingRequestHtml(booking),
    idempotencyKey: `shoreline-booking-request-customer-${booking.id}`
  });
  booking.requestConfirmationEmailSentAt = now;
  booking.requestConfirmationEmailId = String(result?.id || '');
  booking.updatedAt = now;
  state.communicationsLog.unshift({
    id: nextId(state.communicationsLog),
    date: now,
    customerId: booking.customerId || 0,
    customerName: booking.name || booking.email,
    channel: 'booking-request-email',
    message: `Booking request confirmation sent to ${booking.email} for ${booking.craftLabel} on ${booking.date} at ${booking.time}.`
  });
  return { sent: true, result };
}

async function sendNewBookingOwnerAlert(state, booking, now = new Date().toISOString()) {
  if (!booking || booking.ownerAlertEmailSentAt) {
    return { sent: false, reason: 'already-sent-or-missing-booking' };
  }
  const recipients = normalizeEmailList(BOOKING_ALERT_EMAILS);
  if (!recipients.length) {
    return { sent: false, reason: 'missing-recipient' };
  }
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return { sent: false, reason: 'email-not-configured' };
  }
  const result = await sendResendEmail({
    to: recipients,
    subject: ownerBookingAlertSubject(booking),
    text: ownerBookingAlertText(booking),
    html: ownerBookingAlertHtml(booking),
    idempotencyKey: `shoreline-booking-alert-owner-${booking.id}`
  });
  booking.ownerAlertEmailSentAt = now;
  booking.ownerAlertEmailId = String(result?.id || '');
  booking.updatedAt = now;
  state.communicationsLog.unshift({
    id: nextId(state.communicationsLog),
    date: now,
    customerId: booking.customerId || 0,
    customerName: booking.name || booking.email,
    channel: 'new-booking-owner-alert',
    message: `New booking alert sent to ${recipients.join(', ')} for ${booking.name || booking.email}.`
  });
  return { sent: true, result };
}

function upsertDraftBookingFromPayload(state, payload = {}, now = new Date().toISOString()) {
  if (!payload?.date || !payload?.time) {
    throw new Error('A rental date and start time are required.');
  }

  const existingBooking = findBookingByPublicToken(state, payload.publicToken);
  const pricing = priceForSelection(payload.craft, payload.duration, payload.drone);
  assertPublicAvailability(state, {
    craft: pricing.craft,
    date: payload.date,
    time: payload.time,
    duration: pricing.duration,
    publicToken: existingBooking?.publicToken || payload.publicToken,
    bookingId: existingBooking?.id
  });
  const booking = existingBooking || {
    id: nextId(state.bookings),
    status: 'draft',
    deposit: false,
    paymentStatus: 'unpaid',
    createdAt: now,
    source: 'Website Draft'
  };

  booking.name = String(payload.name || booking.name || '').trim();
  booking.phone = String(payload.phone || booking.phone || '').trim();
  booking.email = String(payload.email || booking.email || '').trim();
  booking.craft = publicCraftKey(pricing.type, pricing.craft);
  booking.craftKey = pricing.craft;
  booking.craftLabel = pricing.craftLabel;
  booking.duration = pricing.duration;
  booking.durationLabel = pricing.durationLabel;
  booking.total = Number((pricing.totalAmount / 100).toFixed(2));
  booking.baseTotal = Number((pricing.baseAmount / 100).toFixed(2));
  booking.drone = pricing.drone;
  booking.droneAmount = Number((pricing.droneAmount / 100).toFixed(2));
  booking.depositAmount = Number((pricing.bookingDepositAmount / 100).toFixed(2));
  booking.processingFeeAmount = Number((PROCESSING_FEE_CENTS / 100).toFixed(2));
  booking.amountDueToday = Number(((pricing.bookingDepositAmount + PROCESSING_FEE_CENTS) / 100).toFixed(2));
  booking.date = String(payload.date || '').trim();
  booking.time = String(payload.time || '').trim();
  booking.location = String(payload.location || booking.location || 'Shoreline Aquatics launch - 2000 Main St, Hickory Creek, TX').trim();
  booking.contactMethod = String(payload.contactMethod || booking.contactMethod || 'text').trim();
  booking.partySize = String(payload.partySize || booking.partySize || '').trim();
  booking.notes = String(payload.notes || booking.notes || '').trim();
  booking.updatedAt = now;
  ensureBookingPublicToken(booking);

  if (!existingBooking) {
    state.bookings.push(booking);
  }

  return { state, booking, existingBooking, pricing };
}

function upsertBookingFromPayload(state, payload = {}, now = new Date().toISOString()) {
  if (!payload?.name || !payload?.phone || !payload?.date || !payload?.time) {
    throw new Error('Customer name, phone number, requested date, and start time are required.');
  }
  if (!isTruthyWaiver(payload.waiver)) {
    throw new Error('A completed waiver is required before saving this booking request.');
  }

  const pricing = priceForSelection(payload.craft, payload.duration, payload.drone);
  const tokenBooking = findBookingByPublicToken(state, payload.publicToken);
  const matchedBooking = findMatchingBooking(state, {
    ...payload,
    craftLabel: pricing.craftLabel,
    duration: pricing.duration
  });
  const existingBooking = tokenBooking || matchedBooking;
  assertPublicAvailability(state, {
    craft: pricing.craft,
    date: payload.date,
    time: payload.time,
    duration: pricing.duration,
    publicToken: existingBooking?.publicToken || payload.publicToken,
    bookingId: existingBooking?.id
  });
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
  applyWaiverToCustomer(customer, payload.waiver, payload.date, now);

  if (!existingCustomer) {
    state.customers.push(customer);
  }

  const booking = existingBooking || {
    id: nextId(state.bookings),
    status: 'pending',
    deposit: false
  };
  const existingStatus = String(booking.status || '').trim().toLowerCase();

  booking.name = customer.name;
  booking.phone = customer.phone;
  booking.email = customer.email;
  booking.craft = publicCraftKey(pricing.type, pricing.craft);
  booking.craftKey = pricing.craft;
  booking.craftLabel = pricing.craftLabel;
  booking.duration = pricing.duration;
  booking.durationLabel = pricing.durationLabel;
  booking.total = Number((pricing.totalAmount / 100).toFixed(2));
  booking.baseTotal = Number((pricing.baseAmount / 100).toFixed(2));
  booking.drone = pricing.drone;
  booking.droneAmount = Number((pricing.droneAmount / 100).toFixed(2));
  booking.depositAmount = Number((pricing.bookingDepositAmount / 100).toFixed(2));
  booking.processingFeeAmount = Number((PROCESSING_FEE_CENTS / 100).toFixed(2));
  booking.amountDueToday = Number(((pricing.bookingDepositAmount + PROCESSING_FEE_CENTS) / 100).toFixed(2));
  booking.date = String(payload.date || '').trim();
  booking.time = String(payload.time || '').trim();
  booking.location = String(payload.location || '').trim();
  booking.contactMethod = String(payload.contactMethod || 'text').trim();
  booking.partySize = String(payload.partySize || '').trim();
  booking.notes = String(payload.notes || '').trim();
  booking.customerId = customer.id;
  booking.source = 'Website Booking';
  booking.status = ['confirmed', 'completed'].includes(existingStatus) ? booking.status : 'pending';
  booking.updatedAt = now;
  booking.waiverSignedAt = customer.waiverSignedAt;
  booking.waiverSignature = customer.waiverSignature;
  booking.emergencyName = customer.emergencyName;
  booking.emergencyPhone = customer.emergencyPhone;
  booking.waiverAccepted = true;
  booking.paymentStatus = booking.deposit ? 'paid' : String(booking.paymentStatus || 'unpaid');
  booking.waiver = {
    ...(customer.waiver || {}),
    signatureDate: customer.waiverSignedAt
  };
  ensureBookingPublicToken(booking);

  if (!existingBooking) {
    booking.createdAt = now;
    state.bookings.push(booking);
  }

  updateCustomerRollup(state, customer);
  return { state, customer, booking, existingCustomer, existingBooking, pricing };
}

function upsertWaiverOnlyFromPayload(state, payload = {}, now = new Date().toISOString()) {
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const phone = String(payload.phone || '').trim();
  const email = String(payload.email || '').trim();
  const signature = String(payload.signature || '').trim();
  const dateOfBirth = String(payload.dateOfBirth || '').trim();
  const initials = String(payload.initials || '').trim();

  if (!firstName || !lastName || !phone || !email || !dateOfBirth || !signature || !initials) {
    throw new Error('First name, last name, phone, email, date of birth, initials, and signature are required.');
  }
  if (!payload.acceptedAgreement || !payload.verified) {
    throw new Error('Agreement and verification are both required.');
  }

  const existingCustomer = findMatchingCustomer(state, { phone, email });
  const customer = existingCustomer || {
    id: nextId(state.customers),
    name: `${firstName} ${lastName}`.trim(),
    phone,
    email,
    bookings: 0,
    totalSpent: 0,
    lastBooking: '',
    source: 'Website Waiver',
    tag: '',
    company: '',
    crmTags: '',
    crmNotes: '',
    createdAt: now.split('T')[0],
    lastActivity: now,
    importSource: 'website'
  };

  customer.name = `${firstName} ${lastName}`.trim();
  customer.phone = phone;
  customer.email = email;
  customer.lastActivity = now;
  customer.source = customer.source || 'Website Waiver';
  customer.importSource = customer.importSource || 'website';
  applyWaiverToCustomer(customer, {
    acceptedRisk: true,
    acceptedDamage: true,
    dateOfBirth,
    initials,
    verified: true,
    signature,
    signatureDate: String(payload.signatureDate || now.split('T')[0]).trim()
  }, String(payload.signatureDate || now.split('T')[0]).trim(), now);

  if (!existingCustomer) {
    state.customers.push(customer);
  }

  updateCustomerRollup(state, customer);
  return { state, customer, existingCustomer };
}

function findBookingForStripeSession(state, session = {}) {
  const bookingId = Number(session?.metadata?.bookingId || session?.client_reference_id || 0);
  if (bookingId) {
    const byId = state.bookings.find((booking) => Number(booking.id || 0) === bookingId);
    if (byId) return byId;
  }
  const sessionId = String(session?.id || '');
  if (sessionId) {
    const bySession = state.bookings.find((booking) => String(booking.paymentSessionId || '') === sessionId);
    if (bySession) return bySession;
  }
  return null;
}

function applyStripeSessionToBooking(state, session = {}, now = new Date().toISOString()) {
  const booking = findBookingForStripeSession(state, session);
  if (!booking) return null;

  if (session?.metadata?.bookingToken && !booking.publicToken) {
    booking.publicToken = String(session.metadata.bookingToken);
  }
  booking.paymentSessionId = String(session.id || booking.paymentSessionId || '');
  booking.paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : String(booking.paymentIntentId || '');
  booking.depositAmount = Number((booking.depositAmount || BOOKING_DEPOSIT_CENTS / 100).toFixed(2));
  booking.processingFeeAmount = Number((session?.metadata?.processingFeeAmount || booking.processingFeeAmount || PROCESSING_FEE_CENTS / 100));
  booking.amountDueToday = Number(((session.amount_total || ((BOOKING_DEPOSIT_CENTS + PROCESSING_FEE_CENTS))) / 100).toFixed(2));
  booking.paymentStatus = String(session.payment_status || booking.paymentStatus || 'pending');
  booking.deposit = booking.paymentStatus === 'paid';
  booking.paymentCompletedAt = booking.deposit ? now : String(booking.paymentCompletedAt || '');
  booking.updatedAt = now;
  return booking;
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
    bookingAlertsConfigured: Boolean(normalizeEmailList(BOOKING_ALERT_EMAILS).length),
    reviewLinksConfigured: Boolean(GOOGLE_REVIEW_URL || FACEBOOK_REVIEW_URL),
    reviewAutomationEnabled: AUTO_SEND_REVIEW_REQUESTS,
    reviewChannel: REVIEW_REQUEST_CHANNEL,
    stripeConfigured: stripeConfigured(),
    stripeWebhookConfigured: stripeWebhookConfigured(),
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

async function sendResendEmail({ to, subject, text, html, bcc = [], idempotencyKey = '' }) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error('Resend email is not configured yet.');
  }
  const recipients = Array.isArray(to) ? to.map(normalizeEmail).filter(Boolean) : [normalizeEmail(to)].filter(Boolean);
  const bccRecipients = Array.isArray(bcc) ? bcc.map(normalizeEmail).filter(Boolean) : [normalizeEmail(bcc)].filter(Boolean);
  const replyTo = resendReplyToAddress();
  if (!recipients.length) {
    throw new Error('At least one valid recipient email is required.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
    },
    body: JSON.stringify({
      from: formattedResendFromAddress(),
      reply_to: replyTo || undefined,
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

async function sendBookingConfirmationEmail(state, booking, session = {}, now = new Date().toISOString()) {
  if (!booking || booking.paymentStatus !== 'paid' || !booking.deposit) {
    return { sent: false, reason: 'booking-not-paid' };
  }
  if (booking.confirmationEmailSentAt) {
    return { sent: false, reason: 'already-sent' };
  }
  if (!booking.email) {
    return { sent: false, reason: 'missing-recipient' };
  }
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return { sent: false, reason: 'email-not-configured' };
  }

  const subject = bookingConfirmationSubject(booking);
  const text = bookingConfirmationText(booking);
  const html = bookingConfirmationHtml(booking);
  const idempotencyKey = `shoreline-booking-confirmation-${booking.id}-${session?.id || booking.paymentSessionId || 'paid'}`;
  const result = await sendResendEmail({
    to: booking.email,
    subject,
    text,
    html,
    idempotencyKey
  });

  booking.confirmationEmailSentAt = now;
  booking.confirmationEmailId = String(result?.id || '');
  booking.updatedAt = now;
  state.communicationsLog.unshift({
    id: nextId(state.communicationsLog),
    date: now,
    customerId: booking.customerId || 0,
    customerName: booking.name || booking.email,
    channel: 'booking-confirmation-email',
    message: `Paid booking confirmation sent to ${booking.email} for ${booking.craftLabel} on ${booking.date} at ${booking.time}.`
  });
  return { sent: true, result };
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
    const session = getSession(request);
    sendJson(response, 200, {
      authenticated: Boolean(session),
      storage: stateStore.kind,
      user: sessionUserPayload(session)
    });
    return true;
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    try {
      const body = JSON.parse(await readRequestBody(request) || '{}');
      const username = String(body.username || '');
      const password = String(body.password || '');
      const user = findOpsUser(username, password);
      if (!user) {
        sendJson(response, 401, { error: 'Incorrect username or password.' });
        return true;
      }
      setSessionCookie(response, user);
      sendJson(response, 200, {
        ok: true,
        user: {
          username: user.username,
          role: user.role,
          displayName: user.displayName,
          permissions: authPermissionsForRole(user.role)
        }
      });
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

  if (pathname === '/api/public/integrations/status' && request.method === 'GET') {
    sendPublicJson(response, request, 200, {
      ok: true,
      integrations: integrationStatus()
    });
    return true;
  }

  if (pathname === '/api/public/booking' && request.method === 'GET') {
    const token = String(requestUrl.searchParams.get('token') || '').trim();
    if (!token) {
      sendPublicJson(response, request, 400, { error: 'A booking token is required.' });
      return true;
    }

    const state = await stateStore.read();
    const booking = findBookingByPublicToken(state, token);
    if (!booking) {
      sendPublicJson(response, request, 404, { error: 'Booking not found.' });
      return true;
    }

    sendPublicJson(response, request, 200, {
      ok: true,
      booking: publicBookingPayload(booking)
    });
    return true;
  }

  if (pathname === '/api/public/availability' && request.method === 'GET') {
    const date = String(requestUrl.searchParams.get('date') || '').trim();
    const craft = normalizeCraftKey(requestUrl.searchParams.get('craft') || '');
    const duration = Number(requestUrl.searchParams.get('duration') || 0);
    const publicToken = String(
      requestUrl.searchParams.get('booking') ||
      requestUrl.searchParams.get('token') ||
      ''
    ).trim();

    if (!date || !duration) {
      sendPublicJson(response, request, 400, {
        error: 'A rental date and duration are required to check availability.'
      });
      return true;
    }

    const availabilityType = craftAvailabilityType(craft);
    if (availabilityType === 'none') {
      sendPublicJson(response, request, 200, {
        ok: true,
        availabilityType,
        requiresAvailabilityCheck: false,
        blockedTimes: [],
        availableTimes: [...PUBLIC_BOOKING_START_TIMES],
        nextOpenTime: PUBLIC_BOOKING_START_TIMES[0] || ''
      });
      return true;
    }

    const state = await stateStore.read();
    const blockedTimes = blockedStartTimesForCraft(state, {
      date,
      duration,
      craft,
      publicToken
    });
    const availableTimes = PUBLIC_BOOKING_START_TIMES.filter((time) => !blockedTimes.includes(time));

    sendPublicJson(response, request, 200, {
      ok: true,
      availabilityType,
      requiresAvailabilityCheck: true,
      blockedTimes,
      availableTimes,
      nextOpenTime: availableTimes[0] || ''
    });
    return true;
  }

  if (pathname === '/api/public/booking-draft' && request.method === 'POST') {
    try {
      const payload = JSON.parse(await readRequestBody(request) || '{}');
      const state = await stateStore.read();
      const now = new Date().toISOString();
      const { booking } = upsertDraftBookingFromPayload(state, payload, now);
      await stateStore.write(state);

      sendPublicJson(response, request, 200, {
        ok: true,
        booking: publicBookingPayload(booking)
      });
      return true;
    } catch (error) {
      sendPublicJson(response, request, 400, {
        error: error.message || 'Could not save the booking draft.'
      });
      return true;
    }
  }

  if (pathname === '/api/public/booking-request' && request.method === 'POST') {
    try {
      const payload = JSON.parse(await readRequestBody(request) || '{}');
      const state = await stateStore.read();
      const now = new Date().toISOString();
      const { customer, booking, existingCustomer } = upsertBookingFromPayload(state, payload, now);
      await stateStore.write(state);

      let customerEmailStatus = { sent: false, reason: 'not-attempted' };
      let ownerAlertStatus = { sent: false, reason: 'not-attempted' };
      try {
        customerEmailStatus = await sendBookingRequestCustomerEmail(state, booking, now);
      } catch (error) {
        console.error('Booking request customer email failed:', error);
        customerEmailStatus = { sent: false, reason: error.message || 'send-failed' };
      }
      try {
        ownerAlertStatus = await sendNewBookingOwnerAlert(state, booking, now);
      } catch (error) {
        console.error('New booking owner alert failed:', error);
        ownerAlertStatus = { sent: false, reason: error.message || 'send-failed' };
      }
      if (customerEmailStatus.sent || ownerAlertStatus.sent) {
        await stateStore.write(state);
      }

      sendPublicJson(response, request, 200, {
        ok: true,
        bookingId: booking.id,
        bookingToken: booking.publicToken,
        matchedExistingCustomer: Boolean(existingCustomer),
        waiverStored: true,
        notifications: {
          customerEmail: customerEmailStatus,
          ownerAlert: ownerAlertStatus
        },
        customer: publicCustomerPayload(customer),
        booking: publicBookingPayload(booking)
      });
      return true;
    } catch (error) {
      sendPublicJson(response, request, 400, {
        error: error.message || 'Could not save the booking request.'
      });
      return true;
    }
  }

  if (pathname === '/api/public/waiver' && request.method === 'POST') {
    try {
      const payload = JSON.parse(await readRequestBody(request) || '{}');
      const state = await stateStore.read();
      const now = new Date().toISOString();
      const { customer, existingCustomer } = upsertWaiverOnlyFromPayload(state, payload, now);
      await stateStore.write(state);

      sendPublicJson(response, request, 200, {
        ok: true,
        matchedExistingCustomer: Boolean(existingCustomer),
        customer: publicCustomerPayload(customer)
      });
      return true;
    } catch (error) {
      sendPublicJson(response, request, 400, {
        error: error.message || 'Could not save the waiver.'
      });
      return true;
    }
  }

  if (pathname === '/api/public/create-checkout-session' && request.method === 'POST') {
    if (!stripeConfigured()) {
      sendPublicJson(response, request, 503, {
        error: 'Stripe is not configured yet for Shoreline checkout.'
      });
      return true;
    }

    try {
      const body = JSON.parse(await readRequestBody(request) || '{}');
      const payload = body?.booking || body || {};
      const siteOrigin = deriveSiteOrigin(request, body?.siteOrigin || payload?.siteOrigin || '');
      const state = await stateStore.read();
      const now = new Date().toISOString();
      const { booking, pricing } = upsertBookingFromPayload(state, payload, now);

      if (booking.deposit || booking.paymentStatus === 'paid') {
        await stateStore.write(state);
        sendPublicJson(response, request, 200, {
          ok: true,
          alreadyPaid: true,
          bookingId: booking.id,
          booking: {
            id: booking.id,
            craftLabel: booking.craftLabel,
            durationLabel: booking.durationLabel,
            total: booking.total,
            ...bookingPaymentSummary(booking)
          }
        });
        return true;
      }

      const descriptionParts = [
        `${booking.craftLabel}`,
        booking.durationLabel,
        booking.date,
        booking.time
      ].filter(Boolean);
      const description = descriptionParts.join(' · ');
      const bookingToken = ensureBookingPublicToken(booking);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${siteOrigin}/booking-thank-you/?session_id={CHECKOUT_SESSION_ID}&booking=${encodeURIComponent(bookingToken)}`,
        cancel_url: `${siteOrigin}/jetski-booking-confirmation/?payment=cancelled&booking=${encodeURIComponent(bookingToken)}`,
        customer_email: booking.email || undefined,
        billing_address_collection: 'auto',
        phone_number_collection: { enabled: true },
        invoice_creation: { enabled: true },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: BOOKING_DEPOSIT_CENTS,
              product_data: {
                name: 'Shoreline Aquatics Booking Deposit',
                description,
                metadata: {
                  craft: pricing.craft,
                  bookingId: String(booking.id)
                }
              }
            }
          },
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: PROCESSING_FEE_CENTS,
              product_data: {
                name: 'Processing Fee',
                description: 'Secure checkout and card processing fee',
                metadata: {
                  bookingId: String(booking.id)
                }
              }
            }
          }
        ],
        payment_intent_data: {
          metadata: {
            bookingId: String(booking.id),
            customerId: String(booking.customerId || ''),
            craft: pricing.craft,
            craftLabel: booking.craftLabel,
            duration: String(booking.duration),
            date: booking.date,
            time: booking.time
          }
        },
        metadata: {
          bookingId: String(booking.id),
          bookingToken,
          customerId: String(booking.customerId || ''),
          craft: pricing.craft,
          craftLabel: booking.craftLabel,
          duration: String(booking.duration),
          date: booking.date,
          time: booking.time,
          totalQuote: String(booking.total),
          depositAmount: String((BOOKING_DEPOSIT_CENTS / 100).toFixed(2)),
          processingFeeAmount: String((PROCESSING_FEE_CENTS / 100).toFixed(2)),
          amountDueToday: String(((BOOKING_DEPOSIT_CENTS + PROCESSING_FEE_CENTS) / 100).toFixed(2))
        },
        client_reference_id: String(booking.id),
        custom_text: {
          submit: {
            message: 'Today you are paying the $50 booking deposit plus a $5 processing fee. The remaining rental balance is handled with Shoreline before launch.'
          }
        }
      });

      booking.paymentStatus = 'pending';
      booking.paymentSessionId = String(session.id || '');
      booking.depositAmount = Number((BOOKING_DEPOSIT_CENTS / 100).toFixed(2));
      booking.processingFeeAmount = Number((PROCESSING_FEE_CENTS / 100).toFixed(2));
      booking.amountDueToday = Number(((BOOKING_DEPOSIT_CENTS + PROCESSING_FEE_CENTS) / 100).toFixed(2));
      booking.updatedAt = now;
      await stateStore.write(state);

      sendPublicJson(response, request, 200, {
        ok: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        bookingId: booking.id,
        bookingToken,
        amountDue: Number(((BOOKING_DEPOSIT_CENTS + PROCESSING_FEE_CENTS) / 100).toFixed(2))
      });
      return true;
    } catch (error) {
      console.error('Stripe checkout session failed:', error);
      sendPublicJson(response, request, 400, {
        error: error.message || 'Could not start Stripe checkout.'
      });
      return true;
    }
  }

  if (pathname === '/api/public/checkout-session' && request.method === 'GET') {
    if (!stripeConfigured()) {
      sendPublicJson(response, request, 503, {
        error: 'Stripe is not configured yet for Shoreline checkout.'
      });
      return true;
    }

    const sessionId = String(requestUrl.searchParams.get('session_id') || '').trim();
    if (!sessionId) {
      sendPublicJson(response, request, 400, { error: 'A Stripe session id is required.' });
      return true;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const state = await stateStore.read();
      const now = new Date().toISOString();
      const booking = applyStripeSessionToBooking(state, session, now);
      if (booking?.paymentStatus === 'paid' && booking.deposit) {
        try {
          await sendBookingConfirmationEmail(state, booking, session, now);
        } catch (error) {
          console.error('Booking confirmation email failed during checkout verification:', error);
        }
      }
      if (booking) {
        await stateStore.write(state);
      }

      sendPublicJson(response, request, 200, {
        ok: true,
        session: {
          id: session.id,
          status: session.status,
          paymentStatus: session.payment_status,
          amountTotal: Number(((session.amount_total || 0) / 100).toFixed(2)),
          customerEmail: session.customer_details?.email || session.customer_email || '',
          customerName: session.customer_details?.name || '',
          bookingId: session.metadata?.bookingId || session.client_reference_id || '',
          bookingToken: session.metadata?.bookingToken || ''
        },
        booking: booking ? publicBookingPayload(booking) : null
      });
      return true;
    } catch (error) {
      console.error('Stripe checkout session lookup failed:', error);
      sendPublicJson(response, request, 400, {
        error: error.message || 'Could not verify the Stripe checkout session.'
      });
      return true;
    }
  }

  if (pathname === '/api/webhooks/stripe' && request.method === 'POST') {
    if (!stripeWebhookConfigured()) {
      sendJson(response, 503, { error: 'Stripe webhook handling is not configured yet.' });
      return true;
    }

    try {
      const signature = request.headers['stripe-signature'];
      if (!signature) {
        throw new Error('Missing Stripe signature header.');
      }
      const rawBody = await readRequestBody(request);
      const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);

      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const state = await stateStore.read();
        const session = event.data.object;
        const booking = applyStripeSessionToBooking(state, session, new Date().toISOString());
        if (booking?.paymentStatus === 'paid' && booking.deposit) {
          await sendBookingConfirmationEmail(state, booking, session, new Date().toISOString());
        }
        if (booking) {
          await stateStore.write(state);
        }
      }

      if (event.type === 'checkout.session.expired') {
        const state = await stateStore.read();
        const session = event.data.object;
        const booking = findBookingForStripeSession(state, session);
        if (booking) {
          booking.paymentStatus = 'expired';
          booking.deposit = false;
          booking.updatedAt = new Date().toISOString();
          await stateStore.write(state);
        }
      }

      setCommonHeaders(response, { 'Content-Type': 'application/json; charset=utf-8' });
      response.writeHead(200);
      response.end(JSON.stringify({ received: true }));
      return true;
    } catch (error) {
      console.error('Stripe webhook error:', error);
      sendJson(response, 400, { error: error.message || 'Could not process Stripe webhook.' });
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
