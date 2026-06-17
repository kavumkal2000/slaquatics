// Pre-deploy static validation. Run: npm run check
// Exits non-zero on failure so it can gate a deploy.
import fs from 'node:fs';

let failures = 0;
const fail = (m) => { console.log('❌ ' + m); failures++; };
const ok = (m) => console.log('✅ ' + m);

// 1) JSON-LD must parse in the homepage + SEO landing pages (broken schema = lost rich results)
const ldFiles = [
  'index.html',
  'jet-ski-rental-denton/index.html',
  'jet-ski-rental-frisco/index.html',
  'jet-ski-rental-lewisville/index.html',
];
for (const f of ldFiles) {
  if (!fs.existsSync(f)) { fail(`${f}: missing`); continue; }
  const html = fs.readFileSync(f, 'utf8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) { fail(`${f}: no JSON-LD found`); continue; }
  let bad = false;
  for (const b of blocks) {
    try { JSON.parse(b[1]); } catch (e) { fail(`${f}: invalid JSON-LD — ${e.message}`); bad = true; }
  }
  if (!bad) ok(`${f}: JSON-LD valid (${blocks.length})`);
}

// 2) PRICING: every craft/duration shared by 2+ files must cost the same
//    (a mismatch means customers get quoted vs charged different prices). Extra
//    alias keys in one file (e.g. ops has yamaha/seadoo) are fine.
function parsePricing(file) {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/PRICING\s*=\s*\{([\s\S]*?)\n\s*\};/);
  if (!m) return null;
  const obj = {};
  for (const km of m[1].matchAll(/([a-z0-9]+)\s*:\s*\{([^}]*)\}/g)) {
    obj[km[1]] = {};
    for (const pm of km[2].matchAll(/(\d+)\s*:\s*(\d+)/g)) obj[km[1]][pm[1]] = Number(pm[2]);
  }
  return obj;
}
const priceFiles = ['index.html', 'jetski-booking/index.html', 'ops.html'];
const tables = priceFiles.map((f) => ({ file: f.split('/')[0], p: parsePricing(f) }));
if (tables.some((t) => !t.p)) {
  fail('PRICING table not found in one of: ' + priceFiles.join(', '));
} else {
  const mismatches = [];
  const crafts = new Set();
  tables.forEach((t) => Object.keys(t.p).forEach((k) => crafts.add(k)));
  for (const craft of crafts) {
    const durs = new Set();
    tables.forEach((t) => t.p[craft] && Object.keys(t.p[craft]).forEach((d) => durs.add(d)));
    for (const dur of durs) {
      const present = tables.filter((t) => t.p[craft] && t.p[craft][dur] !== undefined);
      if (present.length < 2) continue; // only compare prices shared by 2+ files
      if (new Set(present.map((t) => t.p[craft][dur])).size > 1) {
        mismatches.push(`${craft}[${dur}] — ` + present.map((t) => `${t.file}=${t.p[craft][dur]}`).join(', '));
      }
    }
  }
  if (mismatches.length) mismatches.forEach((m) => fail('PRICING mismatch: ' + m));
  else ok('PRICING consistent for all shared craft/duration prices');
}

// 3) SERVER-vs-SITE: the server (PRICING_CENTS, in cents) must charge exactly what
//    the booking flow (PRICING, in dollars) shows — no quote-vs-charge gap.
function parseCentsTable(file, varName) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(new RegExp(varName + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};'));
  if (!m) return null;
  const obj = {};
  for (const km of m[1].matchAll(/([a-z0-9]+)\s*:\s*\{([^}]*)\}/g)) {
    obj[km[1]] = {};
    for (const pm of km[2].matchAll(/(\d+)\s*:\s*(\d+)/g)) obj[km[1]][pm[1]] = Number(pm[2]);
  }
  return obj;
}
const serverCents = parseCentsTable('server.js', 'PRICING_CENTS');
const bookingDollars = parsePricing('jetski-booking/index.html');
if (!serverCents || !bookingDollars) {
  fail('Could not parse server PRICING_CENTS or booking PRICING for the server/site cross-check');
} else {
  const mism = [];
  for (const craft of Object.keys(bookingDollars)) {
    for (const dur of Object.keys(bookingDollars[craft])) {
      const cents = serverCents[craft] && serverCents[craft][dur];
      const expected = bookingDollars[craft][dur] * 100;
      if (cents === undefined) mism.push(`server missing ${craft}[${dur}]`);
      else if (cents !== expected) mism.push(`${craft}[${dur}] server=${cents}c vs site=$${bookingDollars[craft][dur]}`);
    }
  }
  if (mism.length) mism.forEach((m) => fail('SERVER/SITE charge mismatch: ' + m));
  else ok('Server charge matches the booking-flow price for every craft/duration');
}

// 4) Party boat must stay priced AND bookable (selectable in the booking flow).
const bookingSrc = fs.readFileSync('jetski-booking/index.html', 'utf8');
if (!bookingDollars || !bookingDollars.partyboat) fail('Party boat missing from the booking PRICING table');
else if (!/TYPE_TO_CRAFTS[\s\S]*?boat:\s*\[[^\]]*partyboat/.test(bookingSrc)) fail('Party boat is priced but not selectable (missing from TYPE_TO_CRAFTS)');
else ok('Party boat is priced and bookable');

// 5) Every add-on amount must be defined on the server (drone/karaoke/tube).
const serverSrc = fs.readFileSync('server.js', 'utf8');
const missingAddon = ['DRONE_ADDON_CENTS', 'KARAOKE_ADDON_CENTS', 'TUBE_ADDON_CENTS']
  .filter((name) => !new RegExp('const ' + name + '\\s*=\\s*\\d+').test(serverSrc));
if (missingAddon.length) fail('Missing add-on amount constant(s): ' + missingAddon.join(', '));
else ok('Add-on amounts defined (drone, karaoke, tube)');

// 6) Holiday specials: the server's flat holiday price (cents) must equal the
//    booking flow's holiday price (dollars) ×100 — no quote-vs-charge gap on holidays.
function parseHolidayPairs(file, varName) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(new RegExp(varName + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\};'));
  if (!m) return null;
  const pairs = {};
  for (const pm of m[1].matchAll(/(\d+)\s*:\s*(\d+)/g)) pairs[pm[1]] = Number(pm[2]);
  return pairs;
}
const holidayCents = parseHolidayPairs('server.js', 'HOLIDAY_PRICING_CENTS');
const holidayDollars = parseHolidayPairs('jetski-booking/index.html', 'HOLIDAY_SPECIALS');
if (!holidayCents || !holidayDollars) {
  ok('No holiday specials configured (holiday cross-check skipped)');
} else {
  const hm = [];
  const durs = new Set([...Object.keys(holidayCents), ...Object.keys(holidayDollars)]);
  for (const d of durs) {
    if (holidayCents[d] === undefined) hm.push(`server missing holiday ${d}h`);
    else if (holidayDollars[d] === undefined) hm.push(`booking flow missing holiday ${d}h`);
    else if (holidayCents[d] !== holidayDollars[d] * 100) hm.push(`${d}h server=${holidayCents[d]}c vs site=$${holidayDollars[d]}`);
  }
  if (hm.length) hm.forEach((x) => fail('HOLIDAY price mismatch: ' + x));
  else ok('Holiday special prices match (server vs booking flow)');
}

console.log('\n' + (failures === 0 ? '✅ Validation passed' : `❌ ${failures} validation failure(s)`));
process.exit(failures === 0 ? 0 : 1);
