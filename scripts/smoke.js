// Live (or any) site health check. Run: npm run smoke
// Override targets: SITE_URL=... API_URL=... npm run smoke
// Exits non-zero if anything is down — safe to run on a schedule / alert on failure.
const SITE = process.env.SITE_URL || 'https://slaquatics.com';
const API = process.env.API_URL || 'https://shoreline-aquatics-ops.onrender.com';
const today = new Date().toISOString().slice(0, 10);

const checks = [
  { name: 'Homepage', url: `${SITE}/`, want: 200, contains: 'See What' },
  { name: 'Booking flow', url: `${SITE}/jetski-booking/`, want: 200 },
  { name: 'SEO Denton', url: `${SITE}/jet-ski-rental-denton/`, want: 200 },
  { name: 'SEO Frisco', url: `${SITE}/jet-ski-rental-frisco/`, want: 200 },
  { name: 'SEO Lewisville', url: `${SITE}/jet-ski-rental-lewisville/`, want: 200 },
  { name: 'Ops login', url: `${SITE}/ops-login.html`, want: 200 },
  { name: 'API availability', url: `${API}/api/public/availability?date=${today}&craft=jetski2&duration=2`, want: 200, contains: '"ok":true' },
  { name: 'API integrations', url: `${API}/api/public/integrations/status`, want: 200 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Try a check up to 3 times before declaring failure, so a momentary blip
// (deploy in progress, cold start) doesn't trigger a false-alarm alert.
async function attempt(c) {
  const res = await fetch(c.url, { signal: AbortSignal.timeout(25000) });
  const body = c.contains ? await res.text() : '';
  const okStatus = res.status === c.want;
  const okBody = !c.contains || body.includes(c.contains);
  if (okStatus && okBody) return { pass: true, note: 'ok' };
  return { pass: false, note: !okStatus ? `got ${res.status}, want ${c.want}` : `missing "${c.contains}"` };
}

let failed = 0;
for (const c of checks) {
  let result = null;
  for (let i = 0; i < 3; i++) {
    try { result = await attempt(c); }
    catch (e) { result = { pass: false, note: `ERROR ${e.message}` }; }
    if (result.pass) break;
    if (i < 2) await sleep(5000);
  }
  if (!result.pass) failed++;
  console.log(`${result.pass ? '✅' : '❌'} ${c.name.padEnd(18)} ${result.note}`);
}
console.log('\n' + (failed === 0 ? `✅ All ${checks.length} checks passed` : `❌ ${failed} of ${checks.length} checks FAILED`));
process.exit(failed === 0 ? 0 : 1);
