'use client';

import { useEffect, useRef } from 'react';

type CustomerLookup = {
  found?: boolean;
  customer?: {
    name?: string;
    dateOfBirth?: string;
    waiverInitials?: string;
    waiverSignature?: string;
  };
};

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const input = (id: string) => byId<HTMLInputElement>(id);
const checkbox = (id: string) => byId<HTMLInputElement>(id);

function todayLocalIso() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function normalizePhoneKey(value = '') {
  return String(value).replace(/\D/g, '');
}

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') };
}

function buildPayload() {
  return {
    firstName: input('first-name')?.value.trim() || '',
    lastName: input('last-name')?.value.trim() || '',
    phone: input('phone')?.value.trim() || '',
    email: input('email')?.value.trim() || '',
    dateOfBirth: input('date-of-birth')?.value || '',
    initials: input('initials')?.value.trim() || '',
    acceptedAgreement: checkbox('accepted-agreement')?.checked || false,
    verified: checkbox('verified')?.checked || false,
    signature: input('signature')?.value.trim() || '',
    signatureDate: input('signature-date')?.value || ''
  };
}

function createWaiverController(signal: AbortSignal) {
  let lastLookupKey = '';
  let waiverSubmitting = false;

  const lookupExistingRider = async (force = false) => {
    const phone = input('phone')?.value.trim() || '';
    const email = input('email')?.value.trim() || '';
    if (!phone && !email) return;
    const lookupKey = `${normalizePhoneKey(phone)}|${normalizeEmail(email)}`;
    if (!force && lookupKey === lastLookupKey) return;
    lastLookupKey = lookupKey;
    try {
      const params = new URLSearchParams();
      if (phone) params.set('phone', phone);
      if (email) params.set('email', email);
      const response = await fetch(`/api/public/customer-lookup?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal
      });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({})) as CustomerLookup;
      if (!payload.found || !payload.customer) return;
      const nameParts = splitName(payload.customer.name);
      if (!input('first-name')?.value.trim()) input('first-name')!.value = nameParts.first;
      if (!input('last-name')?.value.trim()) input('last-name')!.value = nameParts.last;
      if (!input('date-of-birth')?.value) input('date-of-birth')!.value = payload.customer.dateOfBirth || '';
      if (!input('initials')?.value.trim()) input('initials')!.value = payload.customer.waiverInitials || '';
      if (!input('signature')?.value.trim()) input('signature')!.value = payload.customer.waiverSignature || payload.customer.name || '';
    } catch (error) {
      console.warn('Waiver lookup skipped:', error);
    }
  };

  const populateSignatureDefaults = () => {
    const first = input('first-name')?.value.trim() || '';
    const last = input('last-name')?.value.trim() || '';
    if (!input('initials')?.value.trim()) input('initials')!.value = `${first[0] || ''}${last[0] || ''}`.toUpperCase();
    if (!input('signature')?.value.trim() && (first || last)) input('signature')!.value = `${first}${last ? ` ${last}` : ''}`.trim();
  };

  const submitWaiver = async (event: Event) => {
    event.preventDefault();
    const form = byId<HTMLFormElement>('waiver-form');
    if (form && typeof form.checkValidity === 'function' && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (waiverSubmitting) return;
    waiverSubmitting = true;
    const submitButton = ((event as SubmitEvent).submitter || form?.querySelector('[type="submit"]')) as HTMLButtonElement | null;
    if (submitButton) submitButton.disabled = true;
    const status = byId('waiver-status');
    let succeeded = false;
    if (status) {
      status.textContent = 'Saving your waiver...';
      status.classList.remove('success');
    }
    try {
      const response = await fetch('/api/public/waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildPayload()),
        signal
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'We could not save your waiver right now.');
      succeeded = true;
      if (status) {
        status.textContent = 'Waiver saved successfully.';
        status.classList.add('success');
      }
      byId('success-card')?.classList.add('show');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error ? error.message : 'We could not save your waiver right now.';
        status.classList.remove('success');
      }
    } finally {
      waiverSubmitting = false;
      if (submitButton && !succeeded) submitButton.disabled = false;
    }
  };

  const initTermsOnlyMode = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') !== 'terms') return;
    const formColumn = document.querySelector<HTMLElement>('.form-column');
    const contentGrid = document.querySelector<HTMLElement>('.content-grid');
    const heroCopy = document.querySelector<HTMLElement>('.hero-copy');
    const heroTitle = document.querySelector<HTMLElement>('.hero-card h1');
    const bookingButton = document.querySelector<HTMLElement>('.top-actions .btn-ghost');
    if (formColumn) formColumn.hidden = true;
    if (contentGrid) contentGrid.classList.add('terms-only');
    if (heroTitle) {
      const accent = document.createElement('span');
      accent.className = 'accent';
      accent.textContent = 'Waiver Terms';
      heroTitle.replaceChildren('Full Shoreline ', accent);
    }
    if (heroCopy) heroCopy.textContent = 'Read the full waiver terms below. Return to booking when you are ready to sign and pay the deposit.';
    if (bookingButton) bookingButton.textContent = 'Back to Booking';
    const terms = byId('terms');
    if (terms) requestAnimationFrame(() => terms.scrollIntoView({ block: 'start' }));
  };

  input('phone')?.addEventListener('blur', () => { void lookupExistingRider(); }, { signal });
  input('email')?.addEventListener('blur', () => { void lookupExistingRider(); }, { signal });
  input('first-name')?.addEventListener('blur', populateSignatureDefaults, { signal });
  input('last-name')?.addEventListener('blur', populateSignatureDefaults, { signal });
  byId<HTMLFormElement>('waiver-form')?.addEventListener('submit', submitWaiver, { signal });
  if (input('signature-date')) input('signature-date')!.value = todayLocalIso();
  initTermsOnlyMode();
}

export function WaiverClientBehavior() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();
    createWaiverController(controller.signal);
    return () => controller.abort();
  }, []);

  return null;
}
