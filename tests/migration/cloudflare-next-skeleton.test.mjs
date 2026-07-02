import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const readText = (file) => readFileSync(file, 'utf8');
function rgCount(dir, pattern) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const file = `${dir}/${entry}`;
    if (statSync(file).isDirectory()) count += rgCount(file, pattern);
    else if (/\.(tsx?|jsx?)$/.test(file)) count += (readText(file).match(pattern) || []).length;
  }
  return count;
}
function collectFiles(dir, pattern) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const file = `${dir}/${entry}`;
    if (statSync(file).isDirectory()) files.push(...collectFiles(file, pattern));
    else if (pattern.test(file)) files.push(file);
  }
  return files;
}

test('modern stack scripts and dependencies are declared', () => {
  const pkg = readJson('package.json');

  assert.equal(pkg.scripts.dev, 'next dev');
  assert.equal(pkg.scripts.build, 'next build');
  assert.equal(pkg.scripts['cf:build'], 'opennextjs-cloudflare build');
  assert.equal(pkg.scripts['cf:preview'], 'opennextjs-cloudflare preview');
  assert.equal(pkg.scripts['cf:deploy:dev'], 'opennextjs-cloudflare deploy --env development');
  assert.equal(pkg.scripts['cf:deploy:prod'], 'opennextjs-cloudflare deploy --env production');
  assert.ok(pkg.dependencies.next);
  assert.ok(pkg.dependencies.react);
  assert.ok(pkg.dependencies['react-dom']);
  assert.ok(pkg.devDependencies.typescript);
  assert.ok(pkg.devDependencies.tailwindcss);
  assert.ok(pkg.devDependencies['@tailwindcss/postcss']);
  assert.ok(pkg.devDependencies['@opennextjs/cloudflare']);
  assert.ok(pkg.devDependencies.wrangler);
});

test('PostCSS uses the Tailwind v4 plugin package', () => {
  const config = readText('postcss.config.mjs');

  assert.match(config, /['"]@tailwindcss\/postcss['"]/);
  assert.doesNotMatch(config, /tailwindcss:\s*\{/);
});

test('Next.js, TypeScript, Tailwind, and OpenNext configuration files exist', () => {
  [
    'next.config.mjs',
    'tsconfig.json',
    'postcss.config.mjs',
    'tailwind.config.ts',
    'open-next.config.ts',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/globals.css'
  ].forEach((file) => assert.ok(existsSync(file), `${file} should exist`));
});

test('Next.js config pins the repository root for deterministic builds', () => {
  const config = readText('next.config.mjs');

  assert.match(config, /turbopack/);
  assert.match(config, /root/);
});

test('root layout provides required html and body tags', () => {
  const layout = readText('src/app/layout.tsx');

  assert.match(layout, /<html\b/);
  assert.match(layout, /<body\b/);
  assert.match(layout, /\{children\}/);
});

test('legacy ops html URLs are redirected by the Cloudflare worker without Next middleware or .html prerender entries', async () => {
  const { default: nextConfig } = await import(pathToFileURL('next.config.mjs'));

  assert.equal(typeof nextConfig.redirects, 'function');

  const redirects = await nextConfig.redirects();

  assert.deepEqual(redirects.filter((redirect) => redirect.source === '/ops.html' || redirect.source === '/ops-login.html'), []);

  const worker = readText('src/worker.ts');
  assert.match(worker, /legacyHtmlRedirects/);
  assert.match(worker, /'\/ops\.html': '\/ops'/);
  assert.match(worker, /'\/ops-login\.html': '\/ops-login'/);
  assert.match(worker, /Response\.redirect\(url\.toString\(\), 308\)/);

  assert.equal(existsSync('src/proxy.ts'), false);
  assert.equal(existsSync('src/app/ops.html/page.tsx'), false);
  assert.equal(existsSync('src/app/ops-login.html/page.tsx'), false);
});

test('Wrangler defines isolated development and production Cloudflare services', () => {
  const wrangler = readText('wrangler.toml');

  assert.match(wrangler, /name = "slaquatics"/);
  assert.match(wrangler, /\[env\.development\]/);
  assert.match(wrangler, /name = "slaquatics-development"/);
  assert.match(wrangler, /\[env\.production\]/);
  assert.match(wrangler, /name = "slaquatics-production"/);
  assert.match(wrangler, /\[\[env\.development\.d1_databases\]\]/);
  assert.match(wrangler, /\[\[env\.production\.d1_databases\]\]/);
  assert.match(wrangler, /binding = "OPS_DB"/);
  assert.match(wrangler, /\[triggers\]\ncrons = \["0 14 \* \* 1"\]/);
  assert.doesNotMatch(wrangler, /shoreline-aquatics-ops\.onrender\.com/);
});

test('Wrangler defines split R2 media buckets and CDN domains per environment', () => {
  const wrangler = readText('wrangler.toml');

  assert.match(wrangler, /\[env\.development\.vars\][\s\S]*PUBLIC_MEDIA_BASE_URL = "https:\/\/cdn\.dev\.slaquatics\.com"/);
  assert.match(wrangler, /\[env\.production\.vars\][\s\S]*PUBLIC_MEDIA_BASE_URL = "https:\/\/cdn\.slaquatics\.com"/);
  assert.match(wrangler, /\[env\.development\.placement\]\nmode = "smart"/);
  assert.match(wrangler, /\[env\.production\.placement\]\nmode = "smart"/);
  assert.match(wrangler, /\[\[env\.development\.routes\]\]\npattern = "dev\.slaquatics\.com"\ncustom_domain = true/);
  assert.match(wrangler, /\[\[env\.production\.routes\]\]\npattern = "slaquatics\.com"\ncustom_domain = true/);
  assert.match(wrangler, /\[\[env\.production\.routes\]\]\npattern = "www\.slaquatics\.com"\ncustom_domain = true/);
  assert.match(wrangler, /\[\[env\.development\.r2_buckets\]\]\nbinding = "MEDIA_BUCKET"\nbucket_name = "slaquatics-media-development"/);
  assert.match(wrangler, /\[\[env\.production\.r2_buckets\]\]\nbinding = "MEDIA_BUCKET"\nbucket_name = "slaquatics-media-production"/);
});

test('media CDN publishing is deterministic and excludes legacy archive inputs', () => {
  const pkg = readJson('package.json');
  const script = readText('scripts/publish-media-r2.mjs');
  const docs = readText('docs/media-cdn.md');

  assert.equal(pkg.scripts['media:publish'], 'node scripts/publish-media-r2.mjs');
  assert.match(script, /slaquatics-media-development/);
  assert.match(script, /slaquatics-media-production/);
  assert.match(script, /cdn\.dev\.slaquatics\.com/);
  assert.match(script, /cdn\.slaquatics\.com/);
  assert.match(script, /media-source\/images/);
  assert.match(script, /media-source\/videos/);
  assert.match(script, /--env production/);
  assert.match(script, /legacy\//);
  assert.match(script, /manifests\/media-manifest\.json/);
  assert.match(script, /--cache-control/);
  assert.match(script, /--remote/);
  assert.doesNotMatch(script, /readFileSync\(['"]legacy\//);
  assert.equal(existsSync('public/assets'), false);
  assert.equal(existsSync('public/assets/videos'), false);
  assert.ok(existsSync('media-source/README.md'));

  for (const required of [
    'slaquatics-media-development',
    'slaquatics-media-production',
    'cdn.dev.slaquatics.com',
    'cdn.slaquatics.com',
    'site/images/',
    'site/videos/',
    'brand/',
    'ops/',
    'originals/',
    'manifests/media-manifest.json'
  ]) {
    assert.match(docs, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('active media references use the central CDN helper instead of legacy or third-party hosts', () => {
  const helper = readText('src/lib/media.ts');
  const activeDirs = ['src/app', 'src/features', 'src/lib'];
  const activeSource = activeDirs
    .flatMap((dir) => collectFiles(dir, /\.(tsx?|jsx?)$/))
    .map((file) => readText(file))
    .join('\n');

  assert.match(helper, /PUBLIC_MEDIA_BASE_URL/);
  assert.match(helper, /mediaUrl/);
  assert.match(helper, /cdn\.slaquatics\.com/);
  assert.doesNotMatch(activeSource, /images\.leadconnectorhq\.com/);
  assert.doesNotMatch(activeSource, /storage\.googleapis\.com\/msgsndr/);
  assert.doesNotMatch(activeSource, /src=["'](?:\.\.?\/)?assets\/images\//);
  assert.doesNotMatch(activeSource, /https:\/\/slaquatics\.com\/assets\/images\//);
});

test('Cloudflare worker owns scheduled weekly digest dispatch', () => {
  const worker = readText('src/worker.ts');
  const cronRoute = readText('src/app/api/internal/owner-weekly-cron/route.ts');

  assert.match(worker, /async scheduled\(/);
  assert.match(worker, /OWNER_WEEKLY_CRON_SECRET/);
  assert.match(worker, /\/api\/internal\/owner-weekly-cron/);
  assert.match(worker, /console\.warn/);
  assert.match(cronRoute, /x-shoreline-cron-secret/);
  assert.match(cronRoute, /sendOwnerWeeklyDigest/);
});

test('Cloudflare env and maintenance docs cover current runtime primitives', () => {
  const deploymentEnv = readText('DEPLOYMENT-ENV.md');
  const maintenance = readText('MAINTENANCE.md');
  const envExample = readText('.env.example');

  for (const text of [deploymentEnv, maintenance]) {
    assert.match(text, /Cloudflare/);
    assert.doesNotMatch(text, /Render deploy|Render logs|server\.js/);
  }
  assert.match(deploymentEnv, /OWNER_WEEKLY_CRON_SECRET/);
  assert.match(deploymentEnv, /PUBLIC_CORS_ALLOWED_ORIGINS/);
  assert.match(envExample, /OWNER_WEEKLY_CRON_SECRET=replace-with-long-random-cron-secret/);
  assert.match(envExample, /PUBLIC_CORS_ALLOWED_ORIGINS=/);
});

test('iOS native wrapper uses canonical HTTPS ops host only', () => {
  const wrapper = readText('iOS/ShorelineOpsNative/ShorelineOpsNative/OpsWebView.swift');
  const readme = readText('iOS/ShorelineOpsNative/README.md');

  assert.match(wrapper, /https:\/\/slaquatics\.com\/ops-login/);
  assert.match(wrapper, /if scheme == "https"/);
  assert.doesNotMatch(wrapper, /shoreline-aquatics-ops\.onrender\.com/);
  assert.doesNotMatch(wrapper, /scheme == "http"/);
  assert.match(readme, /https:\/\/slaquatics\.com\/ops-login/);
});

test('GitHub Actions validates PRs and deploys Cloudflare Workers from protected branches', () => {
  assert.equal(existsSync('.github/workflows/cloudflare-workers.yml'), true);
  const workflow = readText('.github/workflows/cloudflare-workers.yml');

  assert.match(workflow, /pull_request:\n\s+branches:\n\s+- development\n\s+- main/);
  assert.match(workflow, /push:\n\s+branches:\n\s+- development\n\s+- main/);
  assert.match(workflow, /if: github\.event_name == 'push'/);
  assert.match(workflow, /npm run check && npm run cf:build/);
  assert.match(workflow, /name: Restore production build cache\n\s+if: github\.ref_name == 'main'/);
  assert.match(workflow, /path: \.next\/cache/);
  assert.match(workflow, /key: next-production-/);
  assert.match(workflow, /npm run cf:deploy:dev/);
  assert.match(workflow, /npm run cf:deploy:prod/);
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
});

test('Wrangler D1 bindings use created Cloudflare database IDs, not placeholders', () => {
  const wrangler = readText('wrangler.toml');
  const databaseIds = [...wrangler.matchAll(/database_id = "([^"]+)"/g)].map((match) => match[1]);

  assert.equal(databaseIds.length, 3);
  databaseIds.forEach((id) => {
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.doesNotMatch(id, /replace-with/);
  });
  assert.equal(new Set(databaseIds).size, 2);
  assert.match(wrangler, /database_name = "slaquatics-ops-development"\ndatabase_id = "cd7a9b41-a04f-4143-b081-a02bd245f1ac"/);
  assert.match(wrangler, /database_name = "slaquatics-ops-production"\ndatabase_id = "11cf5caf-2cd8-4851-aaa4-0aa754838287"/);
});

test('D1 compatibility migration preserves the current single JSON ops_state model', () => {
  const migration = readText('migrations/0001_ops_state.sql');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS ops_state/);
  assert.match(migration, /id INTEGER PRIMARY KEY/);
  assert.match(migration, /payload TEXT NOT NULL/);
  assert.match(migration, /updated_at TEXT NOT NULL/);
});

test('public route inventory is represented in the new app router', () => {
  [
    'src/app/page.tsx',
    'src/app/jetski-booking/page.tsx',
    'src/app/jetski-booking-confirmation/page.tsx',
    'src/app/booking-thank-you/page.tsx',
    'src/app/waiver/page.tsx',
    'src/app/privacy-policy/page.tsx',
    'src/app/jet-ski-rental-denton/page.tsx',
    'src/app/jet-ski-rental-frisco/page.tsx',
    'src/app/jet-ski-rental-lewisville/page.tsx',
    'src/app/ops-login/page.tsx',
    'src/app/ops/page.tsx'
  ].forEach((file) => assert.ok(existsSync(file), `${file} should exist`));
});

test('homepage is converted to named React components instead of whole-page legacy HTML', () => {
  const page = readText('src/app/page.tsx');

  assert.doesNotMatch(page, /LegacyHtml/);
  assert.match(page, /<HomePage/);
  assert.match(page, /export const metadata/);
  assert.match(page, /Shoreline Aquatics/);
  assert.ok(existsSync('src/features/home/HomePage.tsx'));
  assert.ok(existsSync('src/features/home/HomeNav.tsx'));
  assert.ok(existsSync('src/features/home/HomeHero.tsx'));
  assert.ok(existsSync('src/features/home/HomeStyles.tsx'));
  assert.ok(existsSync('src/features/home/HomeClientBehavior.tsx'));
  assert.ok(existsSync('src/features/home/HomeStructuredData.tsx'));
});

test('homepage is not relying on generated no-check or string-eval behavior', () => {
  assert.equal(rgCount('src/features/home', /@ts-nocheck/g), 0);
  assert.equal(rgCount('src/features/home', /RunClientScripts/g), 0);
  assert.equal(rgCount('src/features/home', /runInlineAction/g), 0);
  assert.equal(rgCount('src/features/home', /Function\(|eval\(/g), 0);
});

test('jetski booking route uses typed React behavior instead of generated script shortcuts', () => {
  assert.equal(rgCount('src/features/jetskiBooking', /@ts-nocheck/g), 0);
  assert.equal(rgCount('src/features/jetskiBooking', /RunClientScripts/g), 0);
  assert.equal(rgCount('src/features/jetskiBooking', /runInlineAction/g), 0);
  assert.equal(rgCount('src/features/jetskiBooking', /Function\(|eval\(/g), 0);
  assert.equal(rgCount('src/features/jetskiBooking', /window\.location\.origin/g), 0);
});

test('jetski booking page is split into named React sections instead of generated div bodies', () => {
  const page = readText('src/features/jetskiBooking/JetskiBookingPage.tsx');

  assert.doesNotMatch(page, /JetskiBookingDiv[12]/);
  for (const component of [
    'JetskiBookingShell',
    'JetskiBookingTopbar',
    'JetskiBookingHero',
    'JetskiBookingFirstTimer',
    'JetskiBookingFormCard',
    'JetskiBookingStickyMobileBar'
  ]) {
    assert.match(page, new RegExp(component));
    assert.ok(existsSync(`src/features/jetskiBooking/components/${component}.tsx`), `${component} should exist`);
  }
  assert.equal(existsSync('src/features/jetskiBooking/components/JetskiBookingDiv1.tsx'), false);
  assert.equal(existsSync('src/features/jetskiBooking/components/JetskiBookingDiv2.tsx'), false);
});

test('public pages do not render removed availability promo sections', () => {
  const homePage = readText('src/features/home/HomePage.tsx');
  const bookingPage = readText('src/features/jetskiBooking/JetskiBookingPage.tsx');

  assert.doesNotMatch(homePage, /HomeNotifySection/);
  assert.doesNotMatch(bookingPage, /JetskiBookingAvailabilitySpotlight/);
  assert.equal(existsSync('src/features/home/components/HomeNotifySection.tsx'), false);
  assert.equal(existsSync('src/features/jetskiBooking/components/JetskiBookingAvailabilitySpotlight.tsx'), false);
});

test('public booking completion routes use typed React behavior instead of generated script shortcuts', () => {
  for (const feature of ['jetskiBookingConfirmation', 'bookingThankYou']) {
    const dir = `src/features/${feature}`;
    assert.equal(rgCount(dir, /@ts-nocheck/g), 0, `${feature} should not use ts-nocheck`);
    assert.equal(rgCount(dir, /RunClientScripts/g), 0, `${feature} should not use generated script runner`);
    assert.equal(rgCount(dir, /runInlineAction/g), 0, `${feature} should not use inline action bridge`);
    assert.equal(rgCount(dir, /window\.location\.origin/g), 0, `${feature} should not contain generated placeholder leakage`);
  }
});

test('booking confirmation page is split into named React sections instead of a generated div body', () => {
  const page = readText('src/features/jetskiBookingConfirmation/JetskiBookingConfirmationPage.tsx');

  assert.doesNotMatch(page, /JetskiBookingConfirmationDiv1/);
  for (const component of [
    'JetskiBookingConfirmationShell',
    'JetskiBookingConfirmationTopbar',
    'JetskiBookingConfirmationHero',
    'JetskiBookingConfirmationEmptyState',
    'JetskiBookingConfirmationForm',
    'JetskiBookingConfirmationSummary'
  ]) {
    assert.match(page, new RegExp(component));
    assert.ok(existsSync(`src/features/jetskiBookingConfirmation/components/${component}.tsx`), `${component} should exist`);
  }
  assert.equal(existsSync('src/features/jetskiBookingConfirmation/components/JetskiBookingConfirmationDiv1.tsx'), false);
});

test('booking thank-you page is split into named React sections instead of a generated div body', () => {
  const page = readText('src/features/bookingThankYou/BookingThankYouPage.tsx');

  assert.doesNotMatch(page, /BookingThankYouDiv1/);
  for (const component of [
    'BookingThankYouShell',
    'BookingThankYouTopbar',
    'BookingThankYouEmptyState',
    'BookingThankYouHero',
    'BookingThankYouConfirmation',
    'BookingThankYouSummary',
    'BookingThankYouArrival'
  ]) {
    assert.match(page, new RegExp(component));
    assert.ok(existsSync(`src/features/bookingThankYou/components/${component}.tsx`), `${component} should exist`);
  }
  assert.equal(existsSync('src/features/bookingThankYou/components/BookingThankYouDiv1.tsx'), false);
});

test('waiver legal and city SEO routes avoid generated script wrappers', () => {
  for (const feature of ['waiver', 'privacyPolicy', 'jetSkiRentalDenton', 'jetSkiRentalFrisco', 'jetSkiRentalLewisville']) {
    const dir = `src/features/${feature}`;
    assert.equal(rgCount(dir, /@ts-nocheck/g), 0, `${feature} should not use ts-nocheck`);
    assert.equal(rgCount(dir, /RunClientScripts/g), 0, `${feature} should not use generated script runner`);
    assert.equal(rgCount(dir, /runInlineAction/g), 0, `${feature} should not use inline action bridge`);
    assert.equal(rgCount(dir, /window\.location\.origin/g), 0, `${feature} should not contain generated placeholder leakage`);
  }
});

test('waiver page is split into named React sections instead of a generated div body', () => {
  const page = readText('src/features/waiver/WaiverPage.tsx');

  assert.doesNotMatch(page, /WaiverDiv1/);
  for (const component of [
    'WaiverShell',
    'WaiverTopbar',
    'WaiverHero',
    'WaiverFormSection',
    'WaiverSuccessCard',
    'WaiverTerms'
  ]) {
    assert.match(page, new RegExp(component));
    assert.ok(existsSync(`src/features/waiver/components/${component}.tsx`), `${component} should exist`);
  }
  assert.equal(existsSync('src/features/waiver/components/WaiverDiv1.tsx'), false);
});

test('city SEO pages use shared typed city rental components instead of generated div bodies', () => {
  const routes = [
    ['jetSkiRentalDenton', 'JetSkiRentalDenton'],
    ['jetSkiRentalFrisco', 'JetSkiRentalFrisco'],
    ['jetSkiRentalLewisville', 'JetSkiRentalLewisville']
  ];

  assert.ok(existsSync('src/features/cityRental/CityRentalPage.tsx'));
  assert.ok(existsSync('src/features/cityRental/cityRentalContent.tsx'));

  for (const [feature, prefix] of routes) {
    const page = readText(`src/features/${feature}/${prefix}Page.tsx`);
    assert.doesNotMatch(page, new RegExp(`${prefix}Div1`));
    assert.match(page, /CityRentalPage/);
    assert.match(page, /cityRentalPages/);
    assert.equal(existsSync(`src/features/${feature}/components/${prefix}Div1.tsx`), false);
  }
});

test('privacy policy page is split into named React sections instead of a generated div body', () => {
  const page = readText('src/features/privacyPolicy/PrivacyPolicyPage.tsx');

  assert.doesNotMatch(page, /PrivacyPolicyDiv1/);
  assert.match(page, /PrivacyPolicyShell/);
  assert.match(page, /PrivacyPolicyBrandLink/);
  assert.match(page, /PrivacyPolicyContent/);
  assert.ok(existsSync('src/features/privacyPolicy/components/PrivacyPolicyShell.tsx'));
  assert.ok(existsSync('src/features/privacyPolicy/components/PrivacyPolicyBrandLink.tsx'));
  assert.ok(existsSync('src/features/privacyPolicy/components/PrivacyPolicyContent.tsx'));
  assert.equal(existsSync('src/features/privacyPolicy/components/PrivacyPolicyDiv1.tsx'), false);
});

test('ops login uses typed React behavior instead of generated script shortcuts', () => {
  assert.equal(rgCount('src/features/opsLogin', /@ts-nocheck/g), 0);
  assert.equal(rgCount('src/features/opsLogin', /RunClientScripts/g), 0);
  assert.equal(rgCount('src/features/opsLogin', /runInlineAction/g), 0);
  assert.equal(rgCount('src/features/opsLogin', /window\.location\.origin/g), 0);
});

test('ops login page is split into named React sections instead of generated div bodies', () => {
  const page = readText('src/features/opsLogin/OpsLoginPage.tsx');

  assert.doesNotMatch(page, /OpsLoginDiv[12]/);
  for (const component of [
    'OpsLoginInstallBanner',
    'OpsLoginShell',
    'OpsLoginHero',
    'OpsLoginPanel'
  ]) {
    assert.match(page, new RegExp(component));
    assert.ok(existsSync(`src/features/opsLogin/components/${component}.tsx`), `${component} should exist`);
  }
  assert.equal(existsSync('src/features/opsLogin/components/OpsLoginDiv1.tsx'), false);
  assert.equal(existsSync('src/features/opsLogin/components/OpsLoginDiv2.tsx'), false);
});

test('unused generated ops component duplicates have been removed', () => {
  for (const file of [
    'src/features/ops/components/OpsAside3.tsx',
    'src/features/ops/components/OpsButton4.tsx',
    'src/features/ops/components/OpsDiv1.tsx',
    'src/features/ops/components/OpsDiv2.tsx',
    'src/features/ops/components/OpsDiv6.tsx',
    'src/features/ops/components/OpsDiv7.tsx',
    'src/features/ops/components/OpsDiv8.tsx',
    'src/features/ops/components/OpsDiv9.tsx',
    'src/features/ops/components/OpsDiv10.tsx',
    'src/features/ops/components/OpsDiv11.tsx',
    'src/features/ops/components/OpsDiv12.tsx',
    'src/features/ops/components/OpsDiv13.tsx',
    'src/features/ops/components/OpsDiv14.tsx'
  ]) {
    assert.equal(existsSync(file), false, `${file} should not remain after named component extraction`);
  }
});

test('ops chrome shell is composed from meaningfully named typed components', () => {
  const page = readText('src/features/ops/OpsPage.tsx');
  const files = [
    'src/features/ops/components/OpsInstallBanner.tsx',
    'src/features/ops/components/OpsLoadingGate.tsx',
    'src/features/ops/components/OpsSidebar.tsx',
    'src/features/ops/components/OpsMobileNavBackdrop.tsx'
  ];

  assert.match(page, /<OpsInstallBanner \/>/);
  assert.match(page, /<OpsLoadingGate \/>/);
  assert.match(page, /<OpsSidebar \/>/);
  assert.match(page, /<OpsMobileNavBackdrop \/>/);
  assert.doesNotMatch(page, /\b(?:OpsDiv1|OpsDiv2|OpsAside3|OpsButton4)\b/);
  files.forEach((file) => {
    assert.ok(existsSync(file), `${file} should exist`);
    const source = readText(file);
    assert.doesNotMatch(source, /@ts-nocheck/);
    assert.doesNotMatch(source, /runInlineAction/);
  });
});

test('ops support surfaces are composed from meaningfully named typed components', () => {
  const page = readText('src/features/ops/OpsPage.tsx');
  const files = [
    'src/features/ops/components/OpsCrmPasteImportModal.tsx',
    'src/features/ops/components/OpsToastRegion.tsx'
  ];

  assert.match(page, /<OpsCrmPasteImportModal \/>/);
  assert.match(page, /<OpsToastRegion \/>/);
  assert.doesNotMatch(page, /\b(?:OpsDiv13|OpsDiv14)\b/);
  files.forEach((file) => {
    assert.ok(existsSync(file), `${file} should exist`);
    const source = readText(file);
    assert.doesNotMatch(source, /@ts-nocheck/);
    assert.doesNotMatch(source, /runInlineAction/);
  });
});

test('ops fleet log modals are composed from meaningfully named typed components', () => {
  const page = readText('src/features/ops/OpsPage.tsx');
  const files = [
    'src/features/ops/components/OpsFuelModal.tsx',
    'src/features/ops/components/OpsMaintenanceModal.tsx'
  ];

  assert.match(page, /<OpsFuelModal \/>/);
  assert.match(page, /<OpsMaintenanceModal \/>/);
  assert.doesNotMatch(page, /\b(?:OpsDiv8|OpsDiv9)\b/);
  files.forEach((file) => {
    assert.ok(existsSync(file), `${file} should exist`);
    const source = readText(file);
    assert.doesNotMatch(source, /@ts-nocheck/);
    assert.doesNotMatch(source, /runInlineAction/);
    assert.match(source, /closeOpsModal/);
  });
});

test('ops expense and tracker modals are composed from meaningfully named typed components', () => {
  const page = readText('src/features/ops/OpsPage.tsx');
  const files = [
    'src/features/ops/components/OpsExpenseModal.tsx',
    'src/features/ops/components/OpsTrackerModal.tsx'
  ];

  assert.match(page, /<OpsExpenseModal \/>/);
  assert.match(page, /<OpsTrackerModal \/>/);
  assert.doesNotMatch(page, /\b(?:OpsDiv11|OpsDiv12)\b/);
  files.forEach((file) => {
    assert.ok(existsSync(file), `${file} should exist`);
    const source = readText(file);
    assert.doesNotMatch(source, /@ts-nocheck/);
    assert.doesNotMatch(source, /runInlineAction/);
  });
});

test('ops booking invoice and customer modals are composed from meaningfully named typed components', () => {
  const page = readText('src/features/ops/OpsPage.tsx');
  const files = [
    'src/features/ops/components/OpsBookingModal.tsx',
    'src/features/ops/components/OpsInvoiceModal.tsx',
    'src/features/ops/components/OpsCustomerModal.tsx'
  ];

  assert.match(page, /<OpsBookingModal \/>/);
  assert.match(page, /<OpsInvoiceModal \/>/);
  assert.match(page, /<OpsCustomerModal \/>/);
  assert.doesNotMatch(page, /\b(?:OpsDiv6|OpsDiv7|OpsDiv10)\b/);
  files.forEach((file) => {
    assert.ok(existsSync(file), `${file} should exist`);
    const source = readText(file);
    assert.doesNotMatch(source, /@ts-nocheck/);
    assert.doesNotMatch(source, /runInlineAction/);
    assert.match(source, /closeOpsModal/);
  });
});

test('ops fuel and invoice helper targets exist for runtime renderers', () => {
  const workspace = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');
  const invoiceModal = readText('src/features/ops/components/OpsInvoiceModal.tsx');

  for (const id of [
    'fuel-kpi-month',
    'fuel-kpi-month-meta',
    'fuel-kpi-rate',
    'fuel-kpi-rate-meta',
    'fuel-kpi-hours',
    'fuel-kpi-hours-meta',
    'fuel-log'
  ]) {
    assert.match(workspace, new RegExp(`id="${id}"`), `Ops workspace should include ${id}`);
  }

  assert.match(invoiceModal, /id="invoice-rental-helper"/);
});

test('ops main dashboard workspace is not mounted under a generated component name', () => {
  const page = readText('src/features/ops/OpsPage.tsx');
  const workspace = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  assert.match(page, /OpsDashboardWorkspace/);
  assert.match(page, /<OpsDashboardWorkspace \/>/);
  assert.doesNotMatch(page, /\bOpsDiv5\b/);
  assert.match(workspace, /export function OpsDashboardWorkspace\(/);
  assert.doesNotMatch(workspace, /export function OpsDiv5\(/);
});

test('ops dashboard topbar is split into a named typed component', () => {
  const workspace = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');
  const topbar = readText('src/features/ops/components/OpsDashboardTopbar.tsx');

  assert.match(workspace, /import \{ OpsDashboardTopbar \} from '\.\/OpsDashboardTopbar';/);
  assert.match(workspace, /<OpsDashboardTopbar \/>/);
  assert.doesNotMatch(workspace, /className="topbar"/);
  assert.doesNotMatch(workspace, /id="mobile-nav-toggle"/);
  assert.match(topbar, /export function OpsDashboardTopbar\(/);
  assert.doesNotMatch(topbar, /@ts-nocheck/);
  assert.doesNotMatch(topbar, /runInlineAction/);
  assert.match(topbar, /id="page-title"/);
  assert.match(topbar, /id="ops-mode-pill"/);
  assert.match(topbar, /id="logout-btn"/);
  assert.match(topbar, /id="topbar-booking-action"/);
});

test('ops dashboard overview is split into a named typed component', () => {
  const workspace = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');
  const overview = readText('src/features/ops/components/OpsDashboardOverview.tsx');

  assert.match(workspace, /import \{ OpsDashboardOverview \} from '\.\/OpsDashboardOverview';/);
  assert.match(workspace, /<OpsDashboardOverview \/>/);
  assert.doesNotMatch(workspace, /id="dashboard-kpi-pending"/);
  assert.doesNotMatch(workspace, /id="booking-bars"/);
  assert.doesNotMatch(workspace, /id="upcoming-bookings-table"/);
  assert.match(overview, /export function OpsDashboardOverview\(/);
  assert.doesNotMatch(overview, /@ts-nocheck/);
  assert.doesNotMatch(overview, /runInlineAction/);
  assert.match(overview, /id="page-dashboard"/);
  assert.match(overview, /id="dashboard-alerts"/);
  assert.match(overview, /id="today-runsheet"/);
  assert.match(overview, /id="dashboard-kpi-pending"/);
  assert.match(overview, /id="booking-bars"/);
  assert.match(overview, /id="fleet-legend"/);
  assert.match(overview, /id="upcoming-bookings-table"/);
});

test('ops reports page is split into a named typed component', () => {
  const workspace = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');
  const reports = readText('src/features/ops/components/OpsReportsPage.tsx');

  assert.match(workspace, /import \{ OpsReportsPage \} from '\.\/OpsReportsPage';/);
  assert.match(workspace, /<OpsReportsPage \/>/);
  assert.doesNotMatch(workspace, /id="page-reports"/);
  assert.doesNotMatch(workspace, /id="rep-revenue"/);
  assert.doesNotMatch(workspace, /id="reports-table"/);
  assert.match(reports, /export function OpsReportsPage\(/);
  assert.doesNotMatch(reports, /@ts-nocheck/);
  assert.doesNotMatch(reports, /runInlineAction/);
  assert.match(reports, /id="page-reports"/);
  assert.match(reports, /Owner Reports/);
  assert.match(reports, /id="rep-revenue"/);
  assert.match(reports, /id="reports-revenue-bars"/);
  assert.match(reports, /id="reports-table"/);
  assert.match(reports, /onClick=\{exportReportsCsv\}/);
});

test('ops bookings page is split into a named typed component', () => {
  const workspace = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');
  const bookings = readText('src/features/ops/components/OpsBookingsPage.tsx');

  assert.match(workspace, /import \{ OpsBookingsPage \} from '\.\/OpsBookingsPage';/);
  assert.match(workspace, /<OpsBookingsPage \/>/);
  assert.doesNotMatch(workspace, /id="page-bookings"/);
  assert.doesNotMatch(workspace, /id="booking-calendar-grid"/);
  assert.doesNotMatch(workspace, /id="bookings-table"/);
  assert.match(bookings, /export function OpsBookingsPage\(/);
  assert.doesNotMatch(bookings, /@ts-nocheck/);
  assert.doesNotMatch(bookings, /runInlineAction/);
  assert.match(bookings, /id="page-bookings"/);
  assert.match(bookings, /All Bookings/);
  assert.match(bookings, /placeholder="Search bookings\.\.\."/);
  assert.match(bookings, /id="booking-period-filter"/);
  assert.match(bookings, /id="booking-calendar-grid"/);
  assert.match(bookings, /id="calendar-agenda-list"/);
  assert.match(bookings, /id="bookings-table"/);
});

test('ops invoices page is split into a named typed component', () => {
  const workspace = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');
  const invoices = readText('src/features/ops/components/OpsInvoicesPage.tsx');

  assert.match(workspace, /import \{ OpsInvoicesPage \} from '\.\/OpsInvoicesPage';/);
  assert.match(workspace, /<OpsInvoicesPage \/>/);
  assert.doesNotMatch(workspace, /id="page-invoices"/);
  assert.doesNotMatch(workspace, /id="invoice-date-basis"/);
  assert.doesNotMatch(workspace, /id="invoice-table"/);
  assert.match(invoices, /export function OpsInvoicesPage\(/);
  assert.doesNotMatch(invoices, /@ts-nocheck/);
  assert.doesNotMatch(invoices, /runInlineAction/);
  assert.match(invoices, /id="page-invoices"/);
  assert.match(invoices, /<h2>Invoices<\/h2>/);
  assert.match(invoices, /placeholder="Search invoices\.\.\."/);
  assert.match(invoices, /id="invoice-date-basis"/);
  assert.match(invoices, /id="invoice-import-input"/);
  assert.match(invoices, /id="invoice-kpi-count"/);
  assert.match(invoices, /id="invoice-table"/);
});

test('ops sidebar navigation uses typed page callbacks and explicit page metadata', () => {
  const sidebar = readText('src/features/ops/components/OpsSidebar.tsx');
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');

  assert.doesNotMatch(sidebar, /@ts-nocheck/);
  assert.doesNotMatch(sidebar, /runInlineAction/);
  assert.match(sidebar, /data-page="dashboard"/);
  assert.match(sidebar, /data-page="bookings"/);
  assert.match(sidebar, /data-page="system"/);
  assert.doesNotMatch(runtime, /getAttribute\('onclick'\)/);
  assert.doesNotMatch(runtime, /\.nav-item\[onclick\*=/);
  assert.match(runtime, /element\.dataset\.page/);
  assert.match(runtime, /\.nav-item\[data-page="dashboard"\]/);
}
);

test('ops dashboard topbar controls use typed callbacks', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  assert.doesNotMatch(dashboard, /runInlineAction\(event\.currentTarget, "toggleMobileNav\(\)"\)/);
  assert.doesNotMatch(dashboard, /id="logout-btn"[\s\S]{0,160}runInlineAction\(event\.currentTarget, "logout\(\)"\)/);
  assert.doesNotMatch(dashboard, /id="topbar-booking-action"[\s\S]{0,180}runInlineAction\(event\.currentTarget, "openBookingModal\(\)"\)/);
});

test('ops dashboard report and booking controls use typed callbacks', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  [
    "showPage('bookings'",
    'exportReportsCsv()',
    "filterTable(this,'bookings-table')",
    "filterByStatus('all',this)",
    "filterByStatus('confirmed',this)",
    "filterByStatus('pending',this)",
    "filterByStatus('completed',this)",
    "filterByStatus('noshow',this)",
    'updateBookingFilters()',
    'shiftCalendarMonth(-1)',
    'shiftCalendarMonth(1)'
  ].forEach((action) => {
    assert.doesNotMatch(dashboard, new RegExp(`runInlineAction\\(event\\.currentTarget, "${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
});

test('ops invoice controls use typed callbacks', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  [
    'filterInvoices(this)',
    'openInvoiceModal()',
    'triggerInvoiceImport()',
    'updateInvoiceFilters()',
    'exportInvoicesCsv()',
    'recalcAllInvoices()',
    'handleInvoiceImport(event)'
  ].forEach((action) => {
    assert.doesNotMatch(dashboard, new RegExp(`runInlineAction\\(event\\.currentTarget, "${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
});

test('ops CRM and waiver controls use typed callbacks', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  [
    'filterCRM(this)',
    'triggerCRMImport()',
    "openModal('crm-paste-modal')",
    'cleanupEmptyCustomers()',
    'openCustomerModal()',
    'handleCRMImport(event)',
    'setCRMSort(this.value)',
    "setCRMFilter('all', this)",
    "setCRMFilter('followup', this)",
    "setCRMFilter('waiver', this)",
    "setCRMFilter('best', this)",
    'filterWaivers(this)',
    "showPage('crm'"
  ].forEach((action) => {
    assert.doesNotMatch(dashboard, new RegExp(`runInlineAction\\(event\\.currentTarget, "${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
});

test('ops expense maintenance and tracking controls use typed callbacks', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  [
    'openExpenseModal()',
    'openMaintModal()',
    'openTrackerModal()'
  ].forEach((action) => {
    assert.doesNotMatch(dashboard, new RegExp(`runInlineAction\\(event\\.currentTarget, "${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
});

test('ops communication controls use typed callbacks', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  [
    'renderCommsPanel()',
    "sendDirectMessage('sms')",
    "sendDirectMessage('email')",
    'logCommunication()',
    'setMassEmailAudienceMode(this.value)',
    'renderMassEmailDraft()',
    'filterMassEmailRecipients(this)',
    "applyMassEmailQuickSelect('visible')",
    "applyMassEmailQuickSelect('vip')",
    "applyMassEmailQuickSelect('followup')",
    "applyMassEmailQuickSelect('clear')",
    'sendMassEmail()'
  ].forEach((action) => {
    assert.doesNotMatch(dashboard, new RegExp(`runInlineAction\\(event\\.currentTarget, "${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
});

test('ops review social and reminder controls use typed callbacks', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  [
    'saveReviewSettings()',
    'sendReviewBlast()',
    'saveSocialDraft()',
    'publishSocialNow()',
    'copySocialCaption()',
    "switchReminderTab('overdue',this)",
    "switchReminderTab('upcoming',this)",
    "switchReminderTab('campaigns',this)"
  ].forEach((action) => {
    assert.doesNotMatch(dashboard, new RegExp(`runInlineAction\\(event\\.currentTarget, "${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
});

test('ops dashboard component no longer depends on generated inline action bridge', () => {
  const dashboard = readText('src/features/ops/components/OpsDashboardWorkspace.tsx');

  assert.doesNotMatch(dashboard, /@ts-nocheck/);
  assert.doesNotMatch(dashboard, /runInlineAction/);
});

test('ops client behavior no longer imports shared generated script bridges', () => {
  const behavior = readText('src/features/ops/OpsClientBehavior.tsx');

  assert.doesNotMatch(behavior, /RunClientScripts/);
  assert.doesNotMatch(behavior, /client-scripts/);
  assert.equal(existsSync('src/lib/react/client-scripts.tsx'), false);
  assert.equal(existsSync('src/lib/react/inline-action.ts'), false);
});

test('ops client behavior delegates runtime mounting without serialized scripts', () => {
  const behavior = readText('src/features/ops/OpsClientBehavior.tsx');

  assert.match(behavior, /mountOpsRuntime/);
  assert.doesNotMatch(behavior, /CLIENT_SCRIPTS/);
  assert.doesNotMatch(behavior, /JSON\.parse/);
  assert.doesNotMatch(behavior, /eval\(/);
  assert.ok(existsSync('src/features/ops/runtime/opsRuntime.ts'));
});

test('ops runtime is an explicit module instead of a serialized eval bridge', () => {
  const runtime = [
    readText('src/features/ops/runtime/opsRuntime.ts'),
    readText('src/features/ops/runtime/opsRuntime.client.js')
  ].join('\n');

  assert.match(runtime, /export function mountOpsRuntime/);
  assert.doesNotMatch(runtime, /OPS_RUNTIME_SCRIPTS/);
  assert.doesNotMatch(runtime, /eval\(/);
  assert.doesNotMatch(runtime, /Function\(/);
});

test('ops booking status normalization lives in a typed domain module', async () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const modulePath = pathToFileURL(`${process.cwd()}/src/features/ops/runtime/domain/bookingStatus.ts`).href;
  const bookingStatus = await import(modulePath);

  assert.deepEqual(bookingStatus.CANONICAL_BOOKING_STATUSES, ['pending', 'confirmed', 'completed', 'noshow', 'cancelled', 'draft']);
  assert.equal(bookingStatus.normalizeBookingStatusValue('no-show'), 'noshow');
  assert.equal(bookingStatus.normalizeBookingStatusValue('No Show'), 'noshow');
  assert.equal(bookingStatus.normalizeBookingStatusValue('canceled'), 'cancelled');
  assert.equal(bookingStatus.normalizeBookingStatusValue('  PARTIALLY_PAID  '), 'partially paid');
  assert.match(runtime, /from ['"]\.\/domain\/bookingStatus\.ts['"]/);
  assert.doesNotMatch(runtime, /function normalizeBookingStatusValue\(/);
  assert.doesNotMatch(runtime, /const CANONICAL_BOOKING_STATUSES = new Set/);
});

test('ops invoice status normalization lives in a typed domain module', async () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const modulePath = pathToFileURL(`${process.cwd()}/src/features/ops/runtime/domain/invoiceStatus.ts`).href;
  const invoiceStatus = await import(modulePath);

  assert.equal(invoiceStatus.normalizeInvoiceStatus('paid in full'), 'paid');
  assert.equal(invoiceStatus.normalizeInvoiceStatus('fully_paid'), 'paid');
  assert.equal(invoiceStatus.normalizeInvoiceStatus('partial-paid'), 'partially paid');
  assert.equal(invoiceStatus.normalizeInvoiceStatus('over due'), 'overdue');
  assert.equal(invoiceStatus.normalizeInvoiceStatus('canceled'), 'cancelled');
  assert.match(runtime, /from ['"]\.\/domain\/invoiceStatus\.ts['"]/);
  assert.doesNotMatch(runtime, /function normalizeInvoiceStatus\(/);
});

test('ops tracker normalization lives in a typed domain module', async () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const modulePath = pathToFileURL(`${process.cwd()}/src/features/ops/runtime/domain/tracker.ts`).href;
  const tracker = await import(modulePath);

  assert.equal(tracker.trackerStatusValue(' Active '), 'active');
  assert.equal(tracker.trackerSerialKey('  ABC-123 '), 'abc-123');
  assert.equal(tracker.normalizeTrackerShareUrl('sharespot.example/live'), 'https://sharespot.example/live');
  assert.equal(tracker.normalizeTrackerShareUrl('https://sharespot.example/live'), 'https://sharespot.example/live');
  assert.equal(tracker.normalizeTrackerShareUrl(''), '');
  assert.equal(tracker.trackerDateTimeInputValue('2026-07-04T10:30:15.000Z'), '2026-07-04T10:30');
  assert.equal(tracker.trackerDateTimeInputValue(''), '');
  assert.match(runtime, /from ['"]\.\/domain\/tracker\.ts['"]/);
  assert.doesNotMatch(runtime, /function trackerStatusValue\(/);
  assert.doesNotMatch(runtime, /function trackerSerialKey\(/);
  assert.doesNotMatch(runtime, /function normalizeTrackerShareUrl\(/);
  assert.doesNotMatch(runtime, /function trackerDateTimeInputValue\(/);
});

test('ops text and contact normalization lives in a typed utility module', async () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const modulePath = pathToFileURL(`${process.cwd()}/src/features/ops/runtime/domain/text.ts`).href;
  const text = await import(modulePath);

  assert.equal(text.shortText('  A long customer note  ', 8), 'A long …');
  assert.equal(text.shortText('Short', 8), 'Short');
  assert.equal(text.phoneHref('(469) 693-7164'), '4696937164');
  assert.equal(text.firstName('  Sam Lake  '), 'Sam');
  assert.equal(text.firstName(''), 'there');
  assert.equal(text.initials('Sam Lake'), 'SL');
  assert.equal(text.initials(''), '?');
  assert.equal(text.normalizePhone('+1 (469) 693-7164'), '4696937164');
  assert.equal(text.normalizeEmail(' OWNER@SLAQUATICS.COM '), 'owner@slaquatics.com');
  assert.deepEqual(text.uniqueValues(['Boat', '', 'Boat', 'Jet Ski']), ['Boat', 'Jet Ski']);
  assert.equal(text.normalizeName('Sam-Lake Jr.'), 'sam lake jr');
  assert.match(runtime, /from ['"]\.\/domain\/text\.ts['"]/);
  assert.doesNotMatch(runtime, /function shortText\(/);
  assert.doesNotMatch(runtime, /function phoneHref\(/);
  assert.doesNotMatch(runtime, /function firstName\(/);
  assert.doesNotMatch(runtime, /function initials\(/);
  assert.doesNotMatch(runtime, /function normalizePhone\(/);
  assert.doesNotMatch(runtime, /function normalizeEmail\(/);
  assert.doesNotMatch(runtime, /function uniqueValues\(/);
  assert.doesNotMatch(runtime, /function normalizeName\(/);
});

test('ops date and time formatting lives in a typed utility module', async () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const modulePath = pathToFileURL(`${process.cwd()}/src/features/ops/runtime/domain/dateTime.ts`).href;
  const dateTime = await import(modulePath);

  const localDate = new Date(2026, 6, 4, 15, 30);
  assert.deepEqual(dateTime.localDateParts('2026-07-04'), {year: 2026, month: 6, day: 4});
  assert.equal(dateTime.localDateParts('TBD'), null);
  assert.equal(dateTime.isoFromDate(localDate), '2026-07-04');
  assert.equal(dateTime.parseIsoDate('2026-07-04')?.getFullYear(), 2026);
  assert.equal(dateTime.inputDateValue('2026-07-04'), '2026-07-04');
  assert.equal(dateTime.inputDateValue('TBD'), '');
  assert.equal(dateTime.formatShortDate('2026-07-04'), '7/4/2026');
  assert.equal(dateTime.formatShortDate('TBD'), '—');
  assert.equal(dateTime.isoDate('07/04/2026 3:30 PM'), '2026-07-04');
  assert.equal(dateTime.formatTime('3:30 PM'), '15:30');
  assert.equal(dateTime.formatTime('bad'), '10:00');
  assert.equal(dateTime.formatTimeLabel('15:30'), '3:30 PM');
  assert.equal(dateTime.formatTimeLabel('bad'), 'bad');
  assert.match(runtime, /from ['"]\.\/domain\/dateTime\.ts['"]/);
  assert.doesNotMatch(runtime, /function parseFlexibleDate\(/);
  assert.doesNotMatch(runtime, /function isoDate\(/);
  assert.doesNotMatch(runtime, /function formatTime\(/);
  assert.doesNotMatch(runtime, /function formatTimeLabel\(/);
  assert.doesNotMatch(runtime, /function dateValue\(/);
  assert.doesNotMatch(runtime, /function localDateParts\(/);
  assert.doesNotMatch(runtime, /function isoFromDate\(/);
  assert.doesNotMatch(runtime, /function parseIsoDate\(/);
  assert.doesNotMatch(runtime, /function inputDateValue\(/);
  assert.doesNotMatch(runtime, /function formatShortDate\(/);
});

test('crew schedule runtime actions use delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const crewSlice = runtime.slice(runtime.indexOf('function crewCard'), runtime.indexOf('const EMPLOYEE_PAGES'));

  assert.match(crewSlice, /data-crew-action="arrived"/);
  assert.match(crewSlice, /data-crew-action="done"/);
  assert.doesNotMatch(crewSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-crew-action\]'\)/);
});

test('dashboard booking widgets use delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const dashboardBookingSlice = runtime.slice(runtime.indexOf('function runSheetActions'), runtime.indexOf('// ── RENDER ALL BOOKINGS ──'));

  assert.match(dashboardBookingSlice, /data-dashboard-booking-action="collect"/);
  assert.match(dashboardBookingSlice, /data-dashboard-booking-action="confirm"/);
  assert.match(dashboardBookingSlice, /data-dashboard-booking-action="done"/);
  assert.match(dashboardBookingSlice, /data-dashboard-booking-action="review"/);
  assert.match(dashboardBookingSlice, /data-dashboard-booking-action="edit"/);
  assert.doesNotMatch(dashboardBookingSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-dashboard-booking-action\]'\)/);
});

test('booking page calendar and table use delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const bookingPageSlice = runtime.slice(runtime.indexOf('function renderBookingAgenda'), runtime.indexOf('function filterByStatus'));

  assert.match(bookingPageSlice, /data-booking-page-action="edit"/);
  assert.match(bookingPageSlice, /data-booking-page-action="deposit"/);
  assert.match(bookingPageSlice, /data-calendar-date=/);
  assert.doesNotMatch(bookingPageSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-booking-page-action\], \[data-calendar-date\]'\)/);
});

test('tracking runtime uses delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const trackingSlice = runtime.slice(runtime.indexOf('function renderTracking'), runtime.indexOf('async function saveTracker'));

  assert.match(trackingSlice, /data-tracking-action="edit"/);
  assert.match(trackingSlice, /data-tracking-action="delete"/);
  assert.match(trackingSlice, /data-tracking-action="live-map"/);
  assert.match(trackingSlice, /data-tracking-action="refresh"/);
  assert.doesNotMatch(trackingSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-tracking-action\]'\)/);
});

test('invoice runtime uses delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const invoiceSlice = runtime.slice(runtime.indexOf('function renderInvoices'), runtime.indexOf('// ── CRM ──'));

  assert.match(invoiceSlice, /data-invoice-action="paid"/);
  assert.match(invoiceSlice, /data-invoice-action="review"/);
  assert.match(invoiceSlice, /data-invoice-action="edit"/);
  assert.match(invoiceSlice, /data-invoice-action="delete"/);
  assert.doesNotMatch(invoiceSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-invoice-action\]'\)/);
});

test('invoice delete uses a named confirmation modal and persists actual invoice removal', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const modal = readText('src/features/ops/components/OpsConfirmModal.tsx');
  const actions = readText('src/features/ops/opsGlobalActions.ts');
  const deleteSlice = runtime.slice(runtime.indexOf('function invoiceDeletionSummary'), runtime.indexOf('function triggerCRMImport'));

  assert.match(modal, /id="ops-confirm-modal"/);
  assert.match(modal, /id="ops-confirm-detail-title"/);
  assert.match(actions, /resolveOpsConfirm/);
  assert.match(actions, /cancelOpsConfirm/);
  assert.match(deleteSlice, /requestOpsConfirm/);
  assert.match(deleteSlice, /openInvoiceDeleteModal/);
  assert.match(deleteSlice, /invoices = invoices\.filter/);
  assert.match(deleteSlice, /linkedBooking\.invoiceSuppressed = true/);
  assert.doesNotMatch(deleteSlice, /window\.confirm/);
});

test('ops confirmations use the shared modal instead of native browser confirms', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const page = readText('src/features/ops/OpsPage.tsx');
  const modal = readText('src/features/ops/components/OpsConfirmModal.tsx');

  assert.match(page, /<OpsConfirmModal \/>/);
  assert.match(modal, /id="ops-confirm-modal"/);
  assert.match(runtime, /function requestOpsConfirm/);
  assert.match(runtime, /function resolveOpsConfirm/);
  assert.match(runtime, /function cancelOpsConfirm/);
  assert.doesNotMatch(runtime, /window\.confirm/);
  assert.doesNotMatch(runtime, /(^|[^A-Za-z])confirm\(/);
});

test('CRM and waiver customer actions use delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const customerSlice = runtime.slice(runtime.indexOf('function renderWaivers'), runtime.indexOf('async function saveCustomer'));

  assert.match(customerSlice, /data-customer-action="toggle"/);
  assert.match(customerSlice, /data-customer-action="rebook"/);
  assert.match(customerSlice, /data-customer-action="payment"/);
  assert.match(customerSlice, /data-customer-action="invoice"/);
  assert.match(customerSlice, /data-customer-action="edit"/);
  assert.match(customerSlice, /data-customer-action="delete"/);
  assert.doesNotMatch(customerSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-customer-action\]'\)/);
});

test('expense runtime uses delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const expenseSlice = runtime.slice(runtime.indexOf('function renderExpenses'), runtime.indexOf('async function saveExpense'));

  assert.match(expenseSlice, /data-expense-action="edit"/);
  assert.match(expenseSlice, /data-expense-action="delete"/);
  assert.doesNotMatch(expenseSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-expense-action\]'\)/);
});

test('review and social runtime uses delegated data handlers instead of inline onclick', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');
  const reviewSocialSlice = runtime.slice(runtime.indexOf('function renderReviewHub'), runtime.indexOf('// ── FUEL ──'));

  assert.match(reviewSocialSlice, /data-review-action="send-text"/);
  assert.match(reviewSocialSlice, /data-review-action="send-email"/);
  assert.match(reviewSocialSlice, /data-review-action="complete"/);
  assert.match(reviewSocialSlice, /data-review-action="toggle-responded"/);
  assert.match(reviewSocialSlice, /data-social-action="copy-saved"/);
  assert.doesNotMatch(reviewSocialSlice, /onclick=/);
  assert.match(runtime, /closest\('\[data-review-action\], \[data-social-action\]'\)/);
});

test('ops runtime does not render inline onclick handlers', () => {
  const runtime = readText('src/features/ops/runtime/opsRuntime.client.js');

  assert.doesNotMatch(runtime, /onclick=/);
});

test('all migrated routes are composed from feature components, not LegacyHtml', () => {
  const routes = [
    'booking-thank-you',
    'jet-ski-rental-denton',
    'jet-ski-rental-frisco',
    'jet-ski-rental-lewisville',
    'jetski-booking',
    'jetski-booking-confirmation',
    'privacy-policy',
    'waiver',
    'ops-login',
    'ops'
  ];

  for (const route of routes) {
    const pagePath = `src/app/${route}/page.tsx`;
    const page = readText(pagePath);
    assert.doesNotMatch(page, /LegacyHtml/, `${pagePath} should not import the temporary legacy wrapper`);
    assert.match(page, /<.+Page \/>/, `${pagePath} should render a named feature page component`);
  }
});

test('temporary legacy HTML wrapper has been removed after route conversion', () => {
  assert.equal(existsSync('src/app/legacy-html.tsx'), false);
  assert.equal(existsSync('src/lib/legacy/html-source.ts'), false);
});

test('legacy Render static source is isolated under legacy folder', () => {
  [
    'index.html',
    'server.js',
    'render.yaml',
    'data/ops-store.json',
    'ops.html',
    'ops-login.html',
    'ops-sw.js',
    'ops-app.webmanifest',
    'jetski-booking/index.html',
    'jetski-booking-confirmation/index.html',
    'booking-thank-you/index.html',
    'waiver/index.html',
    'privacy-policy/index.html',
    'jet-ski-rental-denton/index.html',
    'jet-ski-rental-frisco/index.html',
    'jet-ski-rental-lewisville/index.html'
  ].forEach((file) => {
    assert.equal(existsSync(file), false, `${file} should not remain at the repo root`);
    assert.ok(existsSync(`legacy/render/${file}`), `${file} should be archived under legacy/render`);
  });
  assert.ok(existsSync('legacy/shoreline-package/source'), 'duplicated Shoreline launch package should be archived under legacy');
  assert.ok(existsSync('legacy/render/package.json'), 'legacy Render server should keep local package metadata');
});

test('generated Next and OpenNext output are ignored', () => {
  const gitignore = readText('.gitignore');

  assert.match(gitignore, /^\.next\/$/m);
  assert.match(gitignore, /^\.open-next\/$/m);
});

test('route handlers use the default OpenNext runtime instead of forcing edge runtime', () => {
  const routeFiles = [
    'src/app/api/health/route.ts',
    'src/app/api/public/availability/route.ts',
    'src/app/api/public/integrations/status/route.ts'
  ];

  for (const file of routeFiles) {
    assert.doesNotMatch(readText(file), /runtime\s*=\s*['"]edge['"]/, `${file} should not force edge runtime`);
  }
});

test('migrated styles and JSON-LD use centralized safe boundaries', () => {
  const styleFiles = [
    'src/features/home/HomeStyles.tsx',
    ...[
      'bookingThankYou',
      'jetSkiRentalDenton',
      'jetSkiRentalFrisco',
      'jetSkiRentalLewisville',
      'jetskiBooking',
      'jetskiBookingConfirmation',
      'privacyPolicy',
      'waiver',
      'opsLogin',
      'ops'
    ].map((feature) => {
      const pascal = feature.replace(/(^|[A-Z])/g, (match, index) => index === 0 ? match.toUpperCase() : match);
      return `src/features/${feature}/${pascal}Styles.tsx`;
    }).filter(existsSync)
  ];
  for (const file of styleFiles) {
    const source = readText(file);
    assert.match(source, /import ['"].+Styles\.css['"]/, `${file} should import a real CSS file`);
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/, `${file} should not inject raw CSS`);
    assert.doesNotMatch(source, /<style/, `${file} should not render inline style tags`);
  }

  assert.equal(rgCount('src/features', /webkit-playsinline/g), 0);
  assert.equal(rgCount('src/features', /<script(?![^>]*async)[^>]*type="application\/ld\+json"/gs), 0);
  const jsonLdHelper = readText('src/features/JsonLdStructuredData.tsx');
  assert.match(jsonLdHelper, /from ['"]next\/head['"]/, 'Shared JSON-LD helper should emit through Next head management');
  assert.match(jsonLdHelper, /dangerouslySetInnerHTML/, 'Shared JSON-LD helper is the only approved raw HTML boundary');
  for (const file of readdirSync('src/features', { recursive: true })
    .filter((name) => String(name).endsWith('StructuredData.tsx'))
    .map((name) => `src/features/${name}`)) {
    const source = readText(file);
    assert.match(source, /JsonLdStructuredData/, `${file} should use the shared JSON-LD helper`);
    if (file !== 'src/features/JsonLdStructuredData.tsx') {
      assert.doesNotMatch(source, /dangerouslySetInnerHTML/, `${file} should not define its own raw JSON-LD boundary`);
    }
    assert.doesNotMatch(source, /<head>/, `${file} should not render a raw nested head element`);
  }
});

test('active feature source avoids scattered raw HTML execution patterns', () => {
  for (const name of readdirSync('src/features', { recursive: true })) {
    const file = `src/features/${name}`;
    if (!/\.(tsx?|jsx?)$/.test(file) || !existsSync(file) || statSync(file).isDirectory()) continue;
    const source = readText(file);
    if (file !== 'src/features/JsonLdStructuredData.tsx') {
      assert.doesNotMatch(source, /dangerouslySetInnerHTML/, `${file} should not use dangerouslySetInnerHTML`);
    }
    assert.doesNotMatch(source, /\.innerHTML\s*=/, `${file} should not assign innerHTML`);
    assert.doesNotMatch(source, /<[^>]*\son(?:click|error|load)\s*=/, `${file} should not render inline event handler attributes`);
    assert.doesNotMatch(source, /document\.write\s*\(/, `${file} should not call document.write`);
    assert.doesNotMatch(source, /\beval\s*\(/, `${file} should not call eval`);
    assert.doesNotMatch(source, /\bnew\s+Function\s*\(/, `${file} should not use Function constructor`);
    assert.doesNotMatch(source, /\.insertAdjacentHTML\s*\(/, `${file} should not call insertAdjacentHTML`);
    assert.doesNotMatch(source, /\.outerHTML\s*=/, `${file} should not assign outerHTML`);
    assert.doesNotMatch(source, /\bsrcdoc\b/i, `${file} should not use srcdoc`);
  }
});

test('migrated components avoid React dev overlay warning patterns', () => {
  assert.equal(rgCount('src/features', /from ['"]next\/script['"]/g), 0);
  assert.equal(rgCount('src/features', /\soninput=/g), 0);
  assert.equal(rgCount('src/features', /\sselected[=>]/g), 0);
});

test('active media is CDN-backed and not bundled into the Worker static assets tree', () => {
  assert.equal(existsSync('public/assets'), false, 'CDN media should not be committed under public/assets');
  assert.ok(existsSync('media-source/README.md'), 'ignored local staging instructions should exist');
  assert.ok(existsSync('legacy/render/ops-sw.js'), 'legacy source service worker should remain archived');
  assert.ok(existsSync('public/ops-sw.js'), '/ops-sw.js should resolve in Next');
  assert.ok(existsSync('legacy/render/ops-app.webmanifest'), 'legacy source ops manifest should remain archived');
  assert.ok(existsSync('public/ops-app.webmanifest'), '/ops-app.webmanifest should resolve in Next');
  assert.ok(existsSync('public/favicon.ico'), '/favicon.ico should resolve in Next');
});
