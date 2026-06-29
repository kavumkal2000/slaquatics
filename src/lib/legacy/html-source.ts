import { readFileSync } from 'node:fs';

const RENDER_OPS_ORIGIN = 'https://shoreline-aquatics-ops.onrender.com';

const LEGACY_HTML_FILES = {
  'jetski-booking/index.html': readFileSync('jetski-booking/index.html', 'utf8'),
  'jetski-booking-confirmation/index.html': readFileSync('jetski-booking-confirmation/index.html', 'utf8'),
  'booking-thank-you/index.html': readFileSync('booking-thank-you/index.html', 'utf8'),
  'waiver/index.html': readFileSync('waiver/index.html', 'utf8'),
  'privacy-policy/index.html': readFileSync('privacy-policy/index.html', 'utf8'),
  'jet-ski-rental-denton/index.html': readFileSync('jet-ski-rental-denton/index.html', 'utf8'),
  'jet-ski-rental-frisco/index.html': readFileSync('jet-ski-rental-frisco/index.html', 'utf8'),
  'jet-ski-rental-lewisville/index.html': readFileSync('jet-ski-rental-lewisville/index.html', 'utf8'),
  'ops-login.html': readFileSync('ops-login.html', 'utf8'),
  'ops.html': readFileSync('ops.html', 'utf8')
} as const;

export type LegacyHtmlFile = keyof typeof LEGACY_HTML_FILES;

function rewriteForCloudflare(html: string) {
  return html
    .replaceAll(`<link rel="preconnect" href="${RENDER_OPS_ORIGIN}" crossorigin>\n`, '')
    .replaceAll(RENDER_OPS_ORIGIN, '')
    .replaceAll("? ''", '? window.location.origin')
    .replaceAll(": ''", ': window.location.origin')
    .replaceAll(" ? ''", ' ? window.location.origin')
    .replaceAll(" : ''", ' : window.location.origin');
}

export function legacyHtmlFor(file: LegacyHtmlFile) {
  return rewriteForCloudflare(LEGACY_HTML_FILES[file]);
}
