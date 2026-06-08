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

console.log('\n' + (failures === 0 ? '✅ Validation passed' : `❌ ${failures} validation failure(s)`));
process.exit(failures === 0 ? 0 : 1);
