// Pre-deploy static validation. Run: npm run check
// Exits non-zero on failure so it can gate a deploy.
import fs from 'node:fs';
import path from 'node:path';

let failures = 0;
const fail = (message) => {
  console.log(`❌ ${message}`);
  failures += 1;
};
const ok = (message) => console.log(`✅ ${message}`);

const read = (file) => fs.readFileSync(file, 'utf8');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.open-next', 'legacy'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else files.push(file);
  }
  return files;
}

const activeSourceFiles = [
  ...walk('src')
].filter((file) => /\.(tsx?|jsx?|mjs|cjs)$/.test(file));

// 1) Active source must not reintroduce raw browser HTML execution patterns.
const approvedDangerousHtmlFile = 'src/features/JsonLdStructuredData.tsx';
const unsafePatterns = [
  {
    label: 'dangerouslySetInnerHTML outside the audited JSON-LD helper',
    pattern: /dangerouslySetInnerHTML/,
    allow: (file) => file === approvedDangerousHtmlFile
  },
  {
    label: 'innerHTML assignment in active feature code',
    pattern: /\.innerHTML\s*=/,
    allow: () => false
  },
  { label: 'inline onclick handler string', pattern: /<[^>]*\sonclick\s*=/, allow: () => false },
  { label: 'inline onerror handler string', pattern: /<[^>]*\sonerror\s*=/, allow: () => false },
  { label: 'inline onload handler string', pattern: /<[^>]*\sonload\s*=/, allow: () => false },
  { label: 'document.write', pattern: /document\.write\s*\(/, allow: () => false },
  { label: 'eval call', pattern: /\beval\s*\(/, allow: () => false },
  { label: 'Function constructor', pattern: /\bnew\s+Function\s*\(/, allow: () => false },
  { label: 'insertAdjacentHTML', pattern: /\.insertAdjacentHTML\s*\(/, allow: () => false },
  { label: 'outerHTML assignment', pattern: /\.outerHTML\s*=/, allow: () => false },
  { label: 'srcdoc assignment/attribute', pattern: /\bsrcdoc\b/i, allow: () => false }
];

for (const file of activeSourceFiles) {
  const source = read(file);
  for (const rule of unsafePatterns) {
    if (rule.allow(file)) continue;
    if (rule.pattern.test(source)) fail(`${file}: ${rule.label}`);
  }
}
if (failures === 0) ok('Active source avoids raw HTML execution patterns');

// 2) JSON-LD must be centralized through the audited helper.
const structuredDataFiles = walk('src/features')
  .filter((file) => file.endsWith('StructuredData.tsx'));
if (!fs.existsSync(approvedDangerousHtmlFile)) {
  fail(`${approvedDangerousHtmlFile}: missing audited JSON-LD helper`);
} else {
  const helperSource = read(approvedDangerousHtmlFile);
  if (!/type=["']application\/ld\+json["']/.test(helperSource)) fail(`${approvedDangerousHtmlFile}: helper must emit application/ld+json`);
  if (!/JSON\.stringify/.test(helperSource)) fail(`${approvedDangerousHtmlFile}: helper must serialize data with JSON.stringify`);
  if (!/dangerouslySetInnerHTML/.test(helperSource)) fail(`${approvedDangerousHtmlFile}: helper should be the only dangerous HTML boundary`);
}
for (const file of structuredDataFiles) {
  const source = read(file);
  if (!/JsonLdStructuredData/.test(source)) fail(`${file}: structured data should use the audited JsonLd helper`);
}
if (structuredDataFiles.length) ok(`Structured data files discovered (${structuredDataFiles.length})`);
else fail('No active structured data files found');

// 3) Public booking prices must match the server-side checkout calculator.
function parsePricingLiteral(source, name) {
  const marker = new RegExp(`${name}[^=]*=\\s*\\{`, 'm');
  const match = marker.exec(source);
  if (!match) return null;
  let index = match.index + match[0].lastIndexOf('{');
  let depth = 0;
  let end = -1;
  for (; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  return source.slice(match.index + match[0].lastIndexOf('{'), end);
}

function parseCraftPrices(source, name) {
  const literal = parsePricingLiteral(source, name);
  if (!literal) return null;
  const prices = {};
  for (const craftMatch of literal.matchAll(/([a-z0-9]+)\s*:\s*\{([^}]*)\}/g)) {
    const craft = craftMatch[1];
    prices[craft] = {};
    for (const priceMatch of craftMatch[2].matchAll(/(\d+)\s*:\s*(\d+)/g)) {
      prices[craft][priceMatch[1]] = Number(priceMatch[2]);
    }
  }
  return prices;
}

const publicApiSource = read('src/lib/ops/public-api.ts');
const bookingSource = read('src/features/jetskiBooking/JetskiBookingClientBehavior.tsx');
const homeSource = read('src/features/home/HomeClientBehavior.tsx');
const opsSource = read('src/features/ops/runtime/opsRuntime.client.js');
const publicApiPricing = parseCraftPrices(publicApiSource, 'PRICING');
const bookingPricing = parseCraftPrices(bookingSource, 'PRICING');
const homePricing = parseCraftPrices(homeSource, 'PRICING');
const opsPricing = parseCraftPrices(opsSource, 'PRICING');

const priceTables = [
  ['src/lib/ops/public-api.ts', publicApiPricing],
  ['src/features/jetskiBooking/JetskiBookingClientBehavior.tsx', bookingPricing],
  ['src/features/home/HomeClientBehavior.tsx', homePricing],
  ['src/features/ops/runtime/opsRuntime.client.js', opsPricing]
];
if (priceTables.some(([, table]) => !table)) {
  priceTables.filter(([, table]) => !table).forEach(([file]) => fail(`${file}: PRICING table not found`));
} else {
  const mismatches = [];
  const crafts = new Set(priceTables.flatMap(([, table]) => Object.keys(table)));
  for (const craft of crafts) {
    const durations = new Set(priceTables.flatMap(([, table]) => Object.keys(table[craft] || {})));
    for (const duration of durations) {
      const present = priceTables.filter(([, table]) => table[craft]?.[duration] !== undefined);
      if (present.length < 2) continue;
      const values = new Set(present.map(([, table]) => table[craft][duration]));
      if (values.size > 1) {
        mismatches.push(`${craft}[${duration}] — ${present.map(([file, table]) => `${file}=${table[craft][duration]}`).join(', ')}`);
      }
    }
  }
  if (mismatches.length) mismatches.forEach((message) => fail(`PRICING mismatch: ${message}`));
  else ok('Active pricing tables agree for shared craft/duration prices');
}

if (!bookingPricing?.partyboat) fail('Party boat missing from active booking PRICING table');
else if (!/boat:\s*\[[^\]]*partyboat/.test(bookingSource)) fail('Party boat is priced but not selectable in active booking TYPE_TO_CRAFTS');
else ok('Party boat is priced and bookable in active booking flow');

['drone', 'karaoke', 'tube'].forEach((addon) => {
  if (!new RegExp(`${addon}\\s*\\?\\s*50\\s*:\\s*0`, 'i').test(publicApiSource)) {
    fail(`src/lib/ops/public-api.ts: missing ${addon} add-on amount`);
  }
});
ok('Add-on amount checks completed');

// 4) Holiday specials must match between public checkout API and booking UI.
function parseHolidayPrices(source, name) {
  const literal = parsePricingLiteral(source, name);
  if (!literal) return null;
  const prices = {};
  for (const dateMatch of literal.matchAll(/['"](\d{4}-\d{2}-\d{2})['"][\s\S]*?crafts\s*:\s*\{([\s\S]*?)\n\s*\}/g)) {
    prices[dateMatch[1]] = {};
    for (const craftMatch of dateMatch[2].matchAll(/([a-z0-9]+)\s*:\s*(?:\{[^}]*durations\s*:\s*)?\{([^}]*)\}/g)) {
      prices[dateMatch[1]][craftMatch[1]] = {};
      for (const priceMatch of craftMatch[2].matchAll(/(\d+)\s*:\s*(\d+)/g)) {
        prices[dateMatch[1]][craftMatch[1]][priceMatch[1]] = Number(priceMatch[2]);
      }
    }
  }
  return prices;
}

const apiHolidayPrices = parseHolidayPrices(publicApiSource, 'HOLIDAY_PRICING');
const bookingHolidayPrices = parseHolidayPrices(bookingSource, 'HOLIDAY_SPECIALS');
if (!apiHolidayPrices || !bookingHolidayPrices) {
  fail('Could not parse active holiday pricing tables');
} else {
  const mismatches = [];
  const dates = new Set([...Object.keys(apiHolidayPrices), ...Object.keys(bookingHolidayPrices)]);
  for (const date of dates) {
    const crafts = new Set([...Object.keys(apiHolidayPrices[date] || {}), ...Object.keys(bookingHolidayPrices[date] || {})]);
    for (const craft of crafts) {
      const durations = new Set([
        ...Object.keys(apiHolidayPrices[date]?.[craft] || {}),
        ...Object.keys(bookingHolidayPrices[date]?.[craft] || {})
      ]);
      for (const duration of durations) {
        const apiPrice = apiHolidayPrices[date]?.[craft]?.[duration];
        const bookingPrice = bookingHolidayPrices[date]?.[craft]?.[duration];
        if (apiPrice !== bookingPrice) mismatches.push(`${date} ${craft}[${duration}] api=${apiPrice} booking=${bookingPrice}`);
      }
    }
  }
  if (mismatches.length) mismatches.forEach((message) => fail(`HOLIDAY price mismatch: ${message}`));
  else ok('Active holiday special prices match');
}

console.log(`\n${failures === 0 ? '✅ Validation passed' : `❌ ${failures} validation failure(s)`}`);
process.exit(failures === 0 ? 0 : 1);
