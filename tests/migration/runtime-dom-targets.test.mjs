import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readText = (file) => readFileSync(file, 'utf8');

function assertContainsId(source, id, file) {
  assert.match(source, new RegExp(`id="${id}"|id='${id}'`), `${file} should render #${id}`);
}

test('booking confirmation markup restores waiver payment runtime targets', () => {
  const pageFile = 'src/features/jetskiBookingConfirmation/JetskiBookingConfirmationPage.tsx';
  const formFile = 'src/features/jetskiBookingConfirmation/components/JetskiBookingConfirmationForm.tsx';
  const summaryFile = 'src/features/jetskiBookingConfirmation/components/JetskiBookingConfirmationSummary.tsx';
  const emptyFile = 'src/features/jetskiBookingConfirmation/components/JetskiBookingConfirmationEmptyState.tsx';
  const pageSource = readText(pageFile);
  const formSource = readText(formFile);
  const summarySource = readText(summaryFile);
  const emptySource = readText(emptyFile);

  assertContainsId(pageSource, 'request-wrap', pageFile);

  [
    'waiver-payment-form',
    'match-card',
    'name',
    'phone',
    'email',
    'date-of-birth',
    'party-size',
    'waiver-risk',
    'waiver-damage',
    'waiver-verify',
    'waiver-initials',
    'signature',
    'signature-date',
    'copy-status',
    'stripe-link'
  ].forEach((id) => {
    assertContainsId(formSource, id, formFile);
  });

  ['summary-total', 'summary-package', 'summary-date', 'summary-time', 'summary-party', 'summary-payment-status'].forEach((id) => {
    assertContainsId(summarySource, id, summaryFile);
  });

  ['empty-state', 'empty-calendar-link'].forEach((id) => {
    assertContainsId(emptySource, id, emptyFile);
  });
});

test('ops maintenance page restores fuel KPI and log runtime targets', () => {
  const file = 'src/features/ops/components/OpsDashboardWorkspace.tsx';
  const source = readText(file);

  [
    'fuel-kpi-month',
    'fuel-kpi-month-meta',
    'fuel-kpi-rate',
    'fuel-kpi-rate-meta',
    'fuel-kpi-hours',
    'fuel-kpi-hours-meta',
    'fuel-log'
  ].forEach((id) => {
    assertContainsId(source, id, file);
  });
});

test('invoice modal restores rental helper runtime target', () => {
  const file = 'src/features/ops/components/OpsInvoiceModal.tsx';
  const source = readText(file);

  assertContainsId(source, 'invoice-rental-helper', file);
});
