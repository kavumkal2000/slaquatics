'use client';

import { CANONICAL_BOOKING_STATUSES, normalizeBookingStatusValue } from './domain/bookingStatus.ts';
import { dateValue, formatShortDate, formatTime, formatTimeLabel, inputDateValue, isoDate, isoFromDate, localDateParts, parseBookingTimeParts, parseFlexibleDate, parseIsoDate } from './domain/dateTime.ts';
import { normalizeInvoiceStatus } from './domain/invoiceStatus.ts';
import { firstName, initials, normalizeEmail, normalizeName, normalizePhone, phoneHref, shortText, uniqueValues } from './domain/text.ts';
import { normalizeTrackerShareUrl, trackerDateTimeInputValue, trackerSerialKey, trackerStatusValue } from './domain/tracker.ts';

let mounted = false;

export function mountOpsRuntimeClient() {
  if (mounted) return;
  mounted = true;
  runOpsRuntime();
}

function runOpsRuntime() {
  const LOCAL_KEYS = {
    bookings: 'sla_bookings',
    customers: 'sla_customers',
    expenses: 'sla_expenses',
    fuelLog: 'sla_fuel',
    maintLog: 'sla_maint',
    trackers: 'sla_trackers',
    invoices: 'sla_invoices',
    communicationsLog: 'sla_comms',
    reviewRequests: 'sla_review_requests',
    reviews: 'sla_reviews',
    socialPosts: 'sla_social_posts',
    importMeta: 'sla_import_meta',
    invoiceImportMeta: 'sla_invoice_import_meta'
  };
  let backendAvailable = false;
  let integrations = {
    smsConfigured: false,
    emailConfigured: false,
    reviewLinksConfigured: false,
    reviewAutomationEnabled: false,
    reviewGoogleUrl: '',
    reviewFacebookUrl: '',
    reviewChannel: 'sms',
    socialConfigured: false,
    socialAutomationConfigured: false,
    socialPlatforms: []
  };
  let reviewSettings = {
    googleUrl: '',
    facebookUrl: '',
    autoSend: false,
    channel: 'sms'
  };
  const PRIVATE_OPS_URL = '/ops-login';
  if (window.location.protocol === 'file:') {
    window.location.replace(PRIVATE_OPS_URL);
  }
  let currentSession = {
    available: false,
    authenticated: false,
    storage: '',
    user: null
  };
  
  function currentPermissions() {
    return currentSession?.user?.permissions || {
      canAccessBusinessData: true,
      canAccessBookingsOnly: false,
      canAccessCrewOnly: false,
      canAccessSystem: false,
      canAccessWebsiteDevelopment: false
    };
  }
  
  function snapshotState() {
    return {
      bookings,
      customers,
      expenses,
      fuelLog,
      maintLog,
      trackers,
      invoices,
      communicationsLog,
      reviewRequests,
      reviews,
      reviewSettings,
      socialPosts,
      importMeta,
      invoiceImportMeta
    };
  }
  function cloneReviewRequests(items = reviewRequests) {
    return items.map((item) => ({...item}));
  }
  // Canonical booking status set — defensive cleanup on load so legacy/restored
  // data (e.g. 'canceled', 'no-show', 'Cancelled') is normalized to one form.
  function canonicalizeBookingStatuses(list) {
    if (!Array.isArray(list)) return list;
    list.forEach((booking) => {
      if (!booking || typeof booking !== 'object' || booking.status == null) return;
      const canon = normalizeBookingStatusValue(booking.status);
      if (CANONICAL_BOOKING_STATUSES.includes(canon) && canon !== booking.status) booking.status = canon;
    });
    return list;
  }
  function applyState(nextState = {}) {
    if (Array.isArray(nextState.bookings)) bookings = canonicalizeBookingStatuses(nextState.bookings);
    if (Array.isArray(nextState.customers)) customers = nextState.customers;
    if (Array.isArray(nextState.expenses)) expenses = nextState.expenses;
    if (Array.isArray(nextState.fuelLog)) fuelLog = nextState.fuelLog;
    if (Array.isArray(nextState.maintLog)) maintLog = nextState.maintLog;
    if (Array.isArray(nextState.trackers)) trackers = nextState.trackers;
    if (Array.isArray(nextState.invoices)) invoices = nextState.invoices;
    if (Array.isArray(nextState.communicationsLog)) communicationsLog = nextState.communicationsLog;
    if (Array.isArray(nextState.reviewRequests)) reviewRequests = nextState.reviewRequests;
    if (Array.isArray(nextState.reviews)) reviews = nextState.reviews;
    if (nextState.reviewSettings && typeof nextState.reviewSettings === 'object') {
      reviewSettings = {
        googleUrl: String(nextState.reviewSettings.googleUrl || '').trim(),
        facebookUrl: String(nextState.reviewSettings.facebookUrl || '').trim(),
        autoSend: Boolean(nextState.reviewSettings.autoSend),
        channel: String(nextState.reviewSettings.channel || '').trim().toLowerCase() === 'email' ? 'email' : 'sms'
      };
    }
    if (Array.isArray(nextState.socialPosts)) socialPosts = nextState.socialPosts;
    if (nextState.importMeta && typeof nextState.importMeta === 'object') {
      importMeta = {...importMeta, ...nextState.importMeta};
    }
    if (nextState.invoiceImportMeta && typeof nextState.invoiceImportMeta === 'object') {
      invoiceImportMeta = {...invoiceImportMeta, ...nextState.invoiceImportMeta};
    }
  }
  function updateModeBadge() {
    const pill = document.getElementById('ops-mode-pill');
    const userPill = document.getElementById('ops-user-pill');
    const logoutBtn = document.getElementById('logout-btn');
    if (!pill || !logoutBtn || !userPill) return;
    if (backendAvailable) {
      pill.textContent = 'Private sync';
      pill.className = 'ops-mode-pill server';
      logoutBtn.style.display = 'inline-flex';
    } else {
      pill.textContent = 'Private service required';
      pill.className = 'ops-mode-pill browser';
      logoutBtn.style.display = 'none';
    }
    if (currentSession?.authenticated && currentSession.user) {
      userPill.style.display = 'inline-flex';
      renderOpsMarkup(userPill, `<strong>${escapeHtml(currentSession.user.displayName || currentSession.user.username || 'User')}</strong><span>${escapeHtml(currentSession.user.role || '')}</span>`);
    } else {
      userPill.style.display = 'none';
      userPill.textContent = '';
    }
  }
  function isCrewMode() {
    return Boolean(currentPermissions().canAccessCrewOnly);
  }
  function applyCrewMode() {
    document.body.classList.add('crew-mode');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';
    const newBtn = document.getElementById('topbar-booking-action');
    if (newBtn) newBtn.style.display = 'none';
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    if (mobileToggle) mobileToggle.style.display = 'none';
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Schedule';
    document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === 'page-crew'));
    renderCrewSchedule();
  }
  function crewTodayIso() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function crewFormatTime(t) {
    const m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
    if (!m) return String(t || '');
    let h = Number(m[1]);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${m[2]} ${ampm}`;
  }
  function crewLongDate(iso) {
    const parsed = (typeof parseIsoDate === 'function' ? parseIsoDate(iso) : null) || new Date(`${iso}T00:00:00`);
    if (isNaN(parsed)) return iso;
    return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function crewCard(b) {
    const done = normalizeBookingStatusValue(b.status) === 'completed';
    const arrived = Boolean(b.checkedIn);
    const meta = [b.craftLabel, b.location].filter(Boolean).map(escapeHtml).join(' · ');
    return `
      <div class="crew-card${done ? ' is-done' : ''}">
        <div class="crew-time">${escapeHtml(crewFormatTime(b.time))}</div>
        <div class="crew-info">
          <div class="crew-name">${escapeHtml(b.name || 'Guest')}</div>
          <div class="crew-meta">${meta || '—'}</div>
          <div class="crew-status">${done ? '🏁 Done' : (arrived ? '✅ Checked in' : '⏳ Not arrived yet')}</div>
        </div>
        <div class="crew-actions">
        <button class="crew-btn arrive${arrived ? ' on' : ''}" data-crew-action="arrived" data-booking-id="${Number(b.id)}">${arrived ? 'Undo' : 'Arrived'}</button>
        <button class="crew-btn done${done ? ' on' : ''}" data-crew-action="done" data-booking-id="${Number(b.id)}"${done ? ' disabled' : ''}>Done</button>
        </div>
      </div>`;
  }
  function renderCrewSchedule() {
    const list = document.getElementById('crew-list');
    if (!list) return;
    const today = crewTodayIso();
    const dateLabel = document.getElementById('crew-date-label');
    if (dateLabel) dateLabel.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const upcoming = (bookings || [])
      .filter((b) => b && b.date && b.date >= today && normalizeBookingStatusValue(b.status) !== 'cancelled')
      .sort((a, b) => (a.date === b.date ? String(a.time).localeCompare(String(b.time)) : a.date.localeCompare(b.date)));
    if (!upcoming.length) {
      renderOpsMarkup(list, '<div class="crew-empty">No upcoming bookings right now. 🌊</div>');
      return;
    }
    const groups = [];
    let cur = null;
    for (const b of upcoming) {
      if (!cur || cur.date !== b.date) { cur = { date: b.date, items: [] }; groups.push(cur); }
      cur.items.push(b);
    }
    renderOpsMarkup(list, groups.map((g) => `
      <div class="crew-group">
        <div class="crew-group-date">${g.date === today ? 'Today' : escapeHtml(crewLongDate(g.date))}</div>
        ${g.items.map(crewCard).join('')}
      </div>`).join(''));
  }
  async function crewMarkArrived(id) {
    const booking = bookings.find((b) => Number(b.id) === Number(id));
    if (!booking) return;
    const prev = Boolean(booking.checkedIn);
    booking.checkedIn = !prev;
    if (!(await persistStateChange())) { booking.checkedIn = prev; showToast('⚠️ Could not save — try again'); return; }
    renderCrewSchedule();
    showToast(booking.checkedIn ? '✅ Marked arrived' : 'Check-in removed');
  }
  async function crewMarkDone(id) {
    const booking = bookings.find((b) => Number(b.id) === Number(id));
    if (!booking) return;
    const prev = booking.status;
    booking.status = 'completed';
    if (!(await persistStateChange())) { booking.status = prev; showToast('⚠️ Could not save — try again'); return; }
    renderCrewSchedule();
    showToast('🏁 Marked done');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-crew-action]') : null;
    if (!target) return;
    const action = target.dataset.crewAction;
    const id = Number(target.dataset.bookingId);
    if (!Number.isFinite(id)) return;
    if (action === 'arrived') {
      void crewMarkArrived(id);
    } else if (action === 'done') {
      void crewMarkDone(id);
    }
  });
  const EMPLOYEE_PAGES = ['dashboard', 'bookings', 'crm'];
  function applyRolePermissions() {
    const permissions = currentPermissions();
    if (permissions.canAccessCrewOnly) { applyCrewMode(); return; }
    const employee = Boolean(permissions.canAccessBookingsOnly);
    document.body.classList.toggle('hide-money', Boolean(permissions.hideMoney));
    document.querySelectorAll('[data-role="developer"]').forEach((element) => {
      element.style.display = permissions.canAccessSystem ? '' : 'none';
    });
    if (employee) {
      // Employee: a flat list of just the allowed pages (no section headers), money hidden.
      document.querySelectorAll('.sidebar .nav-section').forEach((element) => { element.style.display = 'none'; });
      document.querySelectorAll('.sidebar .nav-item').forEach((element) => {
        if (element.dataset.role === 'developer') { element.style.display = 'none'; return; }
        const page = element.dataset.page || '';
        const allowed = EMPLOYEE_PAGES.includes(page);
        element.style.display = allowed ? '' : 'none';
      });
      const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
      if (!EMPLOYEE_PAGES.includes(activePage)) {
        showPage('dashboard', document.querySelector('.nav-item[data-page="dashboard"]'));
      }
      return;
    }
    // Owner / developer: full navigation.
    document.querySelectorAll('.sidebar .nav-item').forEach((element) => {
      if (element.dataset.role === 'developer') return;
      element.style.display = '';
    });
    document.querySelectorAll('.sidebar .nav-section').forEach((element) => {
      if (element.dataset.role === 'developer') {
        element.style.display = permissions.canAccessSystem ? '' : 'none';
        return;
      }
      element.style.display = '';
    });
    if (!permissions.canAccessSystem && document.getElementById('page-system')?.classList.contains('active')) {
      showPage('dashboard', document.querySelector('.nav-item[data-page="dashboard"]'));
    }
  }
  function showServerRequiredState(message = '') {
    const loadingCard = document.querySelector('.app-loading-card');
    if (!loadingCard) return;
    renderOpsMarkup(loadingCard, `
      <h2>Use the Live CRM</h2>
      <p>${escapeHtml(message || 'This operations dashboard is server-backed and should be opened from the private Shoreline ops app, not the local file preview.')}</p>
      <div class="app-loading-actions">
        <a class="app-loading-link" href="${PRIVATE_OPS_URL}">Open live ops</a>
        <a class="app-loading-link secondary" href="https://slaquatics.com" target="_blank" rel="noopener noreferrer">Open website</a>
      </div>
    `);
  }
  function readLocalBackup() {
    return {};
  }
  function writeLocalBackup() {
    return;
  }
  function shouldPromoteBackup(serverState, backupState) {
    return false;
  }
  const TRUSTED_DEVICE_STORAGE_KEY = 'shoreline_ops_device_v1';
  const TRUSTED_DEVICE_COOKIE_NAME = 'sla_ops_device';
  function randomDeviceToken() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  function buildTrustedDeviceLabel() {
    const ua = window.navigator.userAgent || '';
    const mode = isStandaloneMode() ? 'Home Screen App' : 'Browser';
    if (/iPhone/i.test(ua)) return `iPhone ${mode}`;
    if (/iPad/i.test(ua)) return `iPad ${mode}`;
    if (/Android/i.test(ua)) return `Android ${mode}`;
    if (/Macintosh/i.test(ua)) return `Mac ${mode}`;
    return `Trusted ${mode}`;
  }
  function readCookieValue(name) {
    return document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || '';
  }
  function persistTrustedDevice(device) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const encoded = encodeURIComponent(device.token);
    try {
      window.localStorage.setItem(TRUSTED_DEVICE_STORAGE_KEY, JSON.stringify(device));
    } catch (error) {
      console.warn('Could not save trusted device key:', error);
    }
    document.cookie = `${TRUSTED_DEVICE_COOKIE_NAME}=${encoded}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }
  function getOrCreateTrustedDevice() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(TRUSTED_DEVICE_STORAGE_KEY) || 'null');
      if (saved && typeof saved.token === 'string' && saved.token.trim()) {
        const device = {
          token: saved.token.trim(),
          label: String(saved.label || buildTrustedDeviceLabel()).trim() || buildTrustedDeviceLabel(),
          createdAt: String(saved.createdAt || '')
        };
        persistTrustedDevice(device);
        return device;
      }
    } catch (error) {
      console.warn('Could not read trusted device key:', error);
    }
    const cookieToken = decodeURIComponent(readCookieValue(TRUSTED_DEVICE_COOKIE_NAME) || '').trim();
    if (cookieToken) {
      const device = {
        token: cookieToken,
        label: buildTrustedDeviceLabel(),
        createdAt: ''
      };
      persistTrustedDevice(device);
      return device;
    }
    const device = {
      token: randomDeviceToken(),
      label: buildTrustedDeviceLabel(),
      createdAt: new Date().toISOString()
    };
    persistTrustedDevice(device);
    return device;
  }
  function trustedDeviceHeaders(extra = {}) {
    const device = getOrCreateTrustedDevice();
    return {
      ...extra,
      'X-Ops-Device-Token': device.token,
      'X-Ops-Device-Label': device.label
    };
  }
  async function requestJson(path, options = {}) {
    const headers = trustedDeviceHeaders({ Accept: 'application/json', ...(options.headers || {}) });
    const response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers
    });
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => '');
    if (!response.ok) {
      const message = typeof payload === 'object' && payload ? payload.error : '';
      const error = new Error(message || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }
  async function detectBackendSession() {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        headers: trustedDeviceHeaders({ Accept: 'application/json' })
      });
      if (!response.ok) return {available:false, authenticated:false, storage:'', user:null};
      const payload = await response.json().catch(() => ({}));
      return {
        available:true,
        authenticated:Boolean(payload.authenticated),
        storage:String(payload.storage || ''),
        user: payload.user || null
      };
    } catch (error) {
      return {available:false, authenticated:false, storage:'', user:null};
    }
  }
  async function saveData(options = {}) {
    dedupeCustomers();
    refreshCustomerRollups();
    return saveStateSnapshot(snapshotState(), options);
  }
  async function saveStateSnapshot(nextState, options = {}) {
    if (!backendAvailable) return false;
    try {
      const payload = await requestJson('/api/ops/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState)
      });
      const serverState = payload?.state;
      if (serverState && typeof serverState === 'object') {
        applyState(serverState);
        dedupeCustomers();
        refreshCustomerRollups();
      }
      return true;
    } catch (error) {
      console.error('Remote save failed:', error);
      if (!options.silent) showToast(`⚠️ ${error.message || 'Could not save to the private ops service'}`);
      return false;
    }
  }
  async function persistStateChange(options = {}) {
    const saved = await saveData(options);
    if (saved) return true;
    if (!backendAvailable) return false;
    try {
      const loaded = await loadData();
      if (loaded === false) return false;
      await loadIntegrationStatus();
      syncAssetSelectors();
      renderImportSummary();
      renderInvoiceImportSummary();
      renderUpcoming();
      renderDashboardMetrics();
      renderBookingBars();
      renderInvoices();
      renderCRM();
      renderWaivers();
      renderExpenses();
      renderCommsPanel();
      renderTracking();
      renderReviewHub();
      renderSocialQueue();
      renderMaint();
      renderReminders();
      if (document.getElementById('page-bookings')?.classList.contains('active')) renderBookings(currentFilter);
      updatePendingBadge();
    } catch (error) {
      console.error('State reload after failed save failed:', error);
    }
    return false;
  }
  async function loadData() {
    const session = await detectBackendSession();
    currentSession = session;
    if (!session.available) {
      backendAvailable = false;
      applyRolePermissions();
      updateModeBadge();
      throw new Error('Private Shoreline storage is unavailable right now.');
    }
    if (!session.authenticated) {
      window.location.href = '/ops-login';
      return false;
    }
    backendAvailable = true;
    applyRolePermissions();
    updateModeBadge();
    const payload = await requestJson('/api/ops/state');
    const serverState = payload?.state || {};
    applyState(serverState);
    dedupeCustomers();
    refreshCustomerRollups();
    if (isCrewMode()) renderCrewSchedule();
    return true;
  }
  async function loadIntegrationStatus() {
    if (!backendAvailable) return integrations;
    try {
      const payload = await requestJson('/api/ops/integrations/status');
      integrations = {...integrations, ...(payload.integrations || {})};
      reviewSettings = {
        ...reviewSettings,
        googleUrl: String(integrations.reviewGoogleUrl || reviewSettings.googleUrl || '').trim(),
        facebookUrl: String(integrations.reviewFacebookUrl || reviewSettings.facebookUrl || '').trim(),
        autoSend: Boolean(integrations.reviewAutomationEnabled),
        channel: integrations.reviewChannel === 'email' ? 'email' : 'sms'
      };
    } catch (error) {
      console.error('Integration status load failed:', error);
    }
    return integrations;
  }
  async function logout() {
    if (!backendAvailable) {
      showToast('ℹ️ No private Shoreline session is active right now.');
      return;
    }
    try {
      await requestJson('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      window.location.href = '/ops-login';
    }
  }
  // ── DATA ──
  const PRICING = {
    jetski2:{2:315,3:475,4:590,6:760,8:945},
    jetski3:{2:475,3:710,4:885,6:1135,8:1420},
    jetski4:{2:630,3:945,4:1180,6:1515,8:1890},
    boat:{1:130,2:255,3:380,4:505,6:760,8:1010},
    bundle2:{2:570,3:855,4:1095,6:1515,8:1955},
    bundle3:{2:725,3:1090,4:1390,6:1890,8:2430},
    bundle4:{2:885,3:1325,4:1680,6:2270,8:2900},
    partyboat:{2:320,3:480,4:640,6:960,8:1280},
    yamaha:{2:315,3:475,4:590,6:760,8:945},
    seadoo:{2:630,3:945,4:1180,6:1515,8:1890}
  };
  const DEFAULT_BOOKING_DEPOSIT = 50;
  const DEFAULT_PROCESSING_FEE = 5;
  const CRAFT_NAMES = {
    jetski2:'2 Yamaha Jet Skis',
    jetski3:'3 Yamaha Jet Skis',
    jetski4:'4 Yamaha Jet Skis',
    boat:'Boat Rental',
    partyboat:'Boat Rental (up to 14)',
    bundle2:'2 Jet Skis + Boat',
    bundle3:'3 Jet Skis + Boat',
    bundle4:'4 Jet Skis + Boat',
    yamaha:'2 Yamaha Jet Skis',
    seadoo:'4 Yamaha Jet Skis',
    imported:'Imported booking'
  };
  const LEGACY_CRAFT_MAP = {
    yamaha:'jetski2',
    seadoo:'jetski4',
    seadoo2:'jetski2',
    seadoo4:'jetski4'
  };
  const AVATAR_COLORS = ['#1a9ed4','#10b981','#f59e0b','#8b5cf6','#ef4444','#0fb8e0'];
  
  let bookings = [];
  
  let customers = [];
  let importMeta = {lastType:'',fileName:'',importedAt:'',added:0,updated:0,recordCount:0,replacedSeed:false};
  let invoiceImportMeta = {lastType:'',fileName:'',importedAt:'',added:0,updated:0,recordCount:0,replacedSeed:false};
  let crmSearchQuery = '';
  let waiverSearchQuery = '';
  let crmViewFilter = 'all';
  let crmSortMode = 'recent';
  let massEmailSearchQuery = '';
  let massEmailAudienceMode = 'all';
  let selectedMassEmailCustomerIds = new Set();
  let invoiceSearchQuery = '';
  let invoiceDateBasis = 'booked';
  let invoicePeriodFilter = 'month';
  let invoiceStatusFilter = 'all';
  let invoiceDateFrom = '';
  let invoiceDateTo = '';
  let editingInvoiceId = null;
  let invoiceCustomerContextId = null;
  let invoiceAmountManuallyEdited = false;
  
  let expenses = [];
  let editingExpenseId = null;
  
  let fuelLog = [];
  let editingFuelId = null;
  
  let maintLog = [];
  let editingMaintId = null;
  
  let trackers = [];
  let selectedTrackerId = null;
  let editingTrackerId = null;
  
  function isIosDevice() {
    return /iPad|iPhone|iPod/i.test(window.navigator.userAgent || '');
  }
  
  function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  
  function isNativeOpsApp() {
    return /ShorelineOpsNative/i.test(window.navigator.userAgent || '');
  }
  
  function dismissInstallBanner() {
    document.body.dataset.iosInstall = 'dismissed';
  }
  
  if (isNativeOpsApp()) {
    document.body.dataset.nativeApp = 'true';
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {});
    }
  }
  
  if (window.location.protocol !== 'file:' && isIosDevice() && !isStandaloneMode() && !isNativeOpsApp()) {
    document.body.dataset.iosInstall = 'needed';
  }
  
  let invoices = [];
  let communicationsLog = [];
  let reviewRequests = [];
  let reviews = [];
  let socialPosts = [];
  let editingCustomerId = null;
  let expandedCustomerId = null;
  
  const DEFAULT_ASSET_OPTIONS = ['Jet Ski 1', 'Jet Ski 2', 'Boat', 'Trailer'];
  
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function node(tagName, options = {}, children = []) {
    const element = document.createElement(tagName);
    if (options.className) element.className = options.className;
    if (options.text != null) element.textContent = String(options.text);
    if (options.htmlFor) element.htmlFor = options.htmlFor;
    if (options.href) element.href = options.href;
    if (options.title) element.title = options.title;
    if (options.type) element.type = options.type;
    if (options.disabled != null) element.disabled = Boolean(options.disabled);
    if (options.colSpan != null) element.colSpan = Number(options.colSpan);
    if (options.target) element.target = options.target;
    if (options.rel) element.rel = options.rel;
    if (options.style) Object.assign(element.style, options.style);
    if (options.dataset) {
      Object.entries(options.dataset).forEach(([key, value]) => {
        if (value != null) element.dataset[key] = String(value);
      });
    }
    if (options.attrs) {
      Object.entries(options.attrs).forEach(([key, value]) => {
        if (value != null) element.setAttribute(key, String(value));
      });
    }
    element.append(...children.filter(Boolean));
    return element;
  }
  function clearElement(element) {
    if (element) element.replaceChildren();
  }
  function renderOpsMarkup(element, markup) {
    if (!element) return;
    const source = String(markup ?? '');
    if (!source) {
      element.replaceChildren();
      return;
    }
    const embeddedDocPattern = new RegExp(`\\bsrc${'doc'}\\s*=`, 'i');
    if (/<\s*script\b/i.test(source) || /\son[a-z]+\s*=/i.test(source) || embeddedDocPattern.test(source) || /javascript\s*:/i.test(source)) {
      console.warn('Blocked unsafe ops markup render');
      element.replaceChildren();
      return;
    }
    const range = document.createRange();
    range.selectNode(element);
    element.replaceChildren(range.createContextualFragment(source));
  }
  function textLine(className, text) {
    return node('div', {className, text});
  }
  function actionButton(label, className, dataset = {}, options = {}) {
    return node('button', {
      className,
      text: label,
      type: 'button',
      dataset,
      disabled: options.disabled,
      style: options.style
    });
  }
  function safeExternalUrl(value, allowedHostParts = []) {
    const normalized = normalizeTrackerShareUrl(value);
    if (!normalized) return '';
    try {
      const url = new URL(normalized);
      if (url.protocol !== 'https:') return '';
      const host = url.hostname.toLowerCase();
      if (!allowedHostParts.some((part) => host === part || host.endsWith(`.${part}`) || host.includes(part))) return '';
      return url.href;
    } catch {
      return '';
    }
  }
  function safeTrackerShareUrl(value) {
    return safeExternalUrl(value, ['landairsea.com', 'sharespot', 'share-spot']);
  }
  function nextId(list) {
    return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  }
  function normalizeHeader(name) {
    return String(name || '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function rowValue(row, candidates) {
    const entries = Object.entries(row || {});
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeHeader(candidate);
      for (const [key, rawValue] of entries) {
        const normalizedKey = normalizeHeader(key);
        if ((normalizedKey === normalizedCandidate || normalizedKey.includes(normalizedCandidate)) && String(rawValue || '').trim()) {
          return String(rawValue).trim();
        }
      }
    }
    return '';
  }
  function collectCrmFields(row) {
    return Object.fromEntries(
      Object.entries(row || {})
        .map(([key, value]) => [String(key || '').trim(), String(value || '').trim()])
        .filter(([key, value]) => key && value)
    );
  }
  function mergeCrmFields(existingFields, incomingFields) {
    return {...(existingFields || {}), ...(incomingFields || {})};
  }
  function parseMoney(value) {
    const parsed = parseFloat(String(value || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function bookingCraftLabel(booking) {
    const craftKey = normalizeCraftKey(booking.craftKey || booking.craft);
    return booking.craftLabel || CRAFT_NAMES[craftKey] || 'Imported booking';
  }
  function bookingDurationLabel(booking) {
    if (booking.durationLabel) return booking.durationLabel;
    const duration = Number(booking.duration);
    if (duration === 8) return 'Full Day';
    return duration > 0 ? `${duration}hrs` : 'Imported';
  }
  function bookingTotalValue(booking) {
    const explicit = Number(booking.total);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const craftKey = normalizeCraftKey(booking.craftKey || booking.craft);
    return (PRICING[craftKey]?.[booking.duration] || 0) + (booking.drone ? 50 : 0);
  }
  function normalizeCraftKey(value = '') {
    const raw = String(value || '').trim();
    return LEGACY_CRAFT_MAP[raw] || raw;
  }
  function bookingEditorCraftValue(booking = {}) {
    const direct = normalizeCraftKey(booking.craftKey || booking.craft);
    if (direct && PRICING[direct]) return direct;
    const guessed = guessCraftFromText(booking.craftLabel || booking.invoiceName || booking.notes || booking.name || '');
    return guessed && PRICING[guessed] ? guessed : '';
  }
  function hideMoneyForRole() {
    return document.body.classList.contains('hide-money');
  }
  function bookingTotalLabel(booking) {
    if (hideMoneyForRole()) return '—';
    return `${bookingTotalValue(booking).toLocaleString()}`;
  }
  function moneyLabel(value) {
    if (hideMoneyForRole()) return '—';
    return `${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: Number(value || 0) % 1 ? 2 : 0,
      maximumFractionDigits: 2
    })}`;
  }
  function listWithEntryIds(list = []) {
    const items = list.map((entry) => ({...entry}));
    let changed = false;
    let maxId = items.reduce((max, entry) => {
      const value = Number(entry?.id || 0);
      return Number.isFinite(value) && value > max ? value : max;
    }, 0);
    items.forEach((entry) => {
      const value = Number(entry?.id || 0);
      if (Number.isFinite(value) && value > 0) return;
      maxId += 1;
      entry.id = maxId;
      changed = true;
    });
    return {items, changed};
  }
  function ensureEntryIds(list = []) {
    const {items, changed} = listWithEntryIds(list);
    if (changed) {
      list.splice(0, list.length, ...items);
    }
    return changed;
  }
  function ensureLocalEntryIds(list = [], syncFn = null) {
    const changed = ensureEntryIds(list);
    if (changed && typeof syncFn === 'function') syncFn();
    return changed;
  }
  function isSameMonth(date, reference = new Date()) {
    return Boolean(date) && date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
  }
  function isSameYear(date, reference = new Date()) {
    return Boolean(date) && date.getFullYear() === reference.getFullYear();
  }
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  function endOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
  function startOfWeek(date) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() - next.getDay());
    next.setHours(0, 0, 0, 0);
    return next;
  }
  function endOfWeek(date) {
    const next = startOfWeek(date);
    next.setDate(next.getDate() + 6);
    next.setHours(23, 59, 59, 999);
    return next;
  }
  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  function startOfYear(date) {
    return new Date(date.getFullYear(), 0, 1);
  }
  function endOfYear(date) {
    return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  }
  function inRange(date, from, to) {
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }
  function invoiceBookedDateValue(invoice = {}) {
    const linkedBooking = linkedBookingForInvoiceRecord(invoice);
    return dateValue(linkedBooking?.date || invoice.rawFields?.bookingDate || '');
  }
  function invoiceDateValue(invoice) {
    if (invoiceDateBasis === 'due') return dateValue(invoice.dueDate || invoice.issueDate);
    if (invoiceDateBasis === 'booked') return invoiceBookedDateValue(invoice) || dateValue(invoice.issueDate || invoice.dueDate);
    return dateValue(invoice.issueDate || invoice.dueDate);
  }
  function invoiceMatchesPeriod(invoice) {
    const targetDate = invoiceDateValue(invoice);
    const now = new Date();
    if (!targetDate) return invoicePeriodFilter === 'all';
    if (invoicePeriodFilter === 'today') return inRange(targetDate, startOfDay(now), endOfDay(now));
    if (invoicePeriodFilter === 'week') return inRange(targetDate, startOfWeek(now), endOfWeek(now));
    if (invoicePeriodFilter === 'month') return inRange(targetDate, startOfMonth(now), endOfMonth(now));
    if (invoicePeriodFilter === 'year') return inRange(targetDate, startOfYear(now), endOfYear(now));
    if (invoicePeriodFilter === 'custom') {
      const from = invoiceDateFrom ? parseIsoDate(invoiceDateFrom) : null;
      const toRaw = invoiceDateTo ? parseIsoDate(invoiceDateTo) : null;
      const to = toRaw ? new Date(toRaw.getFullYear(), toRaw.getMonth(), toRaw.getDate(), 23, 59, 59, 999) : null;
      return inRange(targetDate, from, to);
    }
    return true;
  }
  function invoiceIsOverdue(invoice) {
    if (invoiceOutstandingAmount(invoice) <= 0) return false;
    const due = invoice.dueDate ? parseIsoDate(invoice.dueDate) : null;
    if (!due) return false;
    return endOfDay(due) < startOfDay(new Date());
  }
  function invoiceMatchesStatusFilter(invoice) {
    if (invoiceStatusFilter === 'all') return true;
    if (invoiceStatusFilter === 'paid') return invoiceOutstandingAmount(invoice) <= 0;
    if (invoiceStatusFilter === 'open') return invoiceOutstandingAmount(invoice) > 0;
    if (invoiceStatusFilter === 'overdue') return invoiceIsOverdue(invoice);
    return true;
  }
  function filteredInvoicesList() {
    return invoices.filter((invoice) => (
      (!invoiceSearchQuery || invoiceSearchText(invoice).includes(invoiceSearchQuery)) &&
      invoiceMatchesPeriod(invoice) &&
      invoiceMatchesStatusFilter(invoice)
    ));
  }
  function sortNewestFirst(list, getValue) {
    return [...list].sort((left, right) => {
      const leftDate = dateValue(getValue(left));
      const rightDate = dateValue(getValue(right));
      const leftTime = leftDate ? leftDate.getTime() : 0;
      const rightTime = rightDate ? rightDate.getTime() : 0;
      return rightTime - leftTime;
    });
  }
  function currentMonthFuelCost() {
    return fuelLog.reduce((sum, entry) => {
      const entryDate = dateValue(entry.date);
      if (!isSameMonth(entryDate)) return sum;
      return sum + (Number(entry.gallons || 0) * Number(entry.ppg || 0));
    }, 0);
  }
  function expensesInPeriod(period = 'month', category = '') {
    return expenses.filter((expense) => {
      const categoryMatch = category ? expense.category === category : true;
      return categoryMatch && expenseProjectedAmount(expense, period) > 0;
    });
  }
  function normalizeExpenseRecurringType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (['monthly', 'yearly', 'seasonal'].includes(normalized)) return normalized;
    return 'one-time';
  }
  function expenseMonthNumber(value, fallback = 1) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(12, Math.max(1, Math.round(parsed)));
  }
  function expenseMonthInSeason(month, start, end) {
    if (start <= end) return month >= start && month <= end;
    return month >= start || month <= end;
  }
  function expenseOccurrencesInPeriod(expense = {}, period = 'month', reference = new Date()) {
    const recurringType = normalizeExpenseRecurringType(expense.recurringType);
    const expenseDate = dateValue(expense.date) || reference;
    const referenceMonth = reference.getMonth() + 1;
    if (recurringType === 'one-time') {
      if (period === 'month') return isSameMonth(expenseDate, reference) ? 1 : 0;
      if (period === 'year') return isSameYear(expenseDate, reference) ? 1 : 0;
      return 1;
    }
    if (recurringType === 'monthly') return period === 'year' ? 12 : 1;
    if (recurringType === 'yearly') {
      if (period === 'month') return expenseDate.getMonth() + 1 === referenceMonth ? 1 : 0;
      return 1;
    }
    const seasonStart = expenseMonthNumber(expense.seasonStartMonth, expenseDate.getMonth() + 1);
    const seasonEnd = expenseMonthNumber(expense.seasonEndMonth, seasonStart);
    if (period === 'month') return expenseMonthInSeason(referenceMonth, seasonStart, seasonEnd) ? 1 : 0;
    let count = 0;
    for (let month = 1; month <= 12; month += 1) {
      if (expenseMonthInSeason(month, seasonStart, seasonEnd)) count += 1;
    }
    return count;
  }
  function expenseProjectedAmount(expense = {}, period = 'month', reference = new Date()) {
    return Number(expense.amount || 0) * expenseOccurrencesInPeriod(expense, period, reference);
  }
  function expensePeriodTotal(period = 'month', category = '', reference = new Date()) {
    return expenses.reduce((sum, expense) => {
      if (category && expense.category !== category) return sum;
      return sum + expenseProjectedAmount(expense, period, reference);
    }, 0);
  }
  function expenseScheduleLabel(expense = {}) {
    const recurringType = normalizeExpenseRecurringType(expense.recurringType);
    if (recurringType === 'monthly') return 'Monthly';
    if (recurringType === 'yearly') {
      const expenseDate = dateValue(expense.date);
      return expenseDate ? `Yearly in ${MONTH_LABELS[expenseDate.getMonth()]}` : 'Yearly';
    }
    if (recurringType === 'seasonal') {
      const seasonStart = expenseMonthNumber(expense.seasonStartMonth, 5);
      const seasonEnd = expenseMonthNumber(expense.seasonEndMonth, seasonStart);
      return `Seasonal ${MONTH_LABELS[seasonStart - 1]}-${MONTH_LABELS[seasonEnd - 1]}`;
    }
    return 'One-time';
  }
  function recurringExpenseMonthlyTotal(reference = new Date()) {
    return expenses.reduce((sum, expense) => {
      if (normalizeExpenseRecurringType(expense.recurringType) === 'one-time') return sum;
      return sum + expenseProjectedAmount(expense, 'month', reference);
    }, 0);
  }
  function seasonalExpenseYearlyTotal(reference = new Date()) {
    return expenses.reduce((sum, expense) => {
      if (normalizeExpenseRecurringType(expense.recurringType) !== 'seasonal') return sum;
      return sum + expenseProjectedAmount(expense, 'year', reference);
    }, 0);
  }
  function recurringExpenseYearlyTotal(reference = new Date()) {
    return expenses.reduce((sum, expense) => {
      if (normalizeExpenseRecurringType(expense.recurringType) === 'one-time') return sum;
      return sum + expenseProjectedAmount(expense, 'year', reference);
    }, 0);
  }
  function revenueThisMonth() {
    const collectedInvoices = invoices.filter((invoice) => invoiceCollectedAmount(invoice) > 0 && isSameMonth(invoiceDateValue(invoice)));
    if (collectedInvoices.length) {
      return collectedInvoices.reduce((sum, invoice) => sum + invoiceCollectedAmount(invoice), 0);
    }
    return scheduledBookings().reduce((sum, booking) => {
      const bookingDate = dateValue(booking.date);
      if (!isSameMonth(bookingDate)) return sum;
      if (!bookingIsPaid(booking)) return sum;
      return sum + bookingTotalValue(booking);
    }, 0);
  }
  
  // ── OWNER REPORTS ──
  function revenueForMonth(reference = new Date()) {
    const collectedInvoices = invoices.filter((invoice) => invoiceCollectedAmount(invoice) > 0 && isSameMonth(invoiceDateValue(invoice), reference));
    if (collectedInvoices.length) {
      return collectedInvoices.reduce((sum, invoice) => sum + invoiceCollectedAmount(invoice), 0);
    }
    return scheduledBookings().reduce((sum, booking) => {
      if (!isSameMonth(dateValue(booking.date), reference)) return sum;
      if (!bookingIsPaid(booking)) return sum;
      return sum + bookingTotalValue(booking);
    }, 0);
  }
  function bookingsCountForMonth(reference = new Date()) {
    return scheduledBookings().filter((booking) => isSameMonth(dateValue(booking.date), reference)).length;
  }
  function craftKeyMatchesKind(craft, kind) {
    const k = normalizeCraftKey(craft || '');
    if (kind === 'boat') return k === 'boat' || k === 'partyboat';
    if (kind === 'bundle') return k.startsWith('bundle');
    if (kind === 'jetski') return k.startsWith('jetski');
    return false;
  }
  // Resolve the rental type for an invoice: use the explicit craftKey if present,
  // otherwise infer it from the invoice name/line text (imported invoices have no
  // craftKey) so a "Boat Rental" invoice still counts toward boat revenue.
  function invoiceCraftKey(invoice = {}) {
    const explicit = normalizeCraftKey(invoice.craftKey || invoice.craft || '');
    if (explicit) return explicit;
    return guessCraftFromText(invoice.invoiceName || invoice.name || invoiceLineSummary(invoice) || '');
  }
  // Revenue for one rental type, using the SAME source as revenueForMonth (collected
  // invoices, or paid bookings as a fallback). Types may not sum to the exact total
  // when an invoice/booking's rental type can't be determined.
  function revenueForMonthByKind(reference = new Date(), kind = 'boat') {
    const monthCollected = invoices.filter((invoice) => invoiceCollectedAmount(invoice) > 0 && isSameMonth(invoiceDateValue(invoice), reference));
    if (monthCollected.length) {
      return monthCollected
        .filter((invoice) => craftKeyMatchesKind(invoiceCraftKey(invoice), kind))
        .reduce((sum, invoice) => sum + invoiceCollectedAmount(invoice), 0);
    }
    return scheduledBookings().reduce((sum, booking) => {
      if (!isSameMonth(dateValue(booking.date), reference)) return sum;
      if (!bookingIsPaid(booking)) return sum;
      const craft = booking.craftKey || booking.craft || guessCraftFromText(booking.craftLabel || booking.name || '');
      if (!craftKeyMatchesKind(craft, kind)) return sum;
      return sum + bookingTotalValue(booking);
    }, 0);
  }
  function setReportDelta(deltaId, current, previous, { money = false, inverse = false } = {}) {
    const el = document.getElementById(deltaId);
    if (!el) return;
    const diff = current - previous;
    if (current === 0 && previous === 0) { el.className = 'delta'; el.textContent = 'No activity yet'; return; }
    if (previous === 0) {
      // last month was zero — a percentage is meaningless, show it as new
      el.className = 'delta ' + (inverse ? 'down' : 'up');
      el.textContent = `▲ ${money ? moneyLabel(current) : current} — new this month`;
      return;
    }
    const pct = Math.round((diff / Math.abs(previous)) * 100);
    const good = inverse ? diff <= 0 : diff >= 0;
    el.className = 'delta ' + (diff === 0 ? '' : good ? 'up' : 'down');
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '·';
    el.textContent = `${arrow} ${money ? moneyLabel(Math.abs(diff)) : Math.abs(diff)} (${pct >= 0 ? '+' : ''}${pct}%) vs last month`;
  }
  function renderReports() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rev = revenueForMonth(now), revPrev = revenueForMonth(lastMonth);
    const bk = bookingsCountForMonth(now), bkPrev = bookingsCountForMonth(lastMonth);
    const exp = expensePeriodTotal('month', '', now), expPrev = expensePeriodTotal('month', '', lastMonth);
    const net = rev - exp, netPrev = revPrev - expPrev;
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('rep-revenue', moneyLabel(rev));
    set('rep-bookings', String(bk));
    set('rep-expenses', moneyLabel(exp));
    set('rep-net', moneyLabel(net));
    const netEl = document.getElementById('rep-net');
    if (netEl) netEl.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
    setReportDelta('rep-revenue-delta', rev, revPrev, { money: true });
    setReportDelta('rep-bookings-delta', bk, bkPrev, {});
    setReportDelta('rep-expenses-delta', exp, expPrev, { money: true, inverse: true });
    setReportDelta('rep-net-delta', net, netPrev, { money: true });
    // Revenue split by rental type (boat is what the owner wants to track)
    const boatRev = revenueForMonthByKind(now, 'boat'), boatRevPrev = revenueForMonthByKind(lastMonth, 'boat');
    set('rep-rev-jetski', moneyLabel(revenueForMonthByKind(now, 'jetski')));
    set('rep-rev-boat', moneyLabel(boatRev));
    set('rep-rev-bundle', moneyLabel(revenueForMonthByKind(now, 'bundle')));
    setReportDelta('rep-rev-boat-delta', boatRev, boatRevPrev, { money: true });
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: `${MONTH_LABELS[ref.getMonth()]} ${String(ref.getFullYear()).slice(2)}`,
        rev: revenueForMonth(ref),
        boatRev: revenueForMonthByKind(ref, 'boat'),
        bk: bookingsCountForMonth(ref),
        exp: expensePeriodTotal('month', '', ref)
      });
    }
    const maxRev = Math.max(...months.map((m) => m.rev), 1);
    const barsEl = document.getElementById('reports-revenue-bars');
    if (barsEl) renderOpsMarkup(barsEl, months.map((m) => `
      <div class="bar-col">
        <div class="bar-val">${moneyLabel(m.rev)}</div>
        <div class="bar" style="height:${Math.round((m.rev / maxRev) * 100)}px;" title="${escapeHtml(m.label)}: ${moneyLabel(m.rev)}"></div>
        <div class="bar-label">${escapeHtml(m.label)}</div>
      </div>`).join(''));
    const tableEl = document.getElementById('reports-table');
    if (tableEl) renderOpsMarkup(tableEl, months.slice().reverse().map((m) => `
      <tr>
        <td>${escapeHtml(m.label)}</td>
        <td data-label="Revenue" style="color:var(--green);font-weight:500;">${moneyLabel(m.rev)}</td>
        <td data-label="Boat" style="color:var(--gold);">${moneyLabel(m.boatRev)}</td>
        <td data-label="Bookings">${m.bk}</td>
        <td data-label="Expenses" style="color:var(--amber);">${moneyLabel(m.exp)}</td>
        <td data-label="Net" style="font-weight:500;">${moneyLabel(m.rev - m.exp)}</td>
      </tr>`).join(''));
  }
  function exportReportsCsv() {
    const now = new Date();
    const rows = [['Month', 'Revenue', 'Boat Revenue', 'Bookings', 'Expenses', 'Net']];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const rev = revenueForMonth(ref);
      const boatRev = revenueForMonthByKind(ref, 'boat');
      const exp = expensePeriodTotal('month', '', ref);
      rows.push([
        `${MONTH_LABELS[ref.getMonth()]} ${ref.getFullYear()}`,
        rev.toFixed(2),
        boatRev.toFixed(2),
        bookingsCountForMonth(ref),
        exp.toFixed(2),
        (rev - exp).toFixed(2)
      ]);
    }
    const csv = rows.map((row) => row.map((cell) => {
      const text = String(cell);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shoreline-reports-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (typeof showToast === 'function') showToast('✅ Exported 6-month report CSV');
  }
  function mapImportedStatus(stage, status) {
    const raw = `${stage || ''} ${status || ''}`.toLowerCase();
    if (/cancel/.test(raw)) return 'cancelled';
    if (/no[\s-]?show|lost/.test(raw)) return 'noshow';
    if (/complete|fulfilled|delivered/.test(raw)) return 'completed';
    if (/won|booked|confirm|paid|closed/.test(raw)) return 'confirmed';
    return 'pending';
  }
  function guessCraftFromText(text) {
    const raw = String(text || '').toLowerCase();
    const mentionsBoat = raw.includes('boat') || raw.includes('pontoon');
    const mentionsFour = /4\s*(jet|ski)|4\s*skis|four\s*(jet|ski)|seadoo/.test(raw);
    const mentionsThree = /3\s*(jet|ski)|3\s*skis|three\s*(jet|ski)/.test(raw);
    const mentionsTwo = /2\s*(jet|ski)|2\s*skis|two\s*(jet|ski)|yamaha/.test(raw);
    if (mentionsBoat && mentionsFour) return 'bundle4';
    if (mentionsBoat && mentionsThree) return 'bundle3';
    if (mentionsBoat && mentionsTwo) return 'bundle2';
    if (mentionsBoat) return 'boat';
    if (mentionsFour) return 'jetski4';
    if (mentionsThree) return 'jetski3';
    if (mentionsTwo) return 'jetski2';
    return 'imported';
  }
  function guessDurationFromText(text) {
    const match = String(text || '').match(/\b(2|3|4|6|8)\s*(hour|hr)/i);
    return match ? Number(match[1]) : 0;
  }
  function guessDroneFromText(text) {
    const raw = String(text || '').toLowerCase();
    return raw.includes('drone') && !raw.includes('no drone');
  }
  function deriveCustomerTag(rawTags) {
    const raw = String(rawTags || '').toLowerCase();
    if (raw.includes('vip')) return 'vip';
    if (raw.includes('repeat')) return 'repeat';
    if (raw.includes('group')) return 'group';
    return '';
  }
  function looksLikeSeedCustomers() {
    return customers.length === 8 && customers.every((customer) => /@example\.com$/i.test(String(customer.email || '')));
  }
  function mergeCustomerRecord(target, incoming = {}) {
    target.name = incoming.name || target.name;
    target.phone = incoming.phone || target.phone;
    target.email = incoming.email || target.email;
    if (incoming.bookings !== undefined && incoming.bookings !== null && String(incoming.bookings).trim() !== '') {
      target.bookings = Number(incoming.bookings) || 0;
    }
    if (incoming.totalSpent !== undefined && incoming.totalSpent !== null && String(incoming.totalSpent).trim() !== '') {
      target.totalSpent = Number(incoming.totalSpent) || 0;
    }
    target.lastBooking = updateLatestDate(target.lastBooking, incoming.lastBooking);
    target.source = incoming.source || target.source;
    target.tag = target.tag || incoming.tag || '';
    target.crmTags = incoming.crmTags || target.crmTags || '';
    target.company = incoming.company || target.company || '';
    target.createdAt = incoming.createdAt || target.createdAt || '';
    target.lastActivity = updateLatestDate(target.lastActivity, incoming.lastActivity);
    target.crmNotes = incoming.crmNotes || target.crmNotes || '';
    target.waiverOnFile = incoming.waiverOnFile ?? target.waiverOnFile ?? false;
    target.waiverSignedAt = incoming.waiverSignedAt || target.waiverSignedAt || '';
    target.waiverSignature = incoming.waiverSignature || target.waiverSignature || '';
    target.dateOfBirth = incoming.dateOfBirth || target.dateOfBirth || '';
    target.waiverInitials = incoming.waiverInitials || target.waiverInitials || '';
    target.emergencyName = incoming.emergencyName || target.emergencyName || '';
    target.emergencyPhone = incoming.emergencyPhone || target.emergencyPhone || '';
    target.crmFields = mergeCrmFields(target.crmFields, incoming.crmFields);
    target.importSource = target.importSource || incoming.importSource || '';
  }
  function customerImportKey(customer) {
    const emailKey = normalizeEmail(customer.email);
    if (emailKey) return `email:${emailKey}`;
    const phoneKey = normalizePhone(customer.phone);
    if (phoneKey) return `phone:${phoneKey}`;
    const nameKey = normalizeName(customer.name);
    if (!nameKey) return '';
    const createdKey = String(customer.createdAt || customer.lastBooking || '').trim();
    const companyKey = String(customer.company || customer.source || '').trim().toLowerCase();
    if (customer.importSource === 'admintribe' || customer.source === 'Admin Tribe') {
      return `crm:${nameKey}|${createdKey}|${companyKey}`;
    }
    return `name:${nameKey}|${companyKey}`;
  }
  function dedupeCustomers() {
    const seen = new Map();
    const deduped = [];
    const customerIdRemap = new Map();
    customers.forEach((customer) => {
      const key = customerImportKey(customer);
      if (!key) {
        deduped.push(customer);
        return;
      }
      const existing = seen.get(key);
      if (existing) {
        if (Number(customer.id || 0) > 0 && Number(existing.id || 0) > 0 && Number(customer.id) !== Number(existing.id)) {
          customerIdRemap.set(Number(customer.id), Number(existing.id));
        }
        mergeCustomerRecord(existing, customer);
        return;
      }
      seen.set(key, customer);
      deduped.push(customer);
    });
    let maxCustomerId = deduped.reduce((max, customer) => Math.max(max, Number(customer.id) || 0), 0);
    customers = deduped.map((customer) => {
      if (Number(customer.id || 0) > 0) return customer;
      maxCustomerId += 1;
      return { ...customer, id: maxCustomerId };
    });
    if (customerIdRemap.size) {
      bookings.forEach((booking) => {
        const remapped = customerIdRemap.get(Number(booking.customerId || 0));
        if (remapped) booking.customerId = remapped;
      });
      invoices.forEach((invoice) => {
        const remapped = customerIdRemap.get(Number(invoice.customerId || 0));
        if (remapped) invoice.customerId = remapped;
      });
      communicationsLog.forEach((entry) => {
        const remapped = customerIdRemap.get(Number(entry.customerId || 0));
        if (remapped) entry.customerId = remapped;
      });
    }
  }
  function updateLatestDate(currentValue, incomingValue) {
    if (!incomingValue || incomingValue === 'N/A') return currentValue || 'N/A';
    if (!currentValue || currentValue === 'N/A') return incomingValue;
    const currentDate = dateValue(currentValue);
    const incomingDate = dateValue(incomingValue);
    if (!incomingDate) return currentValue;
    if (!currentDate) return incomingValue;
    return incomingDate > currentDate ? incomingValue : currentValue;
  }
  function upsertImportedCustomer(data) {
    const phoneKey = normalizePhone(data.phone);
    const emailKey = normalizeEmail(data.email);
    const nameKey = normalizeName(data.name);
    const createdKey = String(data.createdAt || '').trim();
    const existing = customers.find((customer) => (
      (phoneKey && normalizePhone(customer.phone) === phoneKey) ||
      (emailKey && normalizeEmail(customer.email) === emailKey) ||
      (
        nameKey &&
        normalizeName(customer.name) === nameKey &&
        (
          (!phoneKey && !emailKey) ||
          customer.importSource === 'admintribe' ||
          customer.source === 'Admin Tribe'
        ) &&
        (!createdKey || String(customer.createdAt || '').trim() === createdKey)
      )
    ));
    if (existing) {
      mergeCustomerRecord(existing, data);
      return 'updated';
    }
    customers.push({
      id: nextId(customers),
      name: data.name || 'Imported customer',
      phone: data.phone || '',
      email: data.email || '',
      bookings: Number(data.bookings) || 0,
      totalSpent: Number(data.totalSpent) || 0,
      lastBooking: data.lastBooking || 'N/A',
      source: data.source || 'Admin Tribe',
      tag: data.tag || '',
      crmTags: data.crmTags || '',
      company: data.company || '',
      createdAt: data.createdAt || '',
      lastActivity: data.lastActivity || '',
      crmNotes: data.crmNotes || '',
      crmFields: data.crmFields || {},
      importSource: 'admintribe'
    });
    dedupeCustomers();
    return 'added';
  }
  function buildOpportunityNotes(row) {
    const details = [
      ['Pipeline', rowValue(row, ['pipeline', 'pipeline name'])],
      ['Stage', rowValue(row, ['stage', 'pipeline stage'])],
      ['Status', rowValue(row, ['status', 'opportunity status'])],
      ['Opportunity', rowValue(row, ['opportunity name', 'name'])],
      ['Tags', rowValue(row, ['tags', 'tag'])],
      ['Source', rowValue(row, ['source'])]
    ].filter(([, value]) => value);
    return details.map(([label, value]) => `${label}: ${value}`).join(' · ');
  }
  function parseCsvObjects(text) {
    const rows = [];
    const source = String(text || '').replace(/^\uFEFF/, '');
    let currentCell = '';
    let currentRow = [];
    let inQuotes = false;
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const next = source[index + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          currentCell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') index += 1;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentCell = '';
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
    if (currentCell.length || currentRow.length) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    const nonEmptyRows = rows.filter((row) => row.some((cell) => String(cell || '').trim()));
    if (!nonEmptyRows.length) return {headers: [], rows: []};
    const headers = nonEmptyRows.shift().map((header) => String(header || '').trim());
    return {
      headers,
      rows: nonEmptyRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? '').trim()])))
    };
  }
  function detectImportType(headers) {
    const normalized = headers.map((header) => normalizeHeader(header));
    if (normalized.some((header) => header.includes('invoice number') || header.includes('invoice total') || header.includes('issue date'))) {
      return 'invoices';
    }
    if (normalized.some((header) => header.includes('pipeline') || header.includes('opportunity') || header.includes('monetary value') || header === 'stage')) {
      return 'opportunities';
    }
    if (normalized.some((header) => header === 'contact name' || header === 'phone' || header === 'email' || header === 'tags')) {
      return 'contacts';
    }
    return 'unknown';
  }
  function invoiceCollectedAmount(invoice = {}) {
    const explicitPaid = Number(invoice.paidAmount);
    if (Number.isFinite(explicitPaid) && explicitPaid > 0) {
      const total = Number(invoice.total || 0);
      return total > 0 ? Math.min(explicitPaid, total) : explicitPaid;
    }
    const rawCollected = Math.max(
      Number(invoice.rawFields?.collectedAmount || 0),
      Number(invoice.rawFields?.paidAmount || 0),
      0
    );
    if (rawCollected > 0) {
      const total = Number(invoice.total || 0);
      return total > 0 ? Math.min(rawCollected, total) : rawCollected;
    }
    return normalizeInvoiceStatus(invoice.status) === 'paid' ? Number(invoice.total || 0) : 0;
  }
  function invoiceOutstandingAmount(invoice = {}) {
    const total = Number(invoice.total || 0);
    const collected = invoiceCollectedAmount(invoice);
    return Math.max(total - collected, 0);
  }
  function invoiceStatusBadge(status) {
    const normalized = normalizeInvoiceStatus(status);
    const className = normalized === 'paid'
      ? 'badge-confirmed'
      : normalized === 'draft' || normalized === 'sent' || normalized === 'partially paid' || normalized === 'open' || normalized === 'unpaid'
        ? 'badge-pending'
        : normalized === 'overdue'
          ? 'badge-noshow'
          : normalized === 'void' || normalized === 'cancelled'
            ? 'badge-cancelled'
            : 'badge-completed';
    const label = normalized
      ? normalized.replace(/\b\w/g, (character) => character.toUpperCase())
      : 'Unknown';
    return `<span class="badge ${className}">${escapeHtml(label)}</span>`;
  }
  function invoiceLineSummary(invoice) {
    const items = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
    if (!items.length) return 'No line items';
    if (items.length === 1) return items[0].name || items[0].description || 'Custom item';
    return `${items[0].name || items[0].description || 'Custom item'} +${items.length - 1} more`;
  }
  function invoiceSearchText(invoice) {
    const contact = invoiceDisplayContact(invoice);
    return [
      invoice.invoiceNumber,
      invoice.invoiceName,
      contact.name,
      contact.email,
      contact.phone,
      invoice.status,
      invoice.issueDate,
      invoice.dueDate,
      invoiceLineSummary(invoice)
    ].join(' ').toLowerCase();
  }
  function meaningfulInvoiceCustomer(customerName, customerEmail, customerPhone) {
    const normalizedName = String(customerName || '').trim().toLowerCase();
    const normalizedEmail = normalizeEmail(customerEmail);
    const normalizedPhone = normalizePhone(customerPhone);
    return Boolean(
      (normalizedName && normalizedName !== 'unknown') ||
      (normalizedEmail && normalizedEmail !== 'auto.generated@pos.payment') ||
      normalizedPhone
    );
  }
  function linkedCustomerForInvoice(invoice = {}) {
    const directId = Number(invoice.customerId || 0);
    if (directId > 0) {
      const directCustomer = customers.find((customer) => Number(customer.id || 0) === directId);
      if (directCustomer) return directCustomer;
    }
    return findCustomerForContact({
      name: invoice.customerName,
      email: invoice.customerEmail,
      phone: invoice.customerPhone
    });
  }
  function invoiceDisplayContact(invoice = {}) {
    const linkedCustomer = linkedCustomerForInvoice(invoice);
    return {
      name: String(linkedCustomer?.name || invoice.customerName || '').trim(),
      email: String(linkedCustomer?.email || invoice.customerEmail || '').trim(),
      phone: String(linkedCustomer?.phone || invoice.customerPhone || '').trim()
    };
  }
  function invoiceHasKnownCustomer(invoice = {}) {
    const contact = invoiceDisplayContact(invoice);
    return meaningfulInvoiceCustomer(contact.name, contact.email, contact.phone);
  }
  function invoiceImportKey(invoice) {
    return String(invoice.invoiceNumber || '').trim().toLowerCase()
      || [
        normalizeName(invoice.customerName),
        invoice.issueDate,
        Number(invoice.total || 0).toFixed(2)
      ].join('|');
  }
  function dedupeInvoiceLineItems(items) {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter((item) => {
      const key = [
        String(item.name || '').trim().toLowerCase(),
        String(item.description || '').trim().toLowerCase(),
        Number(item.amount || 0).toFixed(2),
        Number(item.quantity || 0),
        String(item.currency || '').trim().toUpperCase()
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function mergeInvoiceRecord(target, incoming) {
    target.invoiceName = incoming.invoiceName || target.invoiceName;
    target.invoiceNumber = incoming.invoiceNumber || target.invoiceNumber;
    target.recurring = Boolean(incoming.recurring || target.recurring);
    if ((!Number(target.customerId || 0)) && Number(incoming.customerId || 0) > 0) target.customerId = Number(incoming.customerId || 0);
    target.customerName = incoming.customerName || target.customerName;
    target.customerEmail = incoming.customerEmail || target.customerEmail;
    target.customerPhone = incoming.customerPhone || target.customerPhone;
    target.issueDate = incoming.issueDate || target.issueDate;
    target.dueDate = incoming.dueDate || target.dueDate;
    target.subTotal = Number(incoming.subTotal ?? target.subTotal ?? 0);
    target.discountAmount = Number(incoming.discountAmount ?? target.discountAmount ?? 0);
    target.taxAmount = Number(incoming.taxAmount ?? target.taxAmount ?? 0);
    target.total = Number(incoming.total ?? target.total ?? 0);
    target.paidAmount = Math.max(Number(target.paidAmount || 0), Number(incoming.paidAmount || 0));
    target.status = incoming.status || target.status;
    target.paymentMethod = incoming.paymentMethod || target.paymentMethod;
    target.notes = incoming.notes || target.notes;
    target.craftKey = incoming.craftKey || target.craftKey;
    target.durationHours = Number(incoming.durationHours ?? target.durationHours ?? 0);
    target.durationLabel = incoming.durationLabel || target.durationLabel;
    target.liveMode = incoming.liveMode || target.liveMode;
    target.importSource = incoming.importSource || target.importSource || 'admintribe';
    target.lineItems = dedupeInvoiceLineItems([...(target.lineItems || []), ...(incoming.lineItems || [])]);
    target.rawFields = mergeCrmFields(target.rawFields, incoming.rawFields);
    target.balanceDue = Number(Math.max(Number(target.total || 0) - invoiceCollectedAmount(target), 0).toFixed(2));
  }
  function importInvoicesFromCsv(rows, fileName) {
    const grouped = new Map();
    for (const row of rows) {
      const invoiceNumber = rowValue(row, ['invoice number']);
      const invoiceName = rowValue(row, ['invoice name', 'name']);
      const issueDate = isoDate(rowValue(row, ['issue date']));
      const total = parseMoney(rowValue(row, ['invoice total', 'total']));
      if (!invoiceNumber && !invoiceName && !issueDate && !total) continue;
      const lineItem = {
        name: rowValue(row, ['line item name']),
        description: rowValue(row, ['line item description']),
        amount: parseMoney(rowValue(row, ['line item amount'])),
        quantity: Number(rowValue(row, ['line item quantity'])) || 0,
        currency: rowValue(row, ['line item currency']) || 'USD',
        discount: parseMoney(rowValue(row, ['line item discount'])),
        tax: parseMoney(rowValue(row, ['line item tax'])),
        productId: rowValue(row, ['line item productid', 'line item product id']),
        priceId: rowValue(row, ['line item priceid', 'line item price id'])
      };
      const invoice = {
        invoiceName: invoiceName || 'Imported invoice',
        invoiceNumber,
        recurring: /^yes$/i.test(rowValue(row, ['recurring flag'])),
        customerId: rowValue(row, ['customer id']),
        customerName: rowValue(row, ['customer name']) || 'Unknown',
        customerEmail: rowValue(row, ['customer email', 'email']),
        customerPhone: rowValue(row, ['customer phone no', 'customer phone', 'phone']),
        issueDate: issueDate === 'N/A' ? '' : issueDate,
        dueDate: (() => {
          const value = isoDate(rowValue(row, ['due date']));
          return value === 'N/A' ? '' : value;
        })(),
        subTotal: parseMoney(rowValue(row, ['invoice sub total', 'invoice subtotal', 'sub total'])),
        discountAmount: parseMoney(rowValue(row, ['invoice discount amount', 'discount amount'])),
        taxAmount: parseMoney(rowValue(row, ['invoice tax amount', 'tax amount'])),
        total,
        paidAmount: (() => {
          const explicit = parseMoney(rowValue(row, ['paid amount', 'amount paid', 'collected amount', 'payment amount']));
          if (explicit > 0) return explicit;
          const balanceDue = parseMoney(rowValue(row, ['balance due', 'amount due', 'remaining balance']));
          return total > 0 && balanceDue >= 0 && total >= balanceDue
            ? Number(Math.max(total - balanceDue, 0).toFixed(2))
            : 0;
        })(),
        status: rowValue(row, ['status']) || 'Unknown',
        liveMode: rowValue(row, ['live mode']) || 'Unknown',
        paymentMethod: rowValue(row, ['payment method', 'collection method', 'method']),
        lineItems: [lineItem],
        rawFields: collectCrmFields(row),
        importSource: 'admintribe'
      };
      const key = invoiceImportKey(invoice);
      if (!grouped.has(key)) {
        grouped.set(key, invoice);
      } else {
        mergeInvoiceRecord(grouped.get(key), invoice);
      }
    }
  
    let added = 0;
    let updated = 0;
    const existing = new Map((invoices || []).map((invoice) => [invoiceImportKey(invoice), invoice]));
    for (const incoming of grouped.values()) {
      const existingInvoice = existing.get(invoiceImportKey(incoming));
      let targetInvoice;
      if (existingInvoice) {
        mergeInvoiceRecord(existingInvoice, incoming);
        targetInvoice = existingInvoice;
        updated += 1;
      } else {
        targetInvoice = {
          id: nextId(invoices),
          lineItems: [],
          rawFields: {},
          ...incoming
        };
        targetInvoice.balanceDue = Number(Math.max(Number(targetInvoice.total || 0) - invoiceCollectedAmount(targetInvoice), 0).toFixed(2));
        invoices.push(targetInvoice);
        added += 1;
      }
      if (meaningfulInvoiceCustomer(incoming.customerName, incoming.customerEmail, incoming.customerPhone)) {
        upsertImportedCustomer({
          name: incoming.customerName,
          phone: incoming.customerPhone,
          email: incoming.customerEmail,
          bookings: 0,
          totalSpent: incoming.total,
          lastBooking: incoming.issueDate || 'N/A',
          source: 'Admin Tribe Invoice',
          crmNotes: `Invoice ${incoming.invoiceNumber || incoming.invoiceName} · ${incoming.status} · ${invoiceLineSummary(incoming)}`,
          crmFields: {
            lastInvoiceNumber: incoming.invoiceNumber,
            lastInvoiceStatus: incoming.status,
            lastInvoiceTotal: String(incoming.total || ''),
            lastInvoiceDate: incoming.issueDate || ''
          }
        });
        const linkedCustomer = customers.find((customer) => (
          (normalizePhone(customer.phone) && normalizePhone(customer.phone) === normalizePhone(incoming.customerPhone)) ||
          (normalizeEmail(customer.email) && normalizeEmail(customer.email) === normalizeEmail(incoming.customerEmail)) ||
          (normalizeName(customer.name) && normalizeName(customer.name) === normalizeName(incoming.customerName))
        ));
        if (linkedCustomer && targetInvoice) targetInvoice.customerId = linkedCustomer.id;
      }
    }
    invoices = invoices
      .map((invoice, index) => ({...invoice, id: index + 1, lineItems: dedupeInvoiceLineItems(invoice.lineItems)}))
      .sort((left, right) => {
        const leftDate = new Date(left.issueDate || 0).getTime();
        const rightDate = new Date(right.issueDate || 0).getTime();
        return rightDate - leftDate || String(right.invoiceNumber || '').localeCompare(String(left.invoiceNumber || ''));
      });
    invoiceImportMeta = {
      lastType: 'invoices',
      fileName,
      importedAt: new Date().toISOString(),
      added,
      updated,
      recordCount: rows.length,
      replacedSeed: false
    };
    return {added, updated};
  }
  function renderImportSummary() {
    const summary = document.getElementById('crm-import-summary');
    const pill = document.getElementById('crm-import-pill');
    const title = document.getElementById('crm-import-title');
    if (!summary || !pill || !title) return;
    title.textContent = 'Secure Synced Import';
    if (!importMeta.importedAt) {
      summary.textContent = 'Export Contacts or Opportunities from Admin Tribe, then import the CSV here. Records are saved into the private Shoreline ops service and synced across signed-in sessions.';
      pill.textContent = 'No CRM import yet';
      return;
    }
    const importedAt = new Date(importMeta.importedAt).toLocaleString();
    const typeLabel = importMeta.lastType === 'opportunities' ? 'Bookings import' : 'Customers import';
    summary.textContent = `${typeLabel} from ${importMeta.fileName} on ${importedAt}: ${importMeta.added} added, ${importMeta.updated} updated. Data is stored in the private Shoreline ops service.`;
    pill.textContent = `${importMeta.recordCount} rows imported`;
  }
  function renderInvoiceImportSummary() {
    const summary = document.getElementById('invoice-import-summary');
    const pill = document.getElementById('invoice-import-pill');
    const title = document.getElementById('invoice-import-title');
    if (!summary || !pill || !title) return;
    title.textContent = 'Synced Invoice Import';
    if (!invoiceImportMeta.importedAt) {
      summary.textContent = 'Import the Admin Tribe invoice export here to keep a full payment history inside the private Shoreline ops service.';
      pill.textContent = 'No invoice import yet';
      return;
    }
    const importedAt = new Date(invoiceImportMeta.importedAt).toLocaleString();
    summary.textContent = `Invoices from ${invoiceImportMeta.fileName} on ${importedAt}: ${invoiceImportMeta.added} added, ${invoiceImportMeta.updated} updated. Data is stored in the private Shoreline ops service.`;
    pill.textContent = `${invoiceImportMeta.recordCount} rows imported`;
  }
  function filterCRM(input) {
    crmSearchQuery = String(input?.value || '').trim().toLowerCase();
    renderCRM();
  }
  function setCRMFilter(filter, btn) {
    crmViewFilter = filter;
    if (btn) {
      document.querySelectorAll('#crm-filter-row .crm-chip').forEach((chip) => chip.classList.remove('active'));
      btn.classList.add('active');
    }
    renderCRM();
  }
  function setCRMSort(value) {
    crmSortMode = value || 'recent';
    renderCRM();
  }
  function filterInvoices(input) {
    invoiceSearchQuery = String(input?.value || '').trim().toLowerCase();
    renderInvoices();
  }
  async function recalcAllInvoices() {
    if (!confirm('Recalculate every invoice from its booking? This re-applies the latest rules to all existing records: a completed rental counts as paid in full, and no-shows collapse to the $50 kept (or $0 refunded).')) return;
    const prevInvoices = JSON.parse(JSON.stringify(invoices));
    let count = 0;
    bookings.forEach((b) => {
      if (!b || normalizeBookingStatusValue(b.status) === 'draft') return;
      if (ensureLinkedInvoiceForBookingLocally(b)) count += 1;
    });
    if (!(await persistStateChange())) { invoices = prevInvoices; showToast('⚠️ Could not save — try again'); return; }
    renderInvoices();
    if (typeof renderDashboardMetrics === 'function') renderDashboardMetrics();
    if (typeof renderTodayRunSheet === 'function') renderTodayRunSheet();
    if (typeof renderUpcoming === 'function') renderUpcoming();
    if (document.getElementById('page-bookings')?.classList.contains('active')) renderBookings(currentFilter);
    showToast(`✅ Recalculated ${count} invoice${count === 1 ? '' : 's'}`);
  }
  function exportInvoicesCsv() {
    const list = sortNewestFirst(filteredInvoicesList(), (invoice) => invoiceDateValue(invoice));
    if (!list.length) { if (typeof showToast === 'function') showToast('No invoices to export for this view'); return; }
    const rows = [['Invoice', 'Customer', 'Phone', 'Email', 'Issued', 'Due', 'Items', 'Total', 'Collected', 'Remaining', 'Status']];
    list.forEach((invoice) => {
      const contact = invoiceDisplayContact(invoice);
      const remaining = invoiceOutstandingAmount(invoice);
      const status = invoiceIsOverdue(invoice) ? 'Overdue' : (remaining <= 0 ? 'Paid' : 'Open');
      rows.push([
        invoice.invoiceNumber || '',
        contact.name || 'Unknown',
        contact.phone || '',
        contact.email || '',
        invoice.issueDate || '',
        invoice.dueDate || '',
        invoiceLineSummary(invoice),
        Number(invoice.total || 0).toFixed(2),
        invoiceCollectedAmount(invoice).toFixed(2),
        remaining.toFixed(2),
        status
      ]);
    });
    const csv = rows.map((row) => row.map((cell) => {
      const text = String(cell);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const stamp = new Date();
    link.download = `shoreline-invoices-${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (typeof showToast === 'function') showToast(`✅ Exported ${list.length} invoice${list.length === 1 ? '' : 's'}`);
  }
  function formatFilterDateText(value = '') {
    return value ? formatShortDate(value) : '—';
  }
  function invoiceDateBasisLabel() {
    if (invoiceDateBasis === 'due') return 'due dates';
    if (invoiceDateBasis === 'booked') return 'booked days';
    return 'issued dates';
  }
  function updateInvoiceFilters() {
    const basisEl = document.getElementById('invoice-date-basis');
    const periodEl = document.getElementById('invoice-period-filter');
    const fromEl = document.getElementById('invoice-date-from');
    const toEl = document.getElementById('invoice-date-to');
    const summaryEl = document.getElementById('invoice-filter-summary');
    invoiceDateBasis = basisEl?.value || 'issue';
    invoicePeriodFilter = periodEl?.value || 'all';
    invoiceStatusFilter = document.getElementById('invoice-status-filter')?.value || 'all';
    invoiceDateFrom = fromEl?.value || '';
    invoiceDateTo = toEl?.value || '';
    if (summaryEl) {
      const statusSuffix = invoiceStatusFilter === 'open' ? ' · open balance'
        : invoiceStatusFilter === 'overdue' ? ' · overdue'
        : invoiceStatusFilter === 'paid' ? ' · paid'
        : '';
      const label = (invoicePeriodFilter === 'today'
        ? `Showing today's ${invoiceDateBasisLabel()}`
        : invoicePeriodFilter === 'week'
        ? `Showing this week's ${invoiceDateBasisLabel()}`
        : invoicePeriodFilter === 'month'
          ? `Showing this month's ${invoiceDateBasisLabel()}`
          : invoicePeriodFilter === 'year'
            ? `Showing this year's ${invoiceDateBasisLabel()}`
            : invoicePeriodFilter === 'custom'
              ? `Showing ${formatFilterDateText(invoiceDateFrom)} to ${formatFilterDateText(invoiceDateTo)} by ${invoiceDateBasisLabel()}`
              : `Showing all invoices by ${invoiceDateBasisLabel()}`) + statusSuffix;
      summaryEl.textContent = label;
    }
    renderInvoices();
  }
  function invoiceDurationText(duration) {
    const hours = Number(duration || 0);
    if (!hours) return '';
    return hours === 8 ? 'Full Day (8 hours)' : `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  function populateInvoiceDurationOptions(craftKey = '', selectedDuration = '') {
    const durationEl = document.getElementById('i-duration');
    if (!durationEl) return;
    const availableDurations = Object.keys(PRICING[craftKey] || {})
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((left, right) => left - right);
    renderOpsMarkup(durationEl, ['<option value="">Select duration</option>']
      .concat(availableDurations.map((duration) => (
        `<option value="${duration}">${escapeHtml(invoiceDurationText(duration))}</option>`
      )))
      .join(''));
    durationEl.value = availableDurations.includes(Number(selectedDuration)) ? String(Number(selectedDuration)) : '';
  }
  function updateInvoiceRentalHelper(message = 'Pick a rental package and duration to auto-fill the title, line item, and amount. For a quick manual invoice, just enter the amount.') {
    const helper = document.getElementById('invoice-rental-helper');
    if (helper) helper.textContent = message;
  }
  function toggleInvoicePaymentMethodCustom() {
    const select = document.getElementById('i-payment-method');
    const customWrap = document.getElementById('invoice-payment-method-custom-wrap');
    const customInput = document.getElementById('i-payment-method-custom');
    if (!select || !customWrap || !customInput) return;
    const showCustom = select.value === 'Other';
    customWrap.style.display = showCustom ? '' : 'none';
    if (!showCustom) customInput.value = '';
  }
  function setInvoicePaymentMethod(method = '') {
    const select = document.getElementById('i-payment-method');
    const customInput = document.getElementById('i-payment-method-custom');
    if (!select || !customInput) return;
    const value = String(method || '').trim();
    const knownValues = Array.from(select.options).map((option) => option.value);
    if (!value) {
      select.value = '';
      customInput.value = '';
      toggleInvoicePaymentMethodCustom();
      return;
    }
    if (knownValues.includes(value) && value !== 'Other') {
      select.value = value;
      customInput.value = '';
    } else {
      select.value = 'Other';
      customInput.value = value;
    }
    toggleInvoicePaymentMethodCustom();
  }
  function getInvoicePaymentMethod() {
    const select = document.getElementById('i-payment-method');
    const customInput = document.getElementById('i-payment-method-custom');
    if (!select) return '';
    if (select.value === 'Other') return customInput?.value.trim() || '';
    return String(select.value || '').trim();
  }
  function buildInvoiceTitle(packageKey = '', durationHours = 0, lineItemName = '') {
    const craftLabel = CRAFT_NAMES[packageKey] || '';
    const durationLabel = durationHours ? invoiceDurationText(durationHours) : '';
    if (craftLabel && durationLabel) return `${craftLabel} rental`;
    if (craftLabel) return `${craftLabel} invoice`;
    if (lineItemName) return lineItemName;
    return 'Walk-up rental';
  }
  function buildInvoiceLineItem(packageKey = '', durationHours = 0, invoiceName = '') {
    const craftLabel = CRAFT_NAMES[packageKey] || '';
    const durationLabel = durationHours ? invoiceDurationText(durationHours) : '';
    if (craftLabel && durationLabel) return `${craftLabel} • ${durationLabel}`;
    if (craftLabel) return craftLabel;
    if (invoiceName) return invoiceName;
    return 'Rental charge';
  }
  function invoiceStatusSelectValue(status = '') {
    const normalized = normalizeInvoiceStatus(status);
    if (normalized === 'paid') return 'Paid';
    if (normalized === 'partially paid') return 'Partially Paid';
    if (normalized === 'draft') return 'Draft';
    if (normalized === 'sent') return 'Sent';
    return 'Open';
  }
  function updateInvoicePaymentHelper(message = '') {
    const helper = document.getElementById('invoice-payment-helper');
    if (!helper) return;
    const total = Math.max(0, Number(document.getElementById('i-total')?.value || 0));
    const rawPaid = Math.max(0, Number(document.getElementById('i-paid-amount')?.value || 0));
    const normalizedStatus = normalizeInvoiceStatus(document.getElementById('i-status')?.value || 'open');
    const collected = normalizedStatus === 'paid'
      ? total
      : Math.min(rawPaid, total || rawPaid);
    const remaining = Math.max(total - collected, 0);
    const balanceInput = document.getElementById('i-balance-due');
    if (balanceInput) balanceInput.value = remaining ? remaining.toFixed(2) : '0.00';
    helper.textContent = `${message ? `${message} ` : ''}Collected ${moneyLabel(collected)} • Remaining ${moneyLabel(remaining)}. Mark the invoice paid when you collect the full balance.`;
  }
  function suggestedInvoiceAmount(packageKey = '', duration = 0) {
    return Number(PRICING[packageKey]?.[Number(duration || 0)] || 0);
  }
  function setInvoiceAmountManualStateFromCurrentForm() {
    const packageKey = document.getElementById('i-package')?.value || '';
    const duration = Number(document.getElementById('i-duration')?.value || 0);
    const total = Math.max(0, Number(document.getElementById('i-total')?.value || 0));
    const suggested = suggestedInvoiceAmount(packageKey, duration);
    invoiceAmountManuallyEdited = Boolean(packageKey && duration && total > 0 && suggested > 0 && Math.abs(total - suggested) > 0.009);
  }
  function handleInvoiceAmountInput() {
    setInvoiceAmountManualStateFromCurrentForm();
    const packageKey = document.getElementById('i-package')?.value || '';
    const duration = Number(document.getElementById('i-duration')?.value || 0);
    const total = Math.max(0, Number(document.getElementById('i-total')?.value || 0));
    const suggested = suggestedInvoiceAmount(packageKey, duration);
    if (invoiceAmountManuallyEdited && packageKey && duration && suggested > 0) {
      updateInvoiceRentalHelper(`Custom amount kept at ${moneyLabel(total)}. Package default is ${moneyLabel(suggested)}.`);
    }
    updateInvoicePaymentHelper();
  }
  function applyInvoiceRentalAutofill() {
    const packageEl = document.getElementById('i-package');
    const durationEl = document.getElementById('i-duration');
    const invoiceNameEl = document.getElementById('i-invoice-name');
    const lineItemEl = document.getElementById('i-line-item');
    const totalEl = document.getElementById('i-total');
    const craftKey = packageEl?.value || '';
    const duration = Number(durationEl?.value || 0);
    if (!craftKey) {
      updateInvoiceRentalHelper();
      return;
    }
    if (!duration) {
      updateInvoiceRentalHelper(`Choose how long the ${CRAFT_NAMES[craftKey] || 'rental'} was out to auto-fill the amount.`);
      return;
    }
    const amount = Number(PRICING[craftKey]?.[duration] || 0);
    if (!amount) {
      updateInvoiceRentalHelper('That duration is not available for this rental package.');
      return;
    }
    const craftLabel = CRAFT_NAMES[craftKey] || 'Rental';
    const durationLabel = invoiceDurationText(duration);
    if (invoiceNameEl) invoiceNameEl.value = `${craftLabel} rental`;
    if (lineItemEl) lineItemEl.value = `${craftLabel} • ${durationLabel}`;
    if (totalEl && !invoiceAmountManuallyEdited) {
      totalEl.value = amount.toFixed(2);
      updateInvoiceRentalHelper(`${craftLabel} • ${durationLabel} auto-filled to ${moneyLabel(amount)}.`);
    } else {
      updateInvoiceRentalHelper(`Custom amount kept. ${craftLabel} • ${durationLabel} normally prices at ${moneyLabel(amount)}.`);
    }
    updateInvoicePaymentHelper();
  }
  function handleInvoicePackageChange() {
    const packageEl = document.getElementById('i-package');
    const craftKey = packageEl?.value || '';
    invoiceAmountManuallyEdited = false;
    populateInvoiceDurationOptions(craftKey);
    if (!craftKey) {
      updateInvoiceRentalHelper();
      return;
    }
    applyInvoiceRentalAutofill();
  }
  function handleInvoiceDurationChange() {
    invoiceAmountManuallyEdited = false;
    applyInvoiceRentalAutofill();
  }
  function createManualInvoiceNumber() {
    const datePart = today().replace(/-/g, '');
    const existingCount = invoices.filter((invoice) => String(invoice.invoiceNumber || '').startsWith(`SLA-${datePart}-`)).length + 1;
    return `SLA-${datePart}-${String(existingCount).padStart(3, '0')}`;
  }
  function linkedBookingForInvoiceRecord(invoice = {}) {
    const bookingId = Number(invoice?.bookingId || invoice?.rawFields?.bookingId || 0);
    const bookingToken = String(invoice?.bookingPublicToken || invoice?.rawFields?.bookingPublicToken || '').trim();
    const paymentSessionId = String(invoice?.paymentSessionId || invoice?.rawFields?.paymentSessionId || '').trim();
    const paymentIntentId = String(invoice?.paymentIntentId || invoice?.rawFields?.paymentIntentId || '').trim();
    return bookings.find((booking) => (
      (bookingId > 0 && Number(booking.id || 0) === bookingId) ||
      (bookingToken && String(booking.publicToken || '').trim() === bookingToken) ||
      (paymentSessionId && String(booking.paymentSessionId || '').trim() === paymentSessionId) ||
      (paymentIntentId && String(booking.paymentIntentId || '').trim() === paymentIntentId)
    )) || null;
  }
  function linkedBookingIdForInvoiceRecord(invoice = {}) {
    const directId = Number(invoice?.bookingId || invoice?.rawFields?.bookingId || 0);
    if (directId > 0) return directId;
    return Number(linkedBookingForInvoiceRecord(invoice)?.id || 0);
  }
  function syncedBookingInvoiceTotal(invoice = {}) {
    const booking = linkedBookingForInvoiceRecord(invoice);
    if (!booking) return 0;
    return Number((Number(booking.total || 0) + bookingProcessingFeeValue(booking)).toFixed(2));
  }
  function bookingDepositAmountValue(booking = {}) {
    const explicit = Number(booking.depositAmount);
    if (Number.isFinite(explicit) && explicit >= 0) return explicit;
    return bookingUsesCheckoutDepositFlow(booking) ? DEFAULT_BOOKING_DEPOSIT : 0;
  }
  function bookingProcessingFeeValue(booking = {}) {
    const explicit = Number(booking.processingFeeAmount);
    if (Number.isFinite(explicit) && explicit >= 0) return explicit;
    return bookingUsesCheckoutDepositFlow(booking) ? DEFAULT_PROCESSING_FEE : 0;
  }
  function bookingDueTodayValue(booking = {}) {
    const explicit = Number(booking.amountDueToday);
    if (Number.isFinite(explicit) && explicit >= 0) return explicit;
    return Number((bookingDepositAmountValue(booking) + bookingProcessingFeeValue(booking)).toFixed(2));
  }
  function bookingUsesCheckoutDepositFlow(booking = {}) {
    const source = bookingSourceValue(booking);
    const explicitDueToday = Number(booking.amountDueToday);
    const explicitProcessingFee = Number(booking.processingFeeAmount);
    const total = Number((
      Number(booking.total || 0) + (
        Number.isFinite(explicitProcessingFee) && explicitProcessingFee >= 0
          ? explicitProcessingFee
          : 0
      )
    ).toFixed(2));
    return Boolean(
      String(booking.publicToken || '').trim() ||
      String(booking.paymentSessionId || '').trim() ||
      source.includes('website') ||
      source.includes('stripe') ||
      source.includes('public') ||
      (Number.isFinite(explicitDueToday) && explicitDueToday > 0 && total > 0 && explicitDueToday < total)
    );
  }
  function invoiceMatchesBookingRecord(invoice = {}, booking = {}) {
    const bookingId = Number(booking.id || 0);
    const bookingToken = String(booking.publicToken || '').trim();
    const paymentSessionId = String(booking.paymentSessionId || '').trim();
    const paymentIntentId = String(booking.paymentIntentId || '').trim();
    if (!bookingId && !bookingToken && !paymentSessionId && !paymentIntentId) return false;
    return Boolean(
      (bookingId > 0 && Number(invoice.bookingId || 0) === bookingId) ||
      (bookingId > 0 && String(invoice.rawFields?.bookingId || '').trim() === String(bookingId)) ||
      (bookingToken && (
        String(invoice.bookingPublicToken || '').trim() === bookingToken ||
        String(invoice.rawFields?.bookingPublicToken || '').trim() === bookingToken
      )) ||
      (paymentSessionId && (
        String(invoice.paymentSessionId || '').trim() === paymentSessionId ||
        String(invoice.rawFields?.paymentSessionId || '').trim() === paymentSessionId
      )) ||
      (paymentIntentId && (
        String(invoice.paymentIntentId || '').trim() === paymentIntentId ||
        String(invoice.rawFields?.paymentIntentId || '').trim() === paymentIntentId
      ))
    );
  }
  function linkedInvoiceForBookingRecord(booking = {}) {
    return invoices.find((invoice) => invoiceMatchesBookingRecord(invoice, booking)) || null;
  }
  function bookingInvoiceHasManualOverrideLocally(existingInvoice = null, booking = {}) {
    if (!existingInvoice) return false;
    const rawFields = existingInvoice.rawFields || {};
    const explicitFlag = String(rawFields.manualBookingInvoiceOverride || '').trim().toLowerCase();
    if (explicitFlag === 'true') return true;
    const manualTotal = Number(rawFields.manualTotalOverride || 0);
    const syncedTotal = Number((Number(booking.total || 0) + bookingProcessingFeeValue(booking)).toFixed(2));
    if (manualTotal > 0 && Math.abs(manualTotal - syncedTotal) > 0.009) return true;
    const savedTotal = Number(existingInvoice.total || 0);
    return savedTotal > 0 && Math.abs(savedTotal - syncedTotal) > 0.009;
  }
  function effectiveInvoiceTotalForBookingLocally(existingInvoice = null, booking = {}) {
    if (bookingInvoiceHasManualOverrideLocally(existingInvoice, booking)) {
      const manualTotal = Number(existingInvoice?.rawFields?.manualTotalOverride || existingInvoice?.total || 0);
      if (manualTotal > 0) return Number(manualTotal.toFixed(2));
    }
    return Number((Number(booking.total || 0) + bookingProcessingFeeValue(booking)).toFixed(2));
  }
  function collectedAmountForLinkedBookingInvoice(existingInvoice = null, booking = {}) {
    const total = effectiveInvoiceTotalForBookingLocally(existingInvoice, booking);
    const existingPaidAmount = Number(existingInvoice?.paidAmount || 0);
    const existingCollected = Math.min(existingPaidAmount, total || existingPaidAmount);
    if (!bookingIsPaid(booking)) return Number(existingCollected.toFixed(2));
    if (bookingUsesCheckoutDepositFlow(booking)) {
      const dueToday = bookingDueTodayValue(booking);
      if (dueToday > 0) {
        return Number(Math.max(existingCollected, Math.min(dueToday, total)).toFixed(2));
      }
    }
    if (existingPaidAmount > 0) return Number(existingCollected.toFixed(2));
    return total > 0 ? total : Number(existingCollected.toFixed(2));
  }
  function linkedBookingInvoiceStatus(existingInvoice = null, booking = {}) {
    const normalizedBookingStatus = normalizeBookingStatusValue(booking.status);
    if (['cancelled', 'canceled', 'void'].includes(normalizedBookingStatus)) return 'Cancelled';
    const total = effectiveInvoiceTotalForBookingLocally(existingInvoice, booking);
    const collected = collectedAmountForLinkedBookingInvoice(existingInvoice, booking);
    if (collected >= total && total > 0) return 'Paid';
    if (collected > 0) return 'Partially Paid';
    if (normalizedBookingStatus === 'draft') return 'Draft';
    if (String(booking.paymentStatus || '').trim().toLowerCase() === 'pending') return 'Sent';
    return 'Open';
  }
  function ensureLinkedInvoiceForBookingLocally(booking = {}) {
    if (!booking || !Number(booking.id || 0) || normalizeBookingStatusValue(booking.status) === 'draft' || booking.invoiceSuppressed) return null;
    const existingInvoice = linkedInvoiceForBookingRecord(booking);
    const nowIso = new Date().toISOString();
    const existingIssueDate = String(existingInvoice?.issueDate || '').trim();
    const issueDate = existingIssueDate
      || inputDateValue(booking.updatedAt || booking.createdAt || nowIso)
      || today();
    const previousBookingDate = String(existingInvoice?.rawFields?.bookingDate || '').trim();
    const existingDueDate = String(existingInvoice?.dueDate || '').trim();
    const nextAutoDueDate = booking.date && booking.date !== 'TBD' ? booking.date : issueDate;
    const dueDate = existingDueDate && ![previousBookingDate, existingIssueDate].includes(existingDueDate)
      ? existingDueDate
      : nextAutoDueDate;
    const syncedRentalTotal = Number(booking.total || 0);
    const syncedProcessingFee = bookingProcessingFeeValue(booking);
    const syncedTotal = Number((syncedRentalTotal + syncedProcessingFee).toFixed(2));
    const hasManualOverride = bookingInvoiceHasManualOverrideLocally(existingInvoice, booking);
    let total = hasManualOverride ? effectiveInvoiceTotalForBookingLocally(existingInvoice, booking) : syncedTotal;
    let collected = collectedAmountForLinkedBookingInvoice(existingInvoice, booking);
    // No-show / cancelled: collapse to just the deposit kept (or $0 if refunded) so a
    // phantom full-rental balance doesn't show as still owed and the kept deposit
    // stays counted. Mirrors the server's ensureBookingInvoice.
    let effectiveRental = syncedRentalTotal;
    let effectiveFee = syncedProcessingFee;
    const bookingStatusForInvoice = normalizeBookingStatusValue(booking.status);
    if (!hasManualOverride && (bookingStatusForInvoice === 'noshow' || bookingStatusForInvoice === 'cancelled')) {
      const keptDeposit = booking.depositRefunded ? 0 : (Number(booking.depositAmount) || 50);
      effectiveRental = keptDeposit;
      effectiveFee = 0;
      total = keptDeposit;
      collected = Math.min(collected, keptDeposit);
    }
    const defaultInvoiceName = `${bookingCraftLabel(booking)} booking`;
    const defaultLineItems = [{
      name: `${bookingCraftLabel(booking)} • ${bookingDurationLabel(booking) || 'Custom duration'}`,
      description: `Booking for ${booking.date || 'TBD'} at ${formatTimeLabel(booking.time)}`,
      amount: syncedRentalTotal,
      quantity: 1,
      currency: 'USD'
    }];
    if (syncedProcessingFee > 0) {
      defaultLineItems.push({
        name: 'Processing Fee',
        description: 'Secure checkout and card processing fee',
        amount: syncedProcessingFee,
        quantity: 1,
        currency: 'USD'
      });
    }
    const invoice = existingInvoice || {
      id: nextId(invoices),
      invoiceNumber: createManualInvoiceNumber(),
      recurring: false,
      lineItems: [],
      rawFields: {},
      importSource: 'booking',
      liveMode: 'Booking',
      createdAt: nowIso
    };
    invoice.bookingId = Number(booking.id || 0);
    invoice.bookingPublicToken = String(booking.publicToken || '').trim();
    invoice.paymentSessionId = String(booking.paymentSessionId || '').trim();
    invoice.paymentIntentId = String(booking.paymentIntentId || '').trim();
    invoice.invoiceName = hasManualOverride
      ? String(existingInvoice?.invoiceName || defaultInvoiceName).trim() || defaultInvoiceName
      : defaultInvoiceName;
    invoice.customerId = Number(booking.customerId || 0) || invoice.customerId || '';
    invoice.customerName = String(booking.name || invoice.customerName || '').trim() || 'Walk-up booking';
    invoice.customerPhone = String(booking.phone || invoice.customerPhone || '').trim();
    invoice.customerEmail = String(booking.email || invoice.customerEmail || '').trim();
    invoice.issueDate = issueDate;
    invoice.dueDate = dueDate;
    invoice.subTotal = hasManualOverride ? Number(existingInvoice?.subTotal || syncedRentalTotal || 0) : effectiveRental;
    invoice.discountAmount = 0;
    invoice.taxAmount = hasManualOverride ? Number(existingInvoice?.taxAmount || 0) : effectiveFee;
    invoice.total = total;
    invoice.paidAmount = Number(collected.toFixed(2));
    invoice.balanceDue = Number(Math.max(total - collected, 0).toFixed(2));
    invoice.status = linkedBookingInvoiceStatus(existingInvoice, booking);
    invoice.notes = String(booking.notes || invoice.notes || '').trim();
    invoice.craftKey = String(booking.craftKey || normalizeCraftKey(booking.craft || '') || '').trim();
    invoice.durationHours = Number(booking.duration || 0);
    invoice.durationLabel = bookingDurationLabel(booking);
    invoice.lineItems = hasManualOverride && Array.isArray(existingInvoice?.lineItems) && existingInvoice.lineItems.length
      ? existingInvoice.lineItems
      : defaultLineItems;
    invoice.rawFields = mergeCrmFields(invoice.rawFields, {
      source: 'linked booking',
      bookingId: String(booking.id || ''),
      bookingPublicToken: String(booking.publicToken || ''),
      paymentSessionId: String(booking.paymentSessionId || ''),
      paymentIntentId: String(booking.paymentIntentId || ''),
      paymentStatus: String(booking.paymentStatus || ''),
      bookingStatus: String(booking.status || ''),
      rentalPackage: String(booking.craftKey || ''),
      rentalPackageLabel: String(booking.craftLabel || ''),
      rentalDurationHours: String(booking.duration || ''),
      rentalDurationLabel: bookingDurationLabel(booking),
      depositAmount: String(bookingDepositAmountValue(booking).toFixed(2)),
      processingFeeAmount: String(syncedProcessingFee.toFixed(2)),
      amountDueToday: String(bookingDueTodayValue(booking).toFixed(2)),
      bookingDate: String(booking.date || ''),
      bookingTime: String(booking.time || ''),
      manualBookingInvoiceOverride: hasManualOverride ? 'true' : '',
      manualTotalOverride: hasManualOverride ? String(total.toFixed(2)) : ''
    });
    if (!existingInvoice) invoices.unshift(invoice);
    return invoice;
  }
  function setInvoiceCustomerContext(customer = null) {
    const resolvedCustomer = customer && Number(customer.id) ? customer : null;
    invoiceCustomerContextId = resolvedCustomer ? Number(resolvedCustomer.id) : null;
    document.getElementById('i-customer-name').value = resolvedCustomer?.name || '';
    document.getElementById('i-customer-phone').value = resolvedCustomer?.phone || '';
    document.getElementById('i-customer-email').value = resolvedCustomer?.email || '';
  }
  function latestOpenInvoiceForCustomer(customerId) {
    const targetId = Number(customerId || 0);
    if (!targetId) return null;
    return invoices
      .filter((invoice) => Number(linkedCustomerForInvoice(invoice)?.id || 0) === targetId)
      .filter((invoice) => {
        const normalized = normalizeInvoiceStatus(invoice.status);
        return invoiceOutstandingAmount(invoice) > 0 || ['draft', 'sent', 'open', 'partially paid', 'unpaid', 'overdue'].includes(normalized);
      })
      .sort((left, right) => {
        const leftDate = dateValue(left.issueDate || left.dueDate);
        const rightDate = dateValue(right.issueDate || right.dueDate);
        const leftTime = leftDate ? leftDate.getTime() : 0;
        const rightTime = rightDate ? rightDate.getTime() : 0;
        return rightTime - leftTime || Number(right.id || 0) - Number(left.id || 0);
      })[0] || null;
  }
  function resetInvoiceForm() {
    editingInvoiceId = null;
    setInvoiceCustomerContext(null);
    invoiceAmountManuallyEdited = false;
    document.getElementById('i-invoice-name').value = '';
    document.getElementById('i-issue-date').value = today();
    document.getElementById('i-due-date').value = today();
    document.getElementById('i-package').value = '';
    populateInvoiceDurationOptions('');
    document.getElementById('i-line-item').value = '';
    document.getElementById('i-total').value = '';
    document.getElementById('i-status').value = 'Paid';
    document.getElementById('i-paid-amount').value = '';
    document.getElementById('i-balance-due').value = '0.00';
    setInvoicePaymentMethod('');
    document.getElementById('i-notes').value = '';
    updateInvoiceRentalHelper();
    updateInvoicePaymentHelper();
    document.getElementById('invoice-modal-title').textContent = 'New Invoice';
    document.getElementById('invoice-save-button').textContent = 'Save Invoice';
  }
  function openInvoiceModalForCustomer(customerId, mode = 'invoice') {
    const customer = customers.find((item) => Number(item.id) === Number(customerId));
    if (!customer) {
      showToast('⚠️ Customer record not found');
      return;
    }
    if (mode === 'payment') {
      const openInvoice = latestOpenInvoiceForCustomer(customer.id);
      if (openInvoice) {
        openInvoiceModal(Number(openInvoice.id));
        return;
      }
    }
    resetInvoiceForm();
    setInvoiceCustomerContext(customer);
    document.getElementById('i-status').value = mode === 'payment' ? 'Paid' : 'Open';
    updateInvoicePaymentHelper(mode === 'payment' ? 'Record a payment for this customer.' : 'Create an invoice for this customer.');
    document.getElementById('invoice-modal-title').textContent = 'New Invoice';
    document.getElementById('invoice-save-button').textContent = 'Save Invoice';
    openModal('invoice-modal');
  }
  function openInvoiceModal(invoiceId = null) {
    resetInvoiceForm();
    if (invoiceId !== null && invoiceId !== undefined) {
      const invoice = invoices.find((item) => Number(item.id) === Number(invoiceId));
      if (!invoice) {
        showToast('⚠️ Invoice record not found');
        return;
      }
      const contact = invoiceDisplayContact(invoice);
      const linkedCustomer = linkedCustomerForInvoice(invoice);
      editingInvoiceId = Number(invoice.id);
      setInvoiceCustomerContext(linkedCustomer);
      if (!linkedCustomer) {
        document.getElementById('i-customer-name').value = contact.name || '';
        document.getElementById('i-customer-phone').value = contact.phone || '';
        document.getElementById('i-customer-email').value = contact.email || '';
      }
      document.getElementById('i-invoice-name').value = invoice.invoiceName || '';
      document.getElementById('i-issue-date').value = invoice.issueDate || today();
      document.getElementById('i-due-date').value = invoice.dueDate || invoice.issueDate || today();
      const inferredCraft = invoice.craftKey || invoice.rawFields?.rentalPackage || guessCraftFromText(invoice.invoiceName || invoiceLineSummary(invoice));
      const inferredDuration = Number(invoice.durationHours || invoice.rawFields?.rentalDurationHours || guessDurationFromText(invoice.invoiceName || invoiceLineSummary(invoice)) || 0);
      document.getElementById('i-package').value = inferredCraft && inferredCraft !== 'imported' ? inferredCraft : '';
      populateInvoiceDurationOptions(document.getElementById('i-package').value, inferredDuration);
      document.getElementById('i-line-item').value = Array.isArray(invoice.lineItems) && invoice.lineItems[0] ? (invoice.lineItems[0].name || invoice.lineItems[0].description || '') : '';
      document.getElementById('i-total').value = String(Number(invoice.total || 0) || '');
      setInvoiceAmountManualStateFromCurrentForm();
      document.getElementById('i-status').value = invoiceStatusSelectValue(invoice.status);
      document.getElementById('i-paid-amount').value = invoiceCollectedAmount(invoice) ? String(invoiceCollectedAmount(invoice)) : '';
      document.getElementById('i-balance-due').value = invoiceOutstandingAmount(invoice).toFixed(2);
      setInvoicePaymentMethod(invoice.paymentMethod || invoice.rawFields?.paymentMethod || '');
      document.getElementById('i-notes').value = invoice.notes || '';
      if (document.getElementById('i-package').value && document.getElementById('i-duration').value) {
        updateInvoiceRentalHelper(`${CRAFT_NAMES[document.getElementById('i-package').value] || 'Rental'} • ${invoiceDurationText(document.getElementById('i-duration').value)} loaded from this invoice.`);
      }
      updateInvoicePaymentHelper();
      document.getElementById('invoice-modal-title').textContent = 'Edit Invoice';
      document.getElementById('invoice-save-button').textContent = 'Save Changes';
    }
    openModal('invoice-modal');
  }
  async function saveInvoice() {
    const customerName = document.getElementById('i-customer-name').value.trim();
    const rawInvoiceName = document.getElementById('i-invoice-name').value.trim();
    const rawLineItemName = document.getElementById('i-line-item').value.trim();
    const total = Math.max(0, Number(document.getElementById('i-total').value || 0));
    if (!total) {
      showToast('⚠️ Enter an amount or choose a rental package');
      return;
    }
    const existingInvoice = editingInvoiceId
      ? invoices.find((invoice) => Number(invoice.id) === Number(editingInvoiceId))
      : null;
    const previousInvoices = JSON.parse(JSON.stringify(invoices));
    const previousCustomers = JSON.parse(JSON.stringify(customers));
    const previousBookings = JSON.parse(JSON.stringify(bookings));
    const previousInvoiceSnapshot = existingInvoice ? JSON.parse(JSON.stringify(existingInvoice)) : null;
    const previousCustomer = previousInvoiceSnapshot ? linkedCustomerForInvoice(previousInvoiceSnapshot) : null;
    if (editingInvoiceId && !existingInvoice) {
      showToast('⚠️ Invoice record not found');
      return;
    }
  
    const issueDate = document.getElementById('i-issue-date').value || today();
    const dueDate = document.getElementById('i-due-date').value || issueDate;
    const status = document.getElementById('i-status').value || 'Paid';
    const packageKey = document.getElementById('i-package').value || '';
    const durationHours = Number(document.getElementById('i-duration').value || 0);
    const invoiceName = rawInvoiceName || buildInvoiceTitle(packageKey, durationHours, rawLineItemName);
    const lineItemName = rawLineItemName || buildInvoiceLineItem(packageKey, durationHours, invoiceName);
    const phone = document.getElementById('i-customer-phone').value.trim();
    const email = document.getElementById('i-customer-email').value.trim();
    const hasMeaningfulCustomer = meaningfulInvoiceCustomer(customerName, email, phone);
    const customerLabel = customerName || email || phone || '';
    const explicitPaidAmount = Math.max(0, Number(document.getElementById('i-paid-amount').value || 0));
    const paymentMethod = getInvoicePaymentMethod();
    const notes = document.getElementById('i-notes').value.trim();
    const linkedBookingRecord = existingInvoice ? linkedBookingForInvoiceRecord(existingInvoice) : null;
    const bookingLinkedInvoice = Boolean(linkedBookingRecord);
    const syncedBookingTotal = bookingLinkedInvoice
      ? Number((Number(linkedBookingRecord.total || 0) + bookingProcessingFeeValue(linkedBookingRecord)).toFixed(2))
      : 0;
    const keepManualBookingOverride = Boolean(
      bookingLinkedInvoice &&
      (
        invoiceAmountManuallyEdited ||
        (syncedBookingTotal > 0 && Math.abs(total - syncedBookingTotal) > 0.009)
      )
    );
    let paidAmount = Math.min(explicitPaidAmount, total);
    let finalStatus = invoiceStatusSelectValue(status);
    if (finalStatus === 'Paid') {
      paidAmount = total;
    } else if (paidAmount >= total && total > 0) {
      paidAmount = total;
      finalStatus = 'Paid';
    } else if (paidAmount > 0) {
      finalStatus = 'Partially Paid';
    } else if (finalStatus === 'Partially Paid') {
      finalStatus = 'Open';
    }
    const fullyPaidInvoice = finalStatus === 'Paid' || (total > 0 && paidAmount >= (total - 0.009));
    const partialInvoicePayment = paidAmount > 0 && !fullyPaidInvoice;
  
    const invoice = existingInvoice || {
      id: nextId(invoices),
      invoiceNumber: createManualInvoiceNumber(),
      recurring: false,
      lineItems: [],
      rawFields: {},
      importSource: 'manual',
      liveMode: 'Manual',
      createdAt: new Date().toISOString()
    };
  
    invoice.invoiceName = invoiceName;
    invoice.customerName = customerLabel;
    invoice.customerPhone = phone;
    invoice.customerEmail = email;
    invoice.issueDate = issueDate;
    invoice.dueDate = dueDate;
    invoice.subTotal = total;
    invoice.discountAmount = 0;
    invoice.taxAmount = 0;
    invoice.total = total;
    invoice.status = finalStatus;
    invoice.paidAmount = paidAmount;
    invoice.balanceDue = Math.max(total - paidAmount, 0);
    invoice.paymentMethod = paymentMethod;
    invoice.notes = notes;
    invoice.craftKey = packageKey || '';
    invoice.durationHours = durationHours || 0;
    invoice.durationLabel = durationHours ? invoiceDurationText(durationHours) : '';
    invoice.lineItems = [{
      name: lineItemName,
      description: notes,
      amount: total,
      quantity: 1,
      currency: 'USD'
    }];
    invoice.rawFields = mergeCrmFields(invoice.rawFields, {
      source: 'manual invoice',
      notes,
      rentalPackage: packageKey,
      rentalPackageLabel: packageKey ? (CRAFT_NAMES[packageKey] || '') : '',
      rentalDurationHours: durationHours ? String(durationHours) : '',
      rentalDurationLabel: durationHours ? invoiceDurationText(durationHours) : '',
      balanceDue: String(invoice.balanceDue || 0),
      paymentMethod,
      collectedAmount: paidAmount ? String(paidAmount) : '',
      manualBookingInvoiceOverride: keepManualBookingOverride ? 'true' : '',
      manualTotalOverride: keepManualBookingOverride ? String(total.toFixed(2)) : ''
    });
  
    if (!existingInvoice) invoices.unshift(invoice);
  
    let customer = null;
    const contextualCustomer = invoiceCustomerContextId
      ? customers.find((item) => Number(item.id) === Number(invoiceCustomerContextId))
      : null;
    if (hasMeaningfulCustomer || contextualCustomer) {
      customer = contextualCustomer || customers.find((item) => (
        (normalizePhone(item.phone) && normalizePhone(item.phone) === normalizePhone(phone)) ||
        (normalizeEmail(item.email) && normalizeEmail(item.email) === normalizeEmail(email)) ||
        (normalizeName(item.name) && normalizeName(item.name) === normalizeName(customerName))
      ));
      if (customer) {
        customer.name = customerName || customer.name;
        customer.phone = phone || customer.phone;
        customer.email = email || customer.email;
        customer.lastActivity = new Date().toISOString();
        customer.source = customer.source || 'Manual Invoice';
        customer.crmNotes = notes || customer.crmNotes || '';
        customer.crmFields = mergeCrmFields(customer.crmFields, {
          lastManualInvoiceNumber: invoice.invoiceNumber,
          lastManualInvoiceStatus: finalStatus,
          lastManualInvoiceTotal: String(total),
          lastManualInvoiceDate: issueDate,
          lastManualInvoiceBalanceDue: String(invoice.balanceDue || 0),
          lastManualPaymentMethod: paymentMethod
        });
      } else {
        customer = {
          id: nextId(customers),
          name: customerLabel || 'Walk-up customer',
          phone,
          email,
          bookings: 0,
          totalSpent: 0,
          lastBooking: 'N/A',
          source: 'Manual Invoice',
          tag: '',
          company: '',
          crmTags: '',
          createdAt: issueDate,
          lastActivity: new Date().toISOString(),
          crmNotes: notes,
          crmFields: {
            lastManualInvoiceNumber: invoice.invoiceNumber,
            lastManualInvoiceStatus: finalStatus,
            lastManualInvoiceTotal: String(total),
            lastManualInvoiceDate: issueDate,
            lastManualInvoiceBalanceDue: String(invoice.balanceDue || 0),
            lastManualPaymentMethod: paymentMethod
          }
        };
        customers.push(customer);
      }
    }
    invoice.customerId = customer ? customer.id : '';
    const linkedBooking = linkedBookingForInvoiceRecord(invoice);
    if (linkedBooking) {
      invoice.bookingId = Number(linkedBooking.id || 0);
      const processingFee = Number(bookingProcessingFeeValue(linkedBooking) || 0);
      const syncedRentalTotal = Number(Math.max(total - processingFee, 0).toFixed(2));
      const existingDroneAmount = Number(linkedBooking.droneAmount || (linkedBooking.drone ? 50 : 0) || 0);
      linkedBooking.total = syncedRentalTotal;
      linkedBooking.baseTotal = Number(Math.max(syncedRentalTotal - existingDroneAmount, 0).toFixed(2));
      const checkoutDueToday = bookingUsesCheckoutDepositFlow(linkedBooking) ? bookingDueTodayValue(linkedBooking) : 0;
      const checkoutDepositSatisfied = checkoutDueToday > 0 && paidAmount >= (checkoutDueToday - 0.009);
      if (fullyPaidInvoice) {
        linkedBooking.paymentStatus = 'paid';
        linkedBooking.deposit = true;
        linkedBooking.paymentCompletedAt = linkedBooking.paymentCompletedAt || new Date().toISOString();
        if (normalizeBookingStatusValue(linkedBooking.status) === 'pending') linkedBooking.status = 'confirmed';
      } else if (checkoutDepositSatisfied) {
        linkedBooking.paymentStatus = 'paid';
        linkedBooking.deposit = true;
        linkedBooking.paymentCompletedAt = linkedBooking.paymentCompletedAt || new Date().toISOString();
      } else {
        linkedBooking.paymentStatus = partialInvoicePayment ? 'partial' : 'unpaid';
        linkedBooking.deposit = false;
        linkedBooking.paymentCompletedAt = '';
      }
      linkedBooking.updatedAt = new Date().toISOString();
      ensureLinkedInvoiceForBookingLocally(linkedBooking);
    }
    const currentCustomer = linkedCustomerForInvoice(invoice);
    [previousCustomer, currentCustomer].forEach((item, index, list) => {
      if (!item) return;
      if (list.findIndex((candidate) => candidate && Number(candidate.id || 0) === Number(item.id || 0)) !== index) return;
      syncCustomerRollup(item);
    });
  
    if (!(await persistStateChange())) {
      invoices = previousInvoices;
      customers = previousCustomers;
      bookings = previousBookings;
      return;
    }
    closeModal('invoice-modal');
    resetInvoiceForm();
    renderBookings();
    renderInvoices();
    renderCRM();
    renderWaivers();
    renderUpcoming();
    renderDashboardMetrics();
    renderBookingBars();
    renderCommsPanel();
    renderReminders();
    updatePendingBadge();
    showToast(existingInvoice ? '✅ Invoice updated' : '✅ Invoice saved');
  }
  async function deleteInvoice(invoiceId) {
    const invoice = invoices.find((item) => Number(item.id) === Number(invoiceId));
    if (!invoice) {
      showToast('⚠️ Invoice record not found');
      return;
    }
    const linkedCustomer = linkedCustomerForInvoice({...invoice});
    const confirmed = window.confirm(`Delete invoice ${invoice.invoiceNumber || invoice.invoiceName}?`);
    if (!confirmed) return;
    const previousInvoices = JSON.parse(JSON.stringify(invoices));
    const previousCustomers = JSON.parse(JSON.stringify(customers));
    const previousBookings = JSON.parse(JSON.stringify(bookings));
    const shouldCloseEditor = editingInvoiceId && Number(editingInvoiceId) === Number(invoiceId);
    invoices = invoices.filter((item) => Number(item.id) !== Number(invoiceId));
    // If this invoice was auto-generated from a booking, mark the booking so the
    // server/app won't immediately recreate the invoice (which made delete "not stick").
    const linkedBooking = linkedBookingForInvoiceRecord(invoice);
    if (linkedBooking) linkedBooking.invoiceSuppressed = true;
    if (linkedCustomer) syncCustomerRollup(linkedCustomer);
    if (!(await persistStateChange())) {
      invoices = previousInvoices;
      customers = previousCustomers;
      bookings = previousBookings;
      return;
    }
    if (shouldCloseEditor) {
      closeModal('invoice-modal');
      resetInvoiceForm();
    }
    renderBookings();
    renderInvoices();
    renderCRM();
    renderWaivers();
    renderUpcoming();
    renderDashboardMetrics();
    renderBookingBars();
    renderCommsPanel();
    renderReminders();
    updatePendingBadge();
    showToast('🗑️ Invoice removed');
  }
  function triggerCRMImport() {
    const fileInput = document.getElementById('crm-import-input');
    if (fileInput) fileInput.click();
  }
  function triggerInvoiceImport() {
    const fileInput = document.getElementById('invoice-import-input');
    if (fileInput) fileInput.click();
  }
  function importContactsFromCsv(rows, fileName) {
    let added = 0;
    let updated = 0;
    const replaceSeed = looksLikeSeedCustomers() && !importMeta.importedAt;
    const importedCustomers = [];
    for (const row of rows) {
      const first = rowValue(row, ['first name']);
      const last = rowValue(row, ['last name']);
      const name = rowValue(row, ['contact name', 'full name', 'name']) || [first, last].filter(Boolean).join(' ');
      const phone = rowValue(row, ['phone', 'phone number', 'mobile']);
      const email = rowValue(row, ['email', 'email address']);
      if (!name && !phone && !email) continue;
      const customer = {
        name: name || email || phone || 'Imported customer',
        phone,
        email,
        bookings: parseInt(rowValue(row, ['bookings', 'total bookings']), 10) || 0,
        totalSpent: parseMoney(rowValue(row, ['total spent', 'lifetime value'])),
        lastBooking: isoDate(rowValue(row, ['last booking', 'last activity cdt', 'last activity', 'created cdt', 'created'])),
        source: rowValue(row, ['source', 'business name', 'company']) || 'Admin Tribe',
        tag: deriveCustomerTag(rowValue(row, ['tags', 'tag'])),
        crmTags: rowValue(row, ['tags', 'tag']),
        company: rowValue(row, ['business name', 'company', 'company name']),
        createdAt: rowValue(row, ['created cdt', 'created', 'date added']),
        lastActivity: rowValue(row, ['last activity cdt', 'last activity']),
        crmNotes: rowValue(row, ['notes', 'note']),
        crmFields: collectCrmFields(row)
      };
      if (replaceSeed) {
        importedCustomers.push({id: importedCustomers.length + 1, ...customer});
      } else {
        const action = upsertImportedCustomer(customer);
        if (action === 'added') added += 1;
        if (action === 'updated') updated += 1;
      }
    }
    if (replaceSeed) {
      customers = importedCustomers;
      added = importedCustomers.length;
      updated = 0;
    }
    dedupeCustomers();
    importMeta = {
      lastType: 'contacts',
      fileName,
      importedAt: new Date().toISOString(),
      added,
      updated,
      recordCount: rows.length,
      replacedSeed: replaceSeed
    };
    return {added, updated};
  }
  function importOpportunitiesFromCsv(rows, fileName) {
    let added = 0;
    let updated = 0;
    const seen = new Set(bookings.map((booking) => [
      normalizePhone(booking.phone),
      normalizeEmail(booking.email),
      booking.date,
      bookingTotalValue(booking),
      bookingCraftLabel(booking)
    ].join('|')));
    for (const row of rows) {
      const contactName = rowValue(row, ['contact name', 'full name', 'first name', 'name']);
      const opportunityName = rowValue(row, ['opportunity name', 'service', 'package']);
      const name = contactName || opportunityName || 'Imported booking';
      const phone = rowValue(row, ['phone', 'phone number', 'contact phone', 'mobile']);
      const email = rowValue(row, ['email', 'email address']);
      const stage = rowValue(row, ['stage', 'pipeline stage']);
      const status = rowValue(row, ['status', 'opportunity status']);
      const pipeline = rowValue(row, ['pipeline', 'pipeline name']);
      const tags = rowValue(row, ['tags', 'tag']);
      const scheduleValue = rowValue(row, ['booking date', 'appointment date', 'created cdt', 'created', 'date']);
      const opportunityText = [opportunityName, stage, pipeline, rowValue(row, ['service', 'package'])].filter(Boolean).join(' ');
      const craft = guessCraftFromText(opportunityText);
      const duration = guessDurationFromText(`${opportunityText} ${rowValue(row, ['duration'])}`);
      const total = parseMoney(rowValue(row, ['monetary value', 'opportunity value', 'amount', 'value', 'price']));
      const date = isoDate(scheduleValue);
      const booking = {
        id: nextId(bookings),
        name,
        phone,
        email,
        craft,
        craftLabel: craft === 'imported' ? (opportunityName || 'Imported booking') : '',
        duration,
        durationLabel: duration ? '' : (rowValue(row, ['duration']) || 'Imported'),
        total,
        date: date === 'N/A' ? 'TBD' : date,
        time: formatTime(scheduleValue),
        drone: guessDroneFromText(`${opportunityText} ${tags}`),
        status: mapImportedStatus(stage, status),
        deposit: /deposit|paid|won|closed/i.test(`${stage} ${status}`),
        notes: buildOpportunityNotes(row),
        crmFields: collectCrmFields(row),
        importSource: 'admintribe'
      };
      const dedupeKey = [
        normalizePhone(phone),
        normalizeEmail(email),
        booking.date,
        bookingTotalValue(booking),
        bookingCraftLabel(booking)
      ].join('|');
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      bookings.unshift(booking);
      added += 1;
      const action = upsertImportedCustomer({
        name,
        phone,
        email,
        bookings: 1,
        totalSpent: total,
        lastBooking: booking.date === 'TBD' ? 'N/A' : booking.date,
        source: pipeline || 'Admin Tribe',
        tag: deriveCustomerTag(tags),
        crmTags: tags,
        company: rowValue(row, ['business name', 'company', 'company name']),
        crmNotes: rowValue(row, ['notes', 'note']),
        crmFields: collectCrmFields(row)
      });
      if (action === 'updated') updated += 1;
    }
    dedupeCustomers();
    importMeta = {
      lastType: 'opportunities',
      fileName,
      importedAt: new Date().toISOString(),
      added,
      updated,
      recordCount: rows.length,
      replacedSeed: false
    };
    return {added, updated};
  }
  function handleCRMImport(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = parseCsvObjects(reader.result);
        if (!parsed.rows.length) throw new Error('No records were found in that CSV.');
        const type = detectImportType(parsed.headers);
        if (type === 'unknown') {
          throw new Error('Could not identify that CSV. Export Contacts, Opportunities, or Invoices from Admin Tribe and try again.');
        }
        const summary = type === 'contacts'
          ? importContactsFromCsv(parsed.rows, file.name)
          : type === 'opportunities'
            ? importOpportunitiesFromCsv(parsed.rows, file.name)
            : importInvoicesFromCsv(parsed.rows, file.name);
        if (!(await persistStateChange())) return;
        renderImportSummary();
        renderInvoiceImportSummary();
        renderUpcoming();
        renderDashboardMetrics();
        if (document.getElementById('page-bookings').classList.contains('active')) renderBookings();
        if (document.getElementById('page-invoices').classList.contains('active')) renderInvoices();
        renderCRM();
        renderWaivers();
        renderCommsPanel();
        renderReviewHub();
        renderReminders();
        updatePendingBadge();
        const label = type === 'contacts' ? 'customers' : type === 'opportunities' ? 'bookings' : 'invoices';
        showToast(`✅ Imported ${label} — ${summary.added} added, ${summary.updated} updated`);
      } catch (error) {
        console.error('CRM import failed:', error);
        showToast(`⚠️ ${error.message}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }
  async function processCRMImportText(rawText, fileName = 'pasted-admintribe.csv') {
    const parsed = parseCsvObjects(rawText);
    if (!parsed.rows.length) throw new Error('No records were found in that CSV.');
    const type = detectImportType(parsed.headers);
    if (type === 'unknown') {
      throw new Error('Could not identify that CSV. Export Contacts, Opportunities, or Invoices from Admin Tribe and try again.');
    }
    const summary = type === 'contacts'
      ? importContactsFromCsv(parsed.rows, fileName)
      : type === 'opportunities'
        ? importOpportunitiesFromCsv(parsed.rows, fileName)
        : importInvoicesFromCsv(parsed.rows, fileName);
    if (!(await persistStateChange())) throw new Error('Could not save the imported records to the private ops service.');
    renderImportSummary();
    renderInvoiceImportSummary();
    renderUpcoming();
    renderDashboardMetrics();
    if (document.getElementById('page-bookings').classList.contains('active')) renderBookings();
    if (document.getElementById('page-invoices').classList.contains('active')) renderInvoices();
    renderCRM();
    renderWaivers();
    renderCommsPanel();
    renderReviewHub();
    renderReminders();
    updatePendingBadge();
    return { type, summary };
  }
  async function importCRMFromTextarea() {
    const textarea = document.getElementById('crm-paste-data');
    const rawText = textarea?.value || '';
    try {
      const result = await processCRMImportText(rawText, 'pasted-admintribe.csv');
      if (textarea) textarea.value = '';
      closeModal('crm-paste-modal');
      const label = result.type === 'contacts' ? 'customers' : result.type === 'opportunities' ? 'bookings' : 'invoices';
      showToast(`✅ Imported ${label} — ${result.summary.added} added, ${result.summary.updated} updated`);
    } catch (error) {
      console.error('CRM paste import failed:', error);
      showToast(`⚠️ ${error.message}`);
    }
  }
  function handleInvoiceImport(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = parseCsvObjects(reader.result);
        if (!parsed.rows.length) throw new Error('No invoice records were found in that CSV.');
        const type = detectImportType(parsed.headers);
        if (type !== 'invoices') {
          throw new Error('That file does not look like an Admin Tribe invoice export.');
        }
        const summary = importInvoicesFromCsv(parsed.rows, file.name);
        if (!(await persistStateChange())) return;
        renderInvoiceImportSummary();
        renderInvoices();
        renderCRM();
        renderWaivers();
        renderDashboardMetrics();
        showToast(`✅ Imported invoices — ${summary.added} added, ${summary.updated} updated`);
      } catch (error) {
        console.error('Invoice import failed:', error);
        showToast(`⚠️ ${error.message}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }
  
  // ── NAVIGATION ──
  function toggleMobileNav() {
    if (window.innerWidth > 900) return;
    document.body.classList.toggle('nav-open');
  }
  function closeMobileNav() {
    document.body.classList.remove('nav-open');
  }
  function showPage(id, btn) {
    try {
    if (id === 'fuel') id = 'expenses';
    if (currentPermissions().canAccessCrewOnly) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const crewPage = document.getElementById('page-crew');
      if (crewPage) crewPage.classList.add('active');
      const titleEl = document.getElementById('page-title');
      if (titleEl) titleEl.textContent = 'Schedule';
      const tba = document.getElementById('topbar-booking-action');
      if (tba) tba.style.display = 'none';
      renderCrewSchedule();
      closeMobileNav();
      return;
    }
    if (currentPermissions().canAccessBookingsOnly && !EMPLOYEE_PAGES.includes(id)) {
      id = 'dashboard';
      btn = document.querySelector('.nav-item[data-page="dashboard"]');
    }
    if (id === 'system' && !currentPermissions().canAccessSystem) {
      showToast('⚠️ Only the developer login can access system controls');
      return;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pageEl = document.getElementById('page-'+id); if(pageEl) pageEl.classList.add('active');
    if(btn) btn.classList.add('active');
    const titles = {dashboard:'Dashboard',reports:'Reports',bookings:'Bookings',invoices:'Invoices',crm:'Customers',waivers:'Waivers',expenses:'Expenses',maintenance:'Maintenance',tracking:'Trackers',comms:'Communications',reviews:'Reviews',social:'Social Posting',reminders:'Re-engagement',system:'System'};
    document.getElementById('page-title').textContent = titles[id]||id;
    const topbarBookingAction = document.getElementById('topbar-booking-action');
    if (topbarBookingAction) topbarBookingAction.style.display = id === 'bookings' ? 'none' : 'inline-flex';
    if(id==='reports') renderReports();
    if(id==='bookings') renderBookings();
    if(id==='invoices') renderInvoices();
    if(id==='crm') renderCRM();
    if(id==='waivers') renderWaivers();
    if(id==='expenses') renderExpenses();
    if(id==='maintenance') renderMaint();
    if(id==='tracking') renderTracking();
    if(id==='comms') renderCommsPanel();
    if(id==='reviews') renderReviewHub();
    if(id==='social') renderSocialQueue();
    if(id==='reminders') renderReminders();
    if(id==='system') renderSystemPage();
    closeMobileNav();
    } catch(e) { console.error('showPage error:', e); }
  }
  
  // ── MODALS ──
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }
  document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if(e.target===m) m.classList.remove('open'); }));
  function resetCustomerForm() {
    editingCustomerId = null;
    document.getElementById('c-id').value = '';
    document.getElementById('c-name').value = '';
    document.getElementById('c-phone').value = '';
    document.getElementById('c-email').value = '';
    document.getElementById('c-company').value = '';
    document.getElementById('c-source').value = 'Instagram';
    document.getElementById('c-tag').value = '';
    document.getElementById('c-crm-tags').value = '';
    document.getElementById('c-bookings').value = '0';
    document.getElementById('c-total-spent').value = '0';
    document.getElementById('c-last-booking').value = '';
    document.getElementById('c-last-activity').value = '';
    document.getElementById('c-waiver-signed').value = '';
    document.getElementById('c-emergency-name').value = '';
    document.getElementById('c-emergency-phone').value = '';
    document.getElementById('c-notes').value = '';
    document.getElementById('customer-modal-title').textContent = 'Add Customer';
    document.getElementById('customer-save-button').textContent = 'Save Customer';
  }
  function openCustomerModal(customerId = null) {
    resetCustomerForm();
    if (customerId !== null) {
      const customer = customers.find((item) => Number(item.id) === Number(customerId));
      if (!customer) {
        showToast('⚠️ Customer record not found');
        return;
      }
      editingCustomerId = Number(customer.id);
      document.getElementById('c-id').value = String(customer.id);
      document.getElementById('c-name').value = customer.name || '';
      document.getElementById('c-phone').value = customer.phone || '';
      document.getElementById('c-email').value = customer.email || '';
      document.getElementById('c-company').value = customer.company || '';
      document.getElementById('c-source').value = customer.source || '';
      document.getElementById('c-tag').value = customer.tag || '';
      document.getElementById('c-crm-tags').value = customer.crmTags || '';
      document.getElementById('c-bookings').value = String(Number(customer.bookings) || 0);
      document.getElementById('c-total-spent').value = String(Number(customer.totalSpent) || 0);
      document.getElementById('c-last-booking').value = inputDateValue(customer.lastBooking);
      document.getElementById('c-last-activity').value = inputDateValue(customer.lastActivity);
      document.getElementById('c-waiver-signed').value = inputDateValue(customer.waiverSignedAt);
      document.getElementById('c-emergency-name').value = customer.emergencyName || '';
      document.getElementById('c-emergency-phone').value = customer.emergencyPhone || '';
      document.getElementById('c-notes').value = customer.crmNotes || '';
      document.getElementById('customer-modal-title').textContent = 'Edit Customer';
      document.getElementById('customer-save-button').textContent = 'Save Changes';
    }
    openModal('customer-modal');
  }
  
  function resetExpenseForm() {
    editingExpenseId = null;
    document.getElementById('e-date').value = today();
    document.getElementById('e-amount').value = '';
    document.getElementById('e-category').value = 'delivery';
    document.getElementById('e-recurring-type').value = 'one-time';
    document.getElementById('e-name').value = '';
    document.getElementById('e-season-start').value = '5';
    document.getElementById('e-season-end').value = '9';
    document.getElementById('e-notes').value = '';
    document.getElementById('expense-modal-title').textContent = 'Add Expense';
    document.getElementById('expense-save-button').textContent = 'Save Expense';
    toggleExpenseSeasonFields();
  }
  
  function openExpenseModal(expenseId = null) {
    resetExpenseForm();
    if (expenseId !== null) {
      const expense = expenses.find((item) => Number(item.id) === Number(expenseId));
      if (!expense) {
        showToast('⚠️ Expense record not found');
        return;
      }
      editingExpenseId = Number(expense.id);
      document.getElementById('e-date').value = inputDateValue(expense.date) || today();
      document.getElementById('e-amount').value = String(Number(expense.amount || 0) || '');
      document.getElementById('e-category').value = expense.category || 'other';
      document.getElementById('e-recurring-type').value = normalizeExpenseRecurringType(expense.recurringType);
      document.getElementById('e-name').value = expense.name || '';
      document.getElementById('e-season-start').value = String(expenseMonthNumber(expense.seasonStartMonth, 5));
      document.getElementById('e-season-end').value = String(expenseMonthNumber(expense.seasonEndMonth, 9));
      document.getElementById('e-notes').value = expense.notes || '';
      document.getElementById('expense-modal-title').textContent = 'Edit Expense';
      document.getElementById('expense-save-button').textContent = 'Save Changes';
    }
    toggleExpenseSeasonFields();
    openModal('expense-modal');
  }
  
  function toggleExpenseSeasonFields() {
    const recurringType = document.getElementById('e-recurring-type')?.value || 'one-time';
    const display = recurringType === 'seasonal' ? '' : 'none';
    const startWrap = document.getElementById('e-season-start-wrap');
    const endWrap = document.getElementById('e-season-end-wrap');
    if (startWrap) startWrap.style.display = display;
    if (endWrap) endWrap.style.display = display;
  }
  
  function resetFuelForm() {
    editingFuelId = null;
    document.getElementById('f-craft').value = knownAssetOptions()[0] || DEFAULT_ASSET_OPTIONS[0];
    document.getElementById('f-date').value = today();
    document.getElementById('f-gallons').value = '';
    document.getElementById('f-ppg').value = '3.85';
    document.getElementById('f-hours').value = '';
    document.getElementById('f-ref').value = '';
    document.getElementById('fuel-modal-title').textContent = 'Log Fuel';
    document.getElementById('fuel-save-button').textContent = 'Save Entry';
  }
  
  function openFuelModal(fuelId = null) {
    syncAssetSelectors();
    resetFuelForm();
    if (fuelId !== null) {
      const entry = fuelLog.find((item) => Number(item.id) === Number(fuelId));
      if (!entry) {
        showToast('⚠️ Fuel entry not found');
        return;
      }
      editingFuelId = Number(entry.id);
      document.getElementById('f-craft').value = entry.craft || '';
      document.getElementById('f-date').value = inputDateValue(entry.date) || today();
      document.getElementById('f-gallons').value = String(Number(entry.gallons || 0) || '');
      document.getElementById('f-ppg').value = String(Number(entry.ppg || 0) || '');
      document.getElementById('f-hours').value = String(Number(entry.hours || 0) || '');
      document.getElementById('f-ref').value = entry.ref || '';
      document.getElementById('fuel-modal-title').textContent = 'Edit Fuel Entry';
      document.getElementById('fuel-save-button').textContent = 'Save Changes';
    }
    openModal('fuel-modal');
  }
  
  function resetMaintForm() {
    editingMaintId = null;
    document.getElementById('m-craft').value = knownAssetOptions()[0] || DEFAULT_ASSET_OPTIONS[0];
    document.getElementById('m-type').value = 'Oil change';
    document.getElementById('m-date').value = today();
    document.getElementById('m-hours').value = '';
    document.getElementById('m-cost').value = '';
    document.getElementById('m-notes').value = '';
    document.getElementById('maint-modal-title').textContent = 'Log Service';
    document.getElementById('maint-save-button').textContent = 'Save Service Log';
  }
  
  function openMaintModal(maintId = null) {
    syncAssetSelectors();
    resetMaintForm();
    if (maintId !== null) {
      const entry = maintLog.find((item) => Number(item.id) === Number(maintId));
      if (!entry) {
        showToast('⚠️ Service record not found');
        return;
      }
      editingMaintId = Number(entry.id);
      document.getElementById('m-craft').value = entry.craft || '';
      document.getElementById('m-type').value = entry.type || 'Oil change';
      document.getElementById('m-date').value = inputDateValue(entry.date) || today();
      document.getElementById('m-hours').value = String(Number(entry.hours || 0) || '');
      document.getElementById('m-cost').value = String(Number(entry.cost || 0) || '');
      document.getElementById('m-notes').value = entry.notes || '';
      document.getElementById('maint-modal-title').textContent = 'Edit Service';
      document.getElementById('maint-save-button').textContent = 'Save Changes';
    }
    openModal('maint-modal');
  }
  
  // ── TOAST ──
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  
  // ── BOOKING PRICE CALC ──
  function suggestedBookingAmount() {
    const craft = normalizeCraftKey(document.getElementById('b-craft')?.value || '');
    const dur = parseInt(document.getElementById('b-duration')?.value || '0', 10);
    const drone = document.getElementById('b-drone')?.value === 'yes';
    const karaoke = document.getElementById('b-karaoke')?.value === 'yes';
    const tube = document.getElementById('b-tube')?.value === 'yes';
    if (!craft || !dur) return 0;
    const base = Number(PRICING[craft]?.[dur] || 0);
    if (!base) return 0;
    const addons = (drone ? 50 : 0) + (karaoke ? 50 : 0) + (tube ? 50 : 0);
    return Number((base + addons).toFixed(2));
  }
  function updateBookingAmountPreview() {
    renderBookingConflicts();
    const totalEl = document.getElementById('booking-total');
    const breakdownEl = document.getElementById('booking-breakdown');
    const amountEl = document.getElementById('b-amount');
    const craft = normalizeCraftKey(document.getElementById('b-craft')?.value || '');
    const dur = parseInt(document.getElementById('b-duration')?.value || '0', 10);
    const drone = document.getElementById('b-drone')?.value === 'yes';
    const suggested = suggestedBookingAmount();
    const enteredText = String(amountEl?.value || '').trim();
    const enteredValue = Number(enteredText || 0);
    const hasEnteredAmount = enteredText !== '' && Number.isFinite(enteredValue) && enteredValue >= 0;
    const displayAmount = hasEnteredAmount ? enteredValue : suggested;
    totalEl.textContent = moneyLabel(displayAmount);
    if (!craft || !dur) {
      breakdownEl.textContent = 'Select craft and duration';
      return;
    }
    if (!suggested) {
      breakdownEl.textContent = 'That duration is not available for this package';
      return;
    }
    const karaoke = document.getElementById('b-karaoke')?.value === 'yes';
    const tube = document.getElementById('b-tube')?.value === 'yes';
    const summary = `${CRAFT_NAMES[craft]} · ${dur === 8 ? '8 hrs (full day)' : `${dur}hrs`}${drone ? ' + Drone ($50)' : ''}${karaoke ? ' + Karaoke ($50)' : ''}${tube ? ' + Tube ($50)' : ''}`;
    if (bookingAmountManuallyEdited && hasEnteredAmount) {
      breakdownEl.textContent = `${summary} · custom total ${moneyLabel(enteredValue)}`;
      return;
    }
    breakdownEl.textContent = summary;
  }
  function handleBookingAmountInput() {
    const amountEl = document.getElementById('b-amount');
    const enteredText = String(amountEl?.value || '').trim();
    const enteredValue = Number(enteredText || 0);
    const suggested = suggestedBookingAmount();
    bookingAmountManuallyEdited = enteredText !== '' && Number.isFinite(enteredValue) && Math.abs(enteredValue - suggested) > 0.009;
    updateBookingAmountPreview();
  }
  function calcBookingPrice() {
    const amountEl = document.getElementById('b-amount');
    const suggested = suggestedBookingAmount();
    if (!suggested) {
      if (amountEl && !bookingAmountManuallyEdited) amountEl.value = '';
      updateBookingAmountPreview();
      return;
    }
    if (amountEl && !bookingAmountManuallyEdited) {
      amountEl.value = suggested.toFixed(2);
    }
    updateBookingAmountPreview();
  }
  
  // ── BOOKING CONFLICT DETECTION (double-booking guard) ──
  function craftUsesJetski(c) { c = String(c || ''); return c.indexOf('jetski') === 0 || c.indexOf('bundle') === 0; }
  function craftUsesBoat(c) { c = String(c || ''); return c === 'boat' || c === 'partyboat' || c.indexOf('bundle') === 0; }
  function craftsShareEquipment(a, b) {
    return (craftUsesJetski(a) && craftUsesJetski(b)) || (craftUsesBoat(a) && craftUsesBoat(b));
  }
  function bookingTimeMinutes(timeValue) {
    const parts = parseBookingTimeParts(timeValue);
    return parts ? parts.hour * 60 + parts.minute : null;
  }
  function findBookingConflicts() {
    const date = document.getElementById('b-date')?.value;
    const craft = normalizeCraftKey(document.getElementById('b-craft')?.value || '');
    const start = bookingTimeMinutes(document.getElementById('b-time')?.value);
    const duration = Number(document.getElementById('b-duration')?.value) || 0;
    if (!date || !craft || start === null) return [];
    const end = start + (duration || 1) * 60;
    return bookings.filter((b) => {
      if (!b || (editingBookingId && Number(b.id) === Number(editingBookingId))) return false;
      if (b.date !== date) return false;
      if (['cancelled', 'noshow', 'completed', 'draft'].includes(normalizeBookingStatusValue(b.status))) return false;
      if (!craftsShareEquipment(craft, normalizeCraftKey(b.craft))) return false;
      const bStart = bookingTimeMinutes(b.time);
      if (bStart === null) return false;
      const bEnd = bStart + (Number(b.duration) || 1) * 60;
      return start < bEnd && bStart < end;
    });
  }
  function renderBookingConflicts() {
    const el = document.getElementById('booking-conflict');
    if (!el) return;
    const conflicts = findBookingConflicts();
    if (!conflicts.length) { el.style.display = 'none'; renderOpsMarkup(el, ''); return; }
    const lines = conflicts.slice(0, 3).map((b) =>
      `${escapeHtml(bookingDisplayName(b))} · ${escapeHtml(bookingCraftLabel(b))} @ ${escapeHtml(formatTimeLabel(b.time))}`
    ).join('<br>');
    const more = conflicts.length > 3 ? `<br>+${conflicts.length - 3} more` : '';
    renderOpsMarkup(el, `⚠️ <strong>Possible double-booking</strong> — ${conflicts.length} active booking${conflicts.length > 1 ? 's' : ''} ${conflicts.length > 1 ? 'share' : 'shares'} equipment at this time:<br>${lines}${more}`);
    el.style.display = 'block';
  }
  
  // ── RETURNING-CUSTOMER AUTOFILL ──
  function maybeAutofillCustomer(source) {
    const hintEl = document.getElementById('booking-customer-hint');
    if (editingBookingId) { if (hintEl) { hintEl.style.display = 'none'; renderOpsMarkup(hintEl, ''); } return; }
    const nameEl = document.getElementById('b-name');
    const phoneEl = document.getElementById('b-phone');
    const emailEl = document.getElementById('b-email');
    const phoneKey = normalizePhone(phoneEl?.value || '');
    const nameKey = String(nameEl?.value || '').trim().toLowerCase();
    let match = null;
    if (phoneKey) match = customers.find((c) => normalizePhone(c.phone) === phoneKey);
    if (!match && nameKey) {
      const matches = customers.filter((c) => String(c.name || '').trim().toLowerCase() === nameKey);
      if (matches.length === 1) match = matches[0];
    }
    if (!match) { if (hintEl) { hintEl.style.display = 'none'; renderOpsMarkup(hintEl, ''); } return; }
    if (source !== 'name' && match.name && !nameEl.value.trim()) nameEl.value = match.name;
    if (source !== 'phone' && match.phone && !phoneEl.value.trim()) phoneEl.value = match.phone;
    if (match.email && !emailEl.value.trim()) emailEl.value = match.email;
    if (hintEl) {
      const priorCount = Number(match.bookings || 0);
      const prior = priorCount > 0 ? ` · ${priorCount} prior booking${priorCount > 1 ? 's' : ''}` : '';
      renderOpsMarkup(hintEl, `↩ <strong>Returning customer</strong> — ${escapeHtml(match.name || 'on file')}${prior}. Details filled in.`);
      hintEl.style.display = 'block';
    }
  }
  
  // ── SAVE BOOKING ──
  async function saveBooking() {
    const name = document.getElementById('b-name').value.trim();
    const phone = document.getElementById('b-phone').value.trim();
    const email = document.getElementById('b-email').value.trim();
    const craft = normalizeCraftKey(document.getElementById('b-craft').value);
    const dur = parseInt(document.getElementById('b-duration').value, 10);
    const status = normalizeBookingStatusValue(document.getElementById('b-status').value) || 'pending';
    if(!craft||!dur) { showToast('⚠️ Fill in craft and duration'); return; }
    const baseValue = PRICING[craft]?.[dur] || 0;
    if (!baseValue) { showToast('⚠️ That duration is not available for this package'); return; }
    const suggestedValue = suggestedBookingAmount();
    const enteredAmountText = String(document.getElementById('b-amount').value || '').trim();
    const parsedAmount = enteredAmountText === '' ? suggestedValue : Number(enteredAmountText);
    const bookingValue = Number(parsedAmount.toFixed(2));
    if (!Number.isFinite(bookingValue) || bookingValue <= 0) {
      showToast('⚠️ Enter a valid booking amount');
      return;
    }
    const previousBookings = JSON.parse(JSON.stringify(bookings));
    const previousCustomers = JSON.parse(JSON.stringify(customers));
    const previousInvoices = JSON.parse(JSON.stringify(invoices));
    const existingBooking = editingBookingId
      ? bookings.find((booking) => Number(booking.id) === Number(editingBookingId))
      : null;
    if (editingBookingId && !existingBooking) {
      showToast('⚠️ Booking record not found');
      return;
    }
  
    const previousSnapshot = existingBooking ? {...existingBooking} : null;
    const amountChangedFromPrevious = previousSnapshot ? Math.abs(Number(previousSnapshot.total || 0) - bookingValue) > 0.009 : false;
    const nowIso = new Date().toISOString();
    const bookingRecord = existingBooking || {
      id: nextId(bookings),
      status: 'pending',
      deposit: false,
      paymentStatus: 'unpaid',
      source: 'Ops Manual',
      createdAt: nowIso
    };
  
    bookingRecord.name = name;
    bookingRecord.phone = phone;
    bookingRecord.email = email;
    bookingRecord.craft = craft;
    bookingRecord.craftKey = craft;
    bookingRecord.craftLabel = CRAFT_NAMES[craft] || bookingRecord.craftLabel || 'Rental';
    bookingRecord.duration = dur;
    bookingRecord.durationLabel = dur === 8 ? 'Full Day' : `${dur}hrs`;
    bookingRecord.date = document.getElementById('b-date').value || 'TBD';
    bookingRecord.time = document.getElementById('b-time').value || '10:00';
    bookingRecord.status = status;
    bookingRecord.depositRefunded = Boolean(document.getElementById('b-deposit-refunded')?.checked);
    bookingRecord.invoiceSuppressed = false;
    bookingRecord.drone = document.getElementById('b-drone').value === 'yes';
    bookingRecord.droneAmount = bookingRecord.drone ? 50 : 0;
    bookingRecord.karaoke = document.getElementById('b-karaoke')?.value === 'yes';
    bookingRecord.karaokeAmount = bookingRecord.karaoke ? 50 : 0;
    bookingRecord.tube = document.getElementById('b-tube')?.value === 'yes';
    bookingRecord.tubeAmount = bookingRecord.tube ? 50 : 0;
    const addonTotal = bookingRecord.droneAmount + bookingRecord.karaokeAmount + bookingRecord.tubeAmount;
    bookingRecord.baseTotal = Number(Math.max(bookingValue - addonTotal, 0).toFixed(2));
    bookingRecord.notes = document.getElementById('b-notes').value.trim();
    bookingRecord.total = bookingValue;
    bookingRecord.updatedAt = nowIso;
  
    if (!existingBooking) bookings.unshift(bookingRecord);
  
    const hasMeaningfulCustomer = meaningfulBookingCustomer(name, email, phone);
    let customer = null;
    if (hasMeaningfulCustomer) {
      customer = findCustomerForBooking(bookingRecord) || customers.find((item) => (
        (normalizePhone(item.phone) && normalizePhone(item.phone) === normalizePhone(bookingRecord.phone)) ||
        (normalizeEmail(item.email) && normalizeEmail(item.email) === normalizeEmail(bookingRecord.email))
      ));
  
      if (customer) {
        if (bookingRecord.name) customer.name = bookingRecord.name;
        customer.phone = bookingRecord.phone || customer.phone;
        customer.email = bookingRecord.email || customer.email;
        customer.source = customer.source || 'Direct';
        customer.lastActivity = nowIso;
      } else {
        customer = {
          id: nextId(customers),
          name: bookingDisplayName(bookingRecord, 'Walk-up customer'),
          phone: bookingRecord.phone,
          email: bookingRecord.email,
          bookings: 0,
          totalSpent: 0,
          lastBooking: 'N/A',
          source: 'Direct',
          tag: '',
          createdAt: today(),
          lastActivity: nowIso
        };
        customers.push(customer);
      }
    }
  
    bookingRecord.customerId = customer ? customer.id : '';
    const linkedInvoice = linkedInvoiceForBookingRecord(bookingRecord);
    if (linkedInvoice && amountChangedFromPrevious) {
      const nextProcessingFee = bookingProcessingFeeValue(bookingRecord);
      const nextInvoiceTotal = Number((bookingValue + nextProcessingFee).toFixed(2));
      const preservedCollected = Number(Math.min(Number(linkedInvoice.paidAmount || 0), nextInvoiceTotal || Number(linkedInvoice.paidAmount || 0)).toFixed(2));
      linkedInvoice.subTotal = bookingValue;
      linkedInvoice.taxAmount = nextProcessingFee;
      linkedInvoice.total = nextInvoiceTotal;
      linkedInvoice.paidAmount = preservedCollected;
      linkedInvoice.balanceDue = Number(Math.max(nextInvoiceTotal - preservedCollected, 0).toFixed(2));
      linkedInvoice.rawFields = mergeCrmFields(linkedInvoice.rawFields, {
        manualBookingInvoiceOverride: '',
        manualTotalOverride: '',
        collectedAmount: preservedCollected ? String(preservedCollected) : ''
      });
    }
    ensureLinkedInvoiceForBookingLocally(bookingRecord);
    const previousCustomer = previousSnapshot ? findCustomerForBooking(previousSnapshot) : null;
    [previousCustomer, customer].forEach((item) => {
      if (item) syncCustomerRollup(item);
    });
  
    if (!(await persistStateChange())) {
      bookings = previousBookings;
      customers = previousCustomers;
      invoices = previousInvoices;
      return;
    }
    const reviewAutoSent = normalizeBookingStatusValue(bookingRecord.status) === 'completed' && normalizeBookingStatusValue(previousSnapshot?.status) !== 'completed'
      ? await autoSendReviewForBooking(bookingRecord)
      : false;
    updatePendingBadge();
    closeModal('booking-modal');
    showToast(reviewAutoSent
      ? '✅ Booking saved and review request sent'
      : existingBooking ? '✅ Booking updated' : '✅ Booking saved');
    selectedCalendarDate = bookingRecord.date || selectedCalendarDate;
    const bookingDateObj = parseIsoDate(bookingRecord.date);
    if (bookingDateObj) calendarMonthCursor = monthStart(bookingDateObj);
    renderUpcoming();
    renderInvoices();
    if(document.getElementById('page-bookings').classList.contains('active')) renderBookings();
    else renderBookingCalendar();
    if(document.getElementById('page-crm').classList.contains('active')) renderCRM();
    if(document.getElementById('page-waivers').classList.contains('active')) renderWaivers();
    renderDashboardMetrics();
    renderBookingBars();
    renderCommsPanel();
    renderReviewHub();
    renderReminders();
    resetBookingForm();
  }
  
  // ── RENDER UPCOMING (dashboard) ──
  // ── TODAY RUN-SHEET (mobile-first day-of workflow) ──
  function todaysRunSheetBookings() {
    const iso = today();
    // Show EVERYTHING happening today — including unfinished (draft) and unpaid
    // bookings — so a real booking can never be invisible just because the deposit
    // or waiver wasn't completed. Only truly-dead statuses are hidden.
    const hiddenStatuses = ['cancelled', 'canceled', 'deleted', 'void', 'expired', 'noshow', 'no-show'];
    return bookings
      .filter((b) => b && b.date === iso)
      .filter((b) => !hiddenStatuses.includes(normalizeBookingStatusValue(b.status)))
      .sort((a, b) => bookingTimeValue(a.time).localeCompare(bookingTimeValue(b.time)));
  }
  
  function runSheetActions(b) {
    const id = Number(b.id);
    const status = normalizeBookingStatusValue(b.status);
    const phone = String(b.phone || '').replace(/[^\d+]/g, '');
    const btns = [];
    if (phone) {
      btns.push(`<a class="rs-btn call" href="tel:${escapeHtml(phone)}">📞 Call</a>`);
      btns.push(`<a class="rs-btn text" href="sms:${escapeHtml(phone)}">💬 Text</a>`);
    }
    if (!bookingIsPaid(b) && !hideMoneyForRole()) btns.push(`<button class="rs-btn pay" data-dashboard-booking-action="collect" data-booking-id="${id}">💵 Collect</button>`);
    if (status === 'pending') btns.push(`<button class="rs-btn confirm" data-dashboard-booking-action="confirm" data-booking-id="${id}">✓ Confirm</button>`);
    if (status === 'confirmed') btns.push(`<button class="rs-btn done" data-dashboard-booking-action="done" data-booking-id="${id}">🏁 Done</button>`);
    if (status === 'completed' && !hideMoneyForRole()) btns.push(`<button class="rs-btn" data-dashboard-booking-action="review" data-booking-id="${id}">⭐ Review</button>`);
    btns.push(`<button class="rs-btn" data-dashboard-booking-action="edit" data-booking-id="${id}">✎ Edit</button>`);
    return btns.join('');
  }
  
  function runSheetCard(b) {
    const paid = bookingIsPaid(b);
    const statusClass = `rs-${normalizeBookingStatusValue(b.status) || 'pending'}`;
    const payText = paid
      ? 'Deposit in ✓'
      : (hideMoneyForRole() ? 'Collect deposit' : `${moneyLabel(bookingTotalValue(b))} total — collect deposit`);
    return `<div class="rs-card ${statusClass}">
      <div class="rs-top"><span class="rs-time">🕐 ${escapeHtml(formatTimeLabel(b.time) || 'Time TBD')}</span>${statusBadge(b.status)}</div>
      <div class="rs-name">${escapeHtml(bookingDisplayName(b))}</div>
      <div class="rs-sub">${escapeHtml(bookingCraftLabel(b))} · ${escapeHtml(bookingDurationLabel(b))}${hideMoneyForRole() ? '' : ` · ${bookingTotalLabel(b)}`}</div>
      ${hideMoneyForRole()
        ? `<div class="rs-pay ${(b.waiverSigned || b.waiverSignedAt) ? 'paid' : 'due'}">${(b.waiverSigned || b.waiverSignedAt) ? '✅ Waiver signed' : '⚠️ Waiver not signed'}</div>`
        : `<div class="rs-pay ${paid ? 'paid' : 'due'}">${payText}</div>`}
      <div class="rs-actions">${runSheetActions(b)}</div>
    </div>`;
  }
  
  function renderTodayRunSheet() {
    const host = document.getElementById('today-runsheet');
    if (!host) return;
    const list = todaysRunSheetBookings();
    const dateLabel = new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});
    const todayInvoices = list.map((b) => linkedInvoiceForBookingRecord(b)).filter(Boolean);
    const madeToday = todayInvoices.reduce((sum, inv) => sum + invoiceCollectedAmount(inv), 0);
    const toCollect = todayInvoices.reduce((sum, inv) => sum + invoiceOutstandingAmount(inv), 0);
    const subParts = [`<strong>${list.length}</strong> ${list.length === 1 ? 'rental' : 'rentals'}`];
    if (!hideMoneyForRole()) {
      subParts.push(`<strong style="color:var(--green);">${moneyLabel(madeToday)}</strong> made today`);
      if (toCollect > 0) subParts.push(`<strong>${moneyLabel(toCollect)}</strong> to collect`);
    }
    renderOpsMarkup(host, `
      <div class="runsheet-head">
        <h2>Today · ${escapeHtml(dateLabel)}</h2>
        <div class="runsheet-sub">${subParts.join(' · ')}</div>
      </div>
      ${list.length
        ? `<div class="rs-list">${list.map(runSheetCard).join('')}</div>`
        : `<div class="rs-empty">No rentals scheduled today. Tap <strong>+ New Booking</strong> to add one.</div>`}
    `);
  }
  
  // ── DASHBOARD "NEEDS ATTENTION" (actionable items across upcoming bookings) ──
  function dashboardNeedsAttentionItems() {
    const upcoming = upcomingScheduledBookings();
    const items = [];
    upcoming.forEach((b) => {
      if (normalizeBookingStatusValue(b.status) === 'pending') {
        items.push({ booking: b, label: 'Needs confirmation', cls: 'na-confirm', action: 'confirm', actionLabel: '✓ Confirm' });
      }
    });
    upcoming.forEach((b) => {
      if (!String(b.waiverSignedAt || '').trim()) {
        items.push({ booking: b, label: 'Waiver still needed', cls: 'na-waiver', action: 'edit', actionLabel: '📝 Open' });
      }
    });
    return items.sort((a, b) => bookingScheduleSortKey(a.booking).localeCompare(bookingScheduleSortKey(b.booking)));
  }
  
  function renderNeedsAttention() {
    const host = document.getElementById('dashboard-alerts');
    if (!host) return;
    const all = dashboardNeedsAttentionItems();
    const items = all.slice(0, 8);
    if (!items.length) {
      renderOpsMarkup(host, `<div class="na-card na-clear"><span class="na-clear-icon">✅</span> All caught up — nothing needs attention right now.</div>`);
      return;
    }
    const extra = all.length > items.length ? `<div class="na-more">+${all.length - items.length} more — see Bookings</div>` : '';
    renderOpsMarkup(host, `
      <div class="na-card">
        <div class="na-head"><h3>⚡ Needs attention</h3><span class="na-count">${all.length}</span></div>
        <div class="na-list">
          ${items.map((it) => {
            const b = it.booking;
            return `<div class="na-row">
              <div class="na-main">
                <div class="na-name">${escapeHtml(bookingDisplayName(b))} <span class="na-tag ${it.cls}">${it.label}</span></div>
                <div class="na-sub">${escapeHtml(formatShortDate(b.date))} ${escapeHtml(formatTimeLabel(b.time))} · ${escapeHtml(bookingCraftLabel(b))}</div>
              </div>
              <button class="na-btn ${it.cls}" data-dashboard-booking-action="${it.action}" data-booking-id="${Number(b.id)}">${it.actionLabel}</button>
            </div>`;
          }).join('')}
        </div>
        ${extra}
      </div>`);
  }
  
  function renderUpcoming() {
    renderTodayRunSheet();
    renderNeedsAttention();
    const rows = upcomingScheduledBookings()
      .filter((booking) => !['completed', 'noshow', 'no-show'].includes(normalizeBookingStatusValue(booking.status)))
      .slice(0,5);
    renderOpsMarkup(document.getElementById('upcoming-bookings-table'), rows.length ? rows.map((b) => {
      const paid = bookingIsPaid(b);
      return `
      <tr>
        <td><strong>${escapeHtml(bookingDisplayName(b))}</strong></td>
        <td>${escapeHtml(bookingCraftLabel(b))}</td>
        <td>${escapeHtml(formatShortDate(b.date))} ${escapeHtml(formatTimeLabel(b.time))}</td>
        <td>${escapeHtml(bookingDurationLabel(b))}</td>
        <td style="color:var(--wave);font-weight:500;">${bookingTotalLabel(b)}</td>
        <td>${paid?'<span class="badge badge-confirmed">Paid</span>':'<span class="badge badge-noshow">Unpaid</span>'}</td>
        <td>${statusBadge(b.status)}</td>
        <td>${paid ? '<span style="color:var(--muted);font-size:0.78rem;">Covered</span>' : `<button class="btn btn-ghost btn-sm" data-dashboard-booking-action="collect" data-booking-id="${Number(b.id)}">Dep ✓</button>`}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="8"><div class="empty"><div class="icon">🗓️</div><p>No scheduled bookings yet.</p></div></td></tr>');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-dashboard-booking-action]') : null;
    if (!target) return;
    const action = target.dataset.dashboardBookingAction;
    const id = Number(target.dataset.bookingId);
    if (!Number.isFinite(id)) return;
    if (action === 'collect') {
      confirmDeposit(id);
    } else if (action === 'confirm') {
      updateStatus(id, 'confirmed');
    } else if (action === 'done') {
      updateStatus(id, 'completed');
    } else if (action === 'review') {
      askForReview(id);
    } else if (action === 'edit') {
      openBookingModal(id);
    }
  });
  
  // ── RENDER ALL BOOKINGS ──
  let currentFilter = 'all';
  let bookingPeriodFilter = 'all';
  let bookingDateFrom = '';
  let bookingDateTo = '';
  let calendarMonthCursor = monthStart(new Date());
  let selectedCalendarDate = today();
  let editingBookingId = null;
  let bookingAmountManuallyEdited = false;
  
  function monthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  function bookingTimeValue(timeValue) {
    const parsed = parseBookingTimeParts(timeValue);
    return parsed ? `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}` : '99:99';
  }
  
  function bookingSourceValue(booking = {}) {
    return String(booking.source || '').trim().toLowerCase();
  }
  
  function bookingIsArchived(booking = {}) {
    return ['draft', 'cancelled', 'canceled', 'noshow', 'no-show', 'void', 'expired'].includes(normalizeBookingStatusValue(booking.status));
  }
  
  function bookingHasCompletedWebsiteRequest(booking = {}) {
    return Boolean(
      Number(booking.customerId || 0) > 0 ||
      booking.waiverAccepted ||
      String(booking.waiverSignedAt || '').trim() ||
      String(booking.waiverSignature || '').trim() ||
      (booking.waiver && typeof booking.waiver === 'object' && (
        String(booking.waiver.signature || '').trim() ||
        String(booking.waiver.signatureDate || '').trim()
      ))
    );
  }
  
  function bookingIsPaid(booking = {}) {
    return Boolean(
      booking.deposit ||
      String(booking.paymentStatus || '').toLowerCase() === 'paid'
    );
  }
  
  function bookingShowsOnSchedule(booking = {}) {
    if (!booking || !parseIsoDate(booking.date)) return false;
    if (bookingIsArchived(booking)) return false;
    return bookingIsPaid(booking);
  }
  
  function scheduledBookings() {
    return bookings.filter((booking) => bookingShowsOnSchedule(booking));
  }
  
  function bookingScheduleSortKey(booking = {}) {
    const parsedDate = dateValue(booking.date);
    const dateKey = parsedDate ? isoFromDate(parsedDate) : '9999-99-99';
    return `${dateKey} ${bookingTimeValue(booking.time)}`;
  }
  
  function bookingStartDateTime(booking = {}) {
    const bookingDate = dateValue(booking.date);
    if (!bookingDate) return null;
    const dateTime = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
    const parsedTime = parseBookingTimeParts(booking.time);
    if (!parsedTime) return null;
    dateTime.setHours(parsedTime.hour, parsedTime.minute, 0, 0);
    return dateTime;
  }
  
  function upcomingScheduledBookings(reference = new Date()) {
    const now = new Date(reference);
    return scheduledBookings()
      .filter((booking) => {
        const bookingStart = bookingStartDateTime(booking);
        return Boolean(bookingStart) && bookingStart >= now;
      })
      .sort((left, right) => bookingScheduleSortKey(left).localeCompare(bookingScheduleSortKey(right)));
  }
  function bookingMatchesPeriod(booking = {}) {
    const targetDate = dateValue(booking.date);
    const now = new Date();
    if (!targetDate) return bookingPeriodFilter === 'all';
    if (bookingPeriodFilter === 'today') return inRange(targetDate, startOfDay(now), endOfDay(now));
    if (bookingPeriodFilter === 'week') return inRange(targetDate, startOfWeek(now), endOfWeek(now));
    if (bookingPeriodFilter === 'month') return inRange(targetDate, startOfMonth(now), endOfMonth(now));
    if (bookingPeriodFilter === 'custom') {
      const from = bookingDateFrom ? parseIsoDate(bookingDateFrom) : null;
      const toBase = bookingDateTo ? parseIsoDate(bookingDateTo) : null;
      const to = toBase ? endOfDay(toBase) : null;
      return inRange(targetDate, from, to);
    }
    return true;
  }
  function updateBookingFilters() {
    const periodEl = document.getElementById('booking-period-filter');
    const fromEl = document.getElementById('booking-date-from');
    const toEl = document.getElementById('booking-date-to');
    const summaryEl = document.getElementById('booking-filter-summary');
    bookingPeriodFilter = periodEl?.value || 'all';
    bookingDateFrom = fromEl?.value || '';
    bookingDateTo = toEl?.value || '';
    if (summaryEl) {
      const label = bookingPeriodFilter === 'today'
        ? "Showing today's bookings"
        : bookingPeriodFilter === 'week'
          ? "Showing this week's bookings"
          : bookingPeriodFilter === 'month'
            ? "Showing this month's bookings"
            : bookingPeriodFilter === 'custom'
              ? `Showing ${formatFilterDateText(bookingDateFrom)} to ${formatFilterDateText(bookingDateTo)}`
              : 'Showing all upcoming bookings';
      summaryEl.textContent = label;
    }
    renderBookings();
  }
  
  function pendingOpsBookings() {
    return upcomingScheduledBookings().filter((booking) => normalizeBookingStatusValue(booking.status) === 'pending');
  }
  
  function updatePendingBadge() {
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = String(pendingOpsBookings().length);
  }
  
  function customerMatchesBooking(customer = {}, booking = {}) {
    if (!customer || !booking) return false;
    if (Number(customer.id || 0) && Number(booking.customerId || 0) === Number(customer.id || 0)) return true;
    const customerPhone = normalizePhone(customer.phone);
    const bookingPhone = normalizePhone(booking.phone);
    if (customerPhone && bookingPhone && customerPhone === bookingPhone) return true;
    const customerEmail = normalizeEmail(customer.email);
    const bookingEmail = normalizeEmail(booking.email);
    return Boolean(customerEmail && bookingEmail && customerEmail === bookingEmail);
  }
  
  function findCustomerForBooking(booking = {}) {
    const directMatch = customers.find((customer) => customerMatchesBooking(customer, booking));
    if (directMatch) return directMatch;
    const bookingName = normalizeName(booking.name);
    if (!bookingName) return null;
    const nameMatches = customers.filter((customer) => normalizeName(customer.name) === bookingName);
    return nameMatches.length === 1 ? nameMatches[0] : null;
  }
  function bookingDisplayName(booking = {}, fallback = 'Walk-up booking') {
    return String(booking?.name || booking?.email || booking?.phone || fallback).trim() || fallback;
  }
  function meaningfulBookingCustomer(name = '', email = '', phone = '') {
    return Boolean(String(name || '').trim() || String(email || '').trim() || String(phone || '').trim());
  }
  function findCustomerForContact(contact = {}) {
    if (Number(contact.customerId || 0) > 0) {
      const direct = customers.find((customer) => Number(customer.id || 0) === Number(contact.customerId || 0));
      if (direct) return direct;
    }
    if (Number(contact.bookingId || 0) > 0) {
      const booking = bookings.find((item) => Number(item.id || 0) === Number(contact.bookingId || 0));
      if (booking) {
        const bookingCustomer = findCustomerForBooking(booking);
        if (bookingCustomer) return bookingCustomer;
      }
    }
    const phoneKey = normalizePhone(contact.phone);
    if (phoneKey) {
      const phoneMatch = customers.find((customer) => normalizePhone(customer.phone) === phoneKey);
      if (phoneMatch) return phoneMatch;
    }
    const emailKey = normalizeEmail(contact.email);
    if (emailKey) {
      const emailMatch = customers.find((customer) => normalizeEmail(customer.email) === emailKey);
      if (emailMatch) return emailMatch;
    }
    const nameKey = normalizeName(contact.name);
    if (!nameKey) return null;
    const nameMatches = customers.filter((customer) => normalizeName(customer.name) === nameKey);
    return nameMatches.length === 1 ? nameMatches[0] : null;
  }
  function touchCustomerActivity(contact = {}, timestamp = new Date().toISOString()) {
    const customer = findCustomerForContact(contact);
    if (!customer) return null;
    customer.lastActivity = timestamp;
    return customer;
  }
  
  function invoiceMatchesCustomer(customer = {}, invoice = {}) {
    if (Number(customer.id || 0) > 0 && Number(invoice.customerId || 0) === Number(customer.id || 0)) return true;
    const customerEmail = normalizeEmail(customer.email);
    const invoiceEmail = normalizeEmail(invoice.customerEmail);
    if (customerEmail && invoiceEmail && customerEmail === invoiceEmail) return true;
    const customerPhone = normalizePhone(customer.phone);
    const invoicePhone = normalizePhone(invoice.customerPhone);
    if (customerPhone && invoicePhone && customerPhone === invoicePhone) return true;
    const customerName = normalizeName(customer.name);
    const invoiceName = normalizeName(invoice.customerName);
    return Boolean(customerName && invoiceName && customerName === invoiceName);
  }
  
  function paidInvoiceTotalForCustomer(customer = {}) {
    return invoices
      .filter((invoice) => invoiceMatchesCustomer(customer, invoice))
      .reduce((sum, invoice) => sum + invoiceCollectedAmount(invoice), 0);
  }
  
  function syncCustomerRollup(customer) {
    if (!customer) return;
    const customerBookings = bookings.filter((booking) => customerMatchesBooking(customer, booking) && !bookingIsArchived(booking));
    const relatedInvoices = invoices.filter((invoice) => invoiceMatchesCustomer(customer, invoice));
    const linkedInvoiceCollectedTotals = new Map();
    let standaloneInvoiceCollected = 0;
    relatedInvoices.forEach((invoice) => {
      const collected = invoiceCollectedAmount(invoice);
      const linkedBookingId = linkedBookingIdForInvoiceRecord(invoice);
      if (linkedBookingId > 0) {
        linkedInvoiceCollectedTotals.set(
          linkedBookingId,
          Number(((linkedInvoiceCollectedTotals.get(linkedBookingId) || 0) + collected).toFixed(2))
        );
        return;
      }
      standaloneInvoiceCollected += collected;
    });
    const bookingSpend = customerBookings.reduce((sum, booking) => {
      const bookingTotal = Number(booking.total || 0);
      const linkedCollected = Number(linkedInvoiceCollectedTotals.get(Number(booking.id || 0)) || 0);
      return sum + Math.max(bookingTotal, linkedCollected);
    }, 0);
    const orphanLinkedInvoiceCollected = Array.from(linkedInvoiceCollectedTotals.entries()).reduce((sum, [bookingId, collected]) => {
      const hasBooking = customerBookings.some((booking) => Number(booking.id || 0) === Number(bookingId));
      return hasBooking ? sum : sum + collected;
    }, 0);
    customer.bookings = customerBookings.length;
    customer.totalSpent = Number((bookingSpend + standaloneInvoiceCollected + orphanLinkedInvoiceCollected).toFixed(2));
    customer.lastBooking = customerBookings.reduce((latest, booking) => updateLatestDate(latest, booking.date), 'N/A');
  }
  
  function refreshCustomerRollups() {
    customers.forEach((customer) => syncCustomerRollup(customer));
  }
  
  function resetBookingForm(defaultDate = '') {
    editingBookingId = null;
    bookingAmountManuallyEdited = false;
    document.getElementById('b-name').value = '';
    document.getElementById('b-phone').value = '';
    document.getElementById('b-email').value = '';
    document.getElementById('b-date').value = defaultDate || today();
    document.getElementById('b-time').value = '10:00';
    document.getElementById('b-craft').value = '';
    document.getElementById('b-duration').value = '';
    document.getElementById('b-drone').value = 'no';
    if (document.getElementById('b-karaoke')) document.getElementById('b-karaoke').value = 'no';
    if (document.getElementById('b-tube')) document.getElementById('b-tube').value = 'no';
    document.getElementById('b-status').value = 'pending';
    document.getElementById('b-amount').value = '';
    document.getElementById('b-notes').value = '';
    if (document.getElementById('b-deposit-refunded')) document.getElementById('b-deposit-refunded').checked = false;
    document.getElementById('booking-modal-title').textContent = 'New Booking';
    document.getElementById('booking-save-button').textContent = 'Confirm Booking';
    const hintEl = document.getElementById('booking-customer-hint');
    if (hintEl) { hintEl.style.display = 'none'; renderOpsMarkup(hintEl, ''); }
    calcBookingPrice();
  }
  
  function openBookingModal(bookingId = null, defaultDate = '') {
    resetBookingForm(defaultDate);
    if (bookingId !== null && bookingId !== undefined) {
      const booking = bookings.find((item) => Number(item.id) === Number(bookingId));
      if (!booking) {
        showToast('⚠️ Booking record not found');
        return;
      }
      editingBookingId = Number(booking.id);
      document.getElementById('b-name').value = booking.name || '';
      document.getElementById('b-phone').value = booking.phone || '';
      document.getElementById('b-email').value = booking.email || '';
      document.getElementById('b-date').value = booking.date && booking.date !== 'TBD' ? booking.date : today();
      document.getElementById('b-time').value = formatTime(booking.time);
      document.getElementById('b-craft').value = bookingEditorCraftValue(booking);
      document.getElementById('b-duration').value = booking.duration ? String(booking.duration) : '';
      document.getElementById('b-drone').value = booking.drone ? 'yes' : 'no';
      if (document.getElementById('b-karaoke')) document.getElementById('b-karaoke').value = booking.karaoke ? 'yes' : 'no';
      if (document.getElementById('b-tube')) document.getElementById('b-tube').value = booking.tube ? 'yes' : 'no';
      document.getElementById('b-status').value = normalizeBookingStatusValue(booking.status) || 'pending';
      if (document.getElementById('b-deposit-refunded')) document.getElementById('b-deposit-refunded').checked = Boolean(booking.depositRefunded);
      document.getElementById('b-amount').value = Number(booking.total || 0) > 0 ? Number(booking.total).toFixed(2) : '';
      document.getElementById('b-notes').value = booking.notes || '';
      document.getElementById('booking-modal-title').textContent = 'Edit Booking';
      document.getElementById('booking-save-button').textContent = 'Save Changes';
      bookingAmountManuallyEdited = Math.abs(Number(booking.total || 0) - suggestedBookingAmount()) > 0.009;
      calcBookingPrice();
    }
    openModal('booking-modal');
  }
  
  function bookingQuickActionOptions(booking = {}) {
    const normalizedStatus = normalizeBookingStatusValue(booking.status);
    const options = [];
    if (normalizedStatus === 'pending') {
      options.push({ value: 'confirm', label: 'Confirm' });
    }
    if (normalizedStatus === 'confirmed') {
      options.push({ value: 'complete', label: 'Complete' });
    }
    if (!['completed', 'noshow', 'no-show'].includes(normalizedStatus)) {
      options.push({ value: 'reschedule', label: 'Reschedule' });
      options.push({ value: 'noshow', label: 'No-show' });
    }
    return options;
  }
  
  function bookingQuickActionControl(booking = {}) {
    const options = bookingQuickActionOptions(booking);
    if (!options.length) return '';
    return `
      <select class="input" style="min-width:145px;height:34px;padding:0 0.8rem;font-size:0.76rem;" onchange="handleBookingQuickAction(this, ${Number(booking.id)})">
        <option value="">Action</option>
        ${options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}
      </select>
    `;
  }
  
  function handleBookingQuickAction(selectEl, bookingId) {
    const action = String(selectEl?.value || '').trim().toLowerCase();
    if (selectEl) selectEl.value = '';
    if (!action) return;
    if (action === 'reschedule') {
      openBookingModal(bookingId);
      return;
    }
    if (action === 'confirm') {
      updateStatus(bookingId, 'confirmed');
      return;
    }
    if (action === 'complete') {
      updateStatus(bookingId, 'completed');
      return;
    }
    if (action === 'noshow') {
      updateStatus(bookingId, 'noshow');
    }
  }
  function bookingCalendarStatusValue(booking = {}) {
    const normalized = normalizeBookingStatusValue(booking.status);
    return ['confirmed', 'completed'].includes(normalized) ? 'confirmed' : 'unconfirmed';
  }
  function bookingCalendarStatusLabel(booking = {}) {
    return bookingCalendarStatusValue(booking) === 'confirmed' ? 'Confirmed' : 'Unconfirmed';
  }
  function bookingCalendarStatusBadge(booking = {}) {
    const status = bookingCalendarStatusValue(booking);
    return `<span class="badge ${status === 'confirmed' ? 'badge-confirmed' : 'badge-unconfirmed'}">${bookingCalendarStatusLabel(booking)}</span>`;
  }
  
  function bookingsForDate(dateIso) {
    return scheduledBookings()
      .filter((booking) => booking.date === dateIso)
      .sort((a, b) => bookingTimeValue(a.time).localeCompare(bookingTimeValue(b.time)));
  }
  
  function formatAgendaDate(dateIso) {
    const date = parseIsoDate(dateIso);
    if (!date) return 'Choose a day';
    return date.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'});
  }
  
  function shiftCalendarMonth(delta) {
    const base = calendarMonthCursor || monthStart(new Date());
    calendarMonthCursor = new Date(base.getFullYear(), base.getMonth() + delta, 1);
    renderBookingCalendar();
  }
  
  function selectCalendarDate(dateIso) {
    selectedCalendarDate = dateIso;
    const selectedDateObj = parseIsoDate(dateIso);
    if (selectedDateObj) calendarMonthCursor = monthStart(selectedDateObj);
    renderBookingCalendar();
  }
  
  function openBookingForSelectedDate() {
    openBookingModal(null, selectedCalendarDate || today());
  }
  
  function renderBookingAgenda() {
    const agendaDateEl = document.getElementById('calendar-agenda-date');
    const agendaSubEl = document.getElementById('calendar-agenda-sub');
    const agendaListEl = document.getElementById('calendar-agenda-list');
    if (!agendaDateEl || !agendaSubEl || !agendaListEl) return;
  
    const dateIso = selectedCalendarDate || today();
    const dayBookings = bookingsForDate(dateIso);
    agendaDateEl.textContent = formatAgendaDate(dateIso);
    agendaSubEl.textContent = dayBookings.length
      ? `${dayBookings.length} booking${dayBookings.length === 1 ? '' : 's'} scheduled`
      : 'No rentals scheduled yet';
  
    if (!dayBookings.length) {
      renderOpsMarkup(agendaListEl, `<div class="agenda-empty">No one is booked for this date yet on ${escapeHtml(dateIso)}.</div>`);
      return;
    }
  
    renderOpsMarkup(agendaListEl, dayBookings.map((booking) => `
      <div class="agenda-item">
        <div class="agenda-item-main">
          <strong>${escapeHtml(bookingDisplayName(booking))}</strong>
          <div class="agenda-item-meta">${escapeHtml(bookingCraftLabel(booking))} · ${escapeHtml(bookingDurationLabel(booking))} · ${escapeHtml(formatTimeLabel(booking.time))}</div>
          <div class="agenda-item-meta">${booking.phone ? escapeHtml(booking.phone) : 'No phone on file'}${booking.drone ? ' · Drone coverage' : ''}</div>
        </div>
        <div class="agenda-item-right">
          <div style="color:var(--wave);font-weight:500;">${bookingTotalLabel(booking)}</div>
          ${bookingCalendarStatusBadge(booking)}
          <div style="display:flex;gap:0.35rem;justify-content:flex-end;flex-wrap:wrap;margin-top:0.55rem;">
            <button class="btn btn-ghost btn-sm" data-booking-page-action="edit" data-booking-id="${Number(booking.id)}">Edit</button>
          </div>
        </div>
      </div>
    `).join(''));
  }
  
  function renderBookingCalendar() {
    const grid = document.getElementById('booking-calendar-grid');
    const monthLabel = document.getElementById('calendar-month-label');
    if (!grid || !monthLabel) return;
  
    if (!selectedCalendarDate || !parseIsoDate(selectedCalendarDate)) selectedCalendarDate = today();
    if (!calendarMonthCursor) {
      const selectedDateObj = parseIsoDate(selectedCalendarDate) || new Date();
      calendarMonthCursor = monthStart(selectedDateObj);
    }
  
    monthLabel.textContent = calendarMonthCursor.toLocaleDateString(undefined, {month:'long', year:'numeric'});
    const firstVisible = new Date(calendarMonthCursor.getFullYear(), calendarMonthCursor.getMonth(), 1 - calendarMonthCursor.getDay());
    const cells = [];
  
    for (let offset = 0; offset < 42; offset += 1) {
      const cellDate = new Date(firstVisible.getFullYear(), firstVisible.getMonth(), firstVisible.getDate() + offset);
      const cellIso = isoFromDate(cellDate);
      const dayBookings = bookingsForDate(cellIso);
      const previewItems = dayBookings.slice(0, 2);
      const isOtherMonth = cellDate.getMonth() !== calendarMonthCursor.getMonth();
      const isToday = cellIso === today();
      const isSelected = cellIso === selectedCalendarDate;
      const confirmedCount = dayBookings.filter((booking) => bookingCalendarStatusValue(booking) === 'confirmed').length;
      const unconfirmedCount = dayBookings.filter((booking) => bookingCalendarStatusValue(booking) === 'unconfirmed').length;
      const statusSummary = [];
      if (confirmedCount) statusSummary.push(`${confirmedCount} confirmed`);
      if (unconfirmedCount) statusSummary.push(`${unconfirmedCount} unconfirmed`);
  
      cells.push(`
        <button class="calendar-day${isOtherMonth ? ' other-month' : ''}${dayBookings.length ? ' has-bookings' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}" data-calendar-date="${escapeHtml(cellIso)}">
          <div class="calendar-day-top">
            <span class="calendar-day-num">${cellDate.getDate()}</span>
            ${dayBookings.length ? `<span class="calendar-day-count">${dayBookings.length}</span>` : ''}
          </div>
          <div class="calendar-day-meta">${dayBookings.length ? escapeHtml(statusSummary.join(' · ')) : '&nbsp;'}</div>
          <div class="calendar-day-list">
            ${previewItems.map((booking) => `<div class="calendar-pill ${escapeHtml(bookingCalendarStatusValue(booking))}"><span class="calendar-pill-dot"></span><span class="calendar-pill-status ${escapeHtml(bookingCalendarStatusValue(booking))}">${escapeHtml(bookingCalendarStatusLabel(booking))}</span><span>${escapeHtml(formatTimeLabel(booking.time))} · ${escapeHtml(firstName(bookingDisplayName(booking, 'Walk-up')))}</span></div>`).join('')}
            ${dayBookings.length > 2 ? `<div class="calendar-pill"><span class="calendar-pill-dot"></span><span>+${dayBookings.length - 2} more</span></div>` : ''}
          </div>
        </button>
      `);
    }
  
    renderOpsMarkup(grid, cells.join(''));
    renderBookingAgenda();
  }
  
  function renderBookings(filter) {
    if(filter) currentFilter = filter;
    // Show ALL real bookings — paid, unpaid, and unfinished (draft) — not just paid
    // ones, so a booking can never be invisible because its deposit or waiver wasn't
    // completed. Only dead statuses are hidden. This also makes the No-Shows tab work.
    // "All upcoming" stays future-only; a specific period shows the whole period
    // (including earlier today and past no-shows).
    const deadStatuses = ['cancelled', 'canceled', 'deleted', 'void', 'expired'];
    const allReal = bookings
      .filter((b) => b && parseIsoDate(b.date) && !deadStatuses.includes(normalizeBookingStatusValue(b.status)))
      .sort((left, right) => bookingScheduleSortKey(left).localeCompare(bookingScheduleSortKey(right)));
    const baseBookings = bookingPeriodFilter === 'all'
      ? allReal.filter((b) => { const st = bookingStartDateTime(b); return st && st >= new Date(); })
      : allReal;
    const visibleBookings = baseBookings.filter((booking) => bookingMatchesPeriod(booking));
    const list = currentFilter==='all'
      ? visibleBookings
      : visibleBookings.filter((booking) => normalizeBookingStatusValue(booking.status) === normalizeBookingStatusValue(currentFilter));
    const statusLabel = currentFilter === 'all'
      ? 'upcoming'
      : ({ confirmed: 'confirmed', pending: 'pending', completed: 'completed', noshow: 'no-show' }[normalizeBookingStatusValue(currentFilter)] || 'matching');
    const periodLabel = { today: ' for today', week: ' this week', month: ' this month', custom: ' in this range' }[bookingPeriodFilter] || '';
    const emptyMsg = `No ${statusLabel} bookings${periodLabel} yet.`;
    renderOpsMarkup(document.getElementById('bookings-table'), list.length ? list.map((b) => {
      const paid = bookingIsPaid(b);
      const normalizedStatus = normalizeBookingStatusValue(b.status);
      return `
      <tr data-status="${b.status}">
        <td>
          <strong>${escapeHtml(bookingDisplayName(b))}</strong>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.25rem;">
            ${b.waiverSignedAt ? `Waiver on file · ${escapeHtml(formatShortDate(b.waiverSignedAt))}` : 'Waiver still needed'}
          </div>
        </td>
        <td data-label="Phone">${b.phone ? `<a href="tel:${phoneHref(b.phone)}" style="color:var(--wave);text-decoration:none;">${escapeHtml(b.phone)}</a>` : '<span style="color:var(--muted);">—</span>'}</td>
        <td data-label="Craft">${escapeHtml(bookingCraftLabel(b))}</td>
        <td data-label="Date">${escapeHtml(formatShortDate(b.date))} ${escapeHtml(formatTimeLabel(b.time))}</td>
        <td data-label="Duration">${escapeHtml(bookingDurationLabel(b))}</td>
        <td data-label="Total" style="color:var(--wave);font-weight:500;">${bookingTotalLabel(b)}</td>
        <td data-label="Payment">${paid?'<span class="badge badge-confirmed">Paid</span>':'<span class="badge badge-noshow">Unpaid</span>'}</td>
        <td data-label="Status">${bookingCalendarStatusBadge(b)}</td>
        <td data-label="" style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" data-booking-page-action="edit" data-booking-id="${Number(b.id)}">Edit</button>
          ${!paid?`<button class="btn btn-ghost btn-sm" data-booking-page-action="deposit" data-booking-id="${Number(b.id)}">💰 Dep</button>`:''}
        </td>
      </tr>`;
    }).join('') : `<tr><td colspan="9"><div class="empty"><div class="icon">📅</div><p>${escapeHtml(emptyMsg)}</p></div></td></tr>`);
    renderBookingCalendar();
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-booking-page-action], [data-calendar-date]') : null;
    if (!target) return;
    const dateIso = target.dataset.calendarDate;
    if (dateIso) {
      selectCalendarDate(dateIso);
      return;
    }
    const action = target.dataset.bookingPageAction;
    const id = Number(target.dataset.bookingId);
    if (!Number.isFinite(id)) return;
    if (action === 'edit') {
      openBookingModal(id);
    } else if (action === 'deposit') {
      confirmDeposit(id);
    }
  });
  
  function filterByStatus(status, btn) {
    document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    renderBookings(status);
  }
  
  function statusBadge(s) {
    const normalized = normalizeBookingStatusValue(s);
    const map = {
      confirmed:'badge-confirmed',
      pending:'badge-pending',
      draft:'badge-pending',
      noshow:'badge-noshow',
      completed:'badge-completed',
      cancelled:'badge-cancelled'
    };
    const labels = {
      confirmed:'Confirmed',
      pending:'Pending',
      draft:'Draft',
      noshow:'No-show',
      completed:'Completed',
      cancelled:'Cancelled'
    };
    return `<span class="badge ${map[normalized] || ''}">${escapeHtml(labels[normalized] || String(s || 'Unknown'))}</span>`;
  }
  function trackerStatusBadge(status) {
    const normalized = String(status || '').trim().toLowerCase();
    const className = normalized === 'active'
      ? 'badge-confirmed'
      : normalized === 'spare'
        ? 'badge-completed'
        : normalized === 'installing'
          ? 'badge-pending'
          : normalized === 'lost'
            ? 'badge-noshow'
            : 'badge-cancelled';
    return `<span class="badge ${className}">${escapeHtml(status || 'Unknown')}</span>`;
  }
  function trackerDateLabel(value) {
    const parsed = dateValue(value);
    if (!parsed) return '—';
    return parsed.toLocaleString([], {month:'short', day:'numeric', year:'numeric'});
  }
  function resetTrackerForm() {
    editingTrackerId = null;
    [
      't-name','t-provider','t-model','t-serial','t-payment-plan','t-tracking-plan',
      't-monthly-fee','t-activation-fee','t-transaction-id','t-auth-code',
      't-transaction-date','t-share-url','t-last-checkin','t-contact-name','t-contact-email','t-notes'
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('t-provider').value = 'LandAirSea';
    document.getElementById('t-model').value = 'FiftyFour';
    document.getElementById('t-payment-plan').value = 'Monthly';
    document.getElementById('t-tracking-plan').value = '180 second updates';
    document.getElementById('t-asset').selectedIndex = 0;
    document.getElementById('t-status').value = 'active';
    document.getElementById('tracking-modal-title').textContent = 'Add Tracker';
    document.getElementById('tracking-save-button').textContent = 'Save Tracker';
    document.getElementById('tracking-delete-button').style.display = 'none';
  }
  function closeTrackerModal() {
    closeModal('tracking-modal');
    resetTrackerForm();
  }
  function getSelectedTracker() {
    const current = trackers.find((tracker) => Number(tracker.id) === Number(selectedTrackerId));
    if (current) return current;
    const preferred = trackers.find((tracker) => tracker.shareSpotUrl) || trackers[0] || null;
    if (preferred) selectedTrackerId = Number(preferred.id);
    return preferred;
  }
  function openTrackerModal(trackerId = null) {
    resetTrackerForm();
    if (trackerId !== null && trackerId !== undefined) {
      const tracker = trackers.find((item) => Number(item.id) === Number(trackerId));
      if (!tracker) {
        showToast('⚠️ Tracker record not found');
        return;
      }
      editingTrackerId = Number(tracker.id);
      selectedTrackerId = Number(tracker.id);
      document.getElementById('t-name').value = tracker.name || '';
      document.getElementById('t-provider').value = tracker.provider || 'LandAirSea';
      document.getElementById('t-model').value = tracker.model || 'FiftyFour';
      document.getElementById('t-serial').value = tracker.serialNumber || '';
      document.getElementById('t-asset').value = tracker.assignedAsset || '';
      document.getElementById('t-status').value = tracker.status || 'active';
      document.getElementById('t-payment-plan').value = tracker.paymentPlan || '';
      document.getElementById('t-tracking-plan').value = tracker.trackingPlan || '';
      document.getElementById('t-monthly-fee').value = tracker.monthlyFee ? String(Number(tracker.monthlyFee)) : '';
      document.getElementById('t-activation-fee').value = tracker.activationFee ? String(Number(tracker.activationFee)) : '';
      document.getElementById('t-transaction-id').value = tracker.transactionId || '';
      document.getElementById('t-auth-code').value = tracker.authorizationCode || '';
      document.getElementById('t-transaction-date').value = trackerDateTimeInputValue(tracker.transactionDate);
      document.getElementById('t-share-url').value = tracker.shareSpotUrl || '';
      document.getElementById('t-last-checkin').value = trackerDateTimeInputValue(tracker.lastCheckIn);
      document.getElementById('t-contact-name').value = tracker.contactName || '';
      document.getElementById('t-contact-email').value = tracker.contactEmail || '';
      document.getElementById('t-notes').value = tracker.notes || '';
      document.getElementById('tracking-modal-title').textContent = 'Edit Tracker';
      document.getElementById('tracking-save-button').textContent = 'Save Changes';
      document.getElementById('tracking-delete-button').style.display = '';
    }
    openModal('tracking-modal');
  }
  function openTrackerLiveMap(id) {
    const tracker = trackers.find((item) => Number(item.id) === Number(id));
    if (!tracker) {
      showToast('⚠️ Tracker record not found');
      return;
    }
    selectedTrackerId = Number(tracker.id);
    renderTracking();
  }
  function renderTracking() {
    syncAssetSelectors();
    const activeTrackers = trackers.filter((tracker) => trackerStatusValue(tracker.status) === 'active');
    const assignedTrackers = trackers.filter((tracker) => {
      const status = trackerStatusValue(tracker.status);
      return status !== 'inactive' && status !== 'lost' && String(tracker.assignedAsset || '').trim();
    });
    const recurringPlans = trackers.filter((tracker) => {
      const status = trackerStatusValue(tracker.status);
      return status !== 'inactive' && status !== 'lost' && Number(tracker.monthlyFee || 0) > 0;
    });
    const spareTrackers = trackers.filter((tracker) => {
      const status = trackerStatusValue(tracker.status);
      return status !== 'inactive' && status !== 'lost' && (!String(tracker.assignedAsset || '').trim() || status === 'spare');
    });
    const monthlyCost = trackers.reduce((sum, tracker) => {
      const status = trackerStatusValue(tracker.status);
      if (status === 'inactive' || status === 'lost') return sum;
      return sum + Number(tracker.monthlyFee || 0);
    }, 0);
  
    const activeEl = document.getElementById('tracking-kpi-active');
    const activeMetaEl = document.getElementById('tracking-kpi-active-meta');
    const monthlyEl = document.getElementById('tracking-kpi-monthly');
    const monthlyMetaEl = document.getElementById('tracking-kpi-monthly-meta');
    const assignedEl = document.getElementById('tracking-kpi-assigned');
    const assignedMetaEl = document.getElementById('tracking-kpi-assigned-meta');
    const spareEl = document.getElementById('tracking-kpi-spare');
    const spareMetaEl = document.getElementById('tracking-kpi-spare-meta');
    const summaryEl = document.getElementById('tracking-summary-pill');
    const tableEl = document.getElementById('tracking-table');
    const selectedCardEl = document.getElementById('tracking-selected-card');
    const liveMapEl = document.getElementById('tracking-live-map');
    const selectedTracker = getSelectedTracker();
  
    if (activeEl) activeEl.textContent = activeTrackers.length.toLocaleString();
    if (activeMetaEl) activeMetaEl.textContent = activeTrackers.length ? `${activeTrackers.length} live tracker${activeTrackers.length === 1 ? '' : 's'} currently reporting` : 'No active tracker plans on file';
    if (monthlyEl) monthlyEl.textContent = moneyLabel(monthlyCost);
    if (monthlyMetaEl) monthlyMetaEl.textContent = `${recurringPlans.length} recurring tracker plan${recurringPlans.length === 1 ? '' : 's'}`;
    if (assignedEl) assignedEl.textContent = assignedTrackers.length.toLocaleString();
    if (assignedMetaEl) assignedMetaEl.textContent = assignedTrackers.length ? `${assignedTrackers.length} tracker${assignedTrackers.length === 1 ? '' : 's'} tied to the fleet` : 'No trackers assigned to the fleet yet';
    if (spareEl) spareEl.textContent = spareTrackers.length.toLocaleString();
    if (spareMetaEl) spareMetaEl.textContent = spareTrackers.length ? `${spareTrackers.length} tracker${spareTrackers.length === 1 ? '' : 's'} ready for install or reassignment` : 'Every saved tracker is assigned';
    if (summaryEl) summaryEl.textContent = trackers.length ? `${trackers.length} tracker${trackers.length === 1 ? '' : 's'} · ${moneyLabel(monthlyCost)}/mo` : 'No trackers added yet';
    const selectedShareUrl = safeTrackerShareUrl(selectedTracker?.shareSpotUrl);
    if (selectedCardEl) {
      renderOpsMarkup(selectedCardEl, selectedTracker ? `
        <div class="list-row">
          <div class="list-row-main">
            <strong>${escapeHtml(selectedTracker.name || 'Unnamed tracker')}</strong>
            <div class="sub">${escapeHtml(selectedTracker.assignedAsset || 'Unassigned / spare')} · ${escapeHtml(selectedTracker.provider || 'LandAirSea')} · ${escapeHtml(selectedTracker.model || 'Unknown model')}</div>
            <div class="sub">Serial ${escapeHtml(selectedTracker.serialNumber || '—')} · ${escapeHtml(selectedTracker.trackingPlan || 'No tracking plan')}</div>
            <div class="sub">Last check-in ${escapeHtml(trackerDateLabel(selectedTracker.lastCheckIn))} · Monthly ${moneyLabel(selectedTracker.monthlyFee || 0)}</div>
          </div>
          <div class="list-row-actions">
            ${trackerStatusBadge(selectedTracker.status)}
            <button class="btn btn-ghost btn-sm" data-tracking-action="edit" data-tracker-id="${Number(selectedTracker.id)}">Edit tracker</button>
            <button class="btn btn-danger btn-sm" data-tracking-action="delete" data-tracker-id="${Number(selectedTracker.id)}">Delete tracker</button>
            ${selectedShareUrl ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(selectedShareUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">Open live map</a>` : `<button class="btn btn-primary btn-sm" data-tracking-action="edit" data-tracker-id="${Number(selectedTracker.id)}">Add live map link</button>`}
          </div>
        </div>
        <div class="list-row">
          <div class="list-row-main">
            <strong>Billing + account details</strong>
            <div class="sub">${escapeHtml(selectedTracker.paymentPlan || 'No payment plan')} · ${escapeHtml(selectedTracker.contactName || 'No contact name')} · ${escapeHtml(selectedTracker.contactEmail || 'No contact email')}</div>
            <div class="sub">Txn ${escapeHtml(selectedTracker.transactionId || '—')} · Auth ${escapeHtml(selectedTracker.authorizationCode || '—')} · Activated ${escapeHtml(trackerDateLabel(selectedTracker.transactionDate))}</div>
            ${selectedTracker.notes ? `<div class="sub">${escapeHtml(selectedTracker.notes)}</div>` : ''}
          </div>
        </div>
      ` : '<div class="empty"><div class="icon">📡</div><p>Save a tracker to start live monitoring.</p></div>');
    }
    if (liveMapEl) {
      renderOpsMarkup(liveMapEl, selectedShareUrl ? `
        <div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;background:rgba(255,255,255,0.03);">
          <iframe src="${escapeHtml(selectedShareUrl)}" title="Tracker live map" style="width:100%;height:420px;border:0;background:#0b1727;"></iframe>
        </div>
        <div class="compose-actions" style="margin-top:0.75rem;">
          <a class="btn btn-primary btn-sm" href="${escapeHtml(selectedShareUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">Open ShareSpot</a>
          <button class="btn btn-ghost btn-sm" data-tracking-action="edit" data-tracker-id="${Number(selectedTracker.id)}">Edit tracker</button>
          <button class="btn btn-danger btn-sm" data-tracking-action="delete" data-tracker-id="${Number(selectedTracker.id)}">Delete tracker</button>
          <button class="btn btn-ghost btn-sm" data-tracking-action="refresh">Refresh panel</button>
        </div>
        <p class="note-soft" style="margin-top:0.75rem;">If LandAirSea blocks iframe embedding for this link, use <strong>Open ShareSpot</strong> to view the live location in a full tab.</p>
      ` : selectedTracker ? `
        <div class="empty">
          <div class="icon">🛰️</div>
          <p>${escapeHtml(selectedTracker.name || 'This tracker')} does not have a ShareSpot link saved yet.</p>
          <button class="btn btn-primary btn-sm" style="margin-top:0.9rem;" data-tracking-action="edit" data-tracker-id="${Number(selectedTracker.id)}">Add live map link</button>
        </div>
      ` : '<div class="empty"><div class="icon">🛰️</div><p>Add a ShareSpot link to a tracker and it will appear here as a live map panel.</p></div>');
    }
  
    if (!tableEl) return;
    const ordered = sortNewestFirst(trackers, (tracker) => tracker.transactionDate || tracker.createdAt || '');
    renderOpsMarkup(tableEl, ordered.length ? ordered.map((tracker) => `
      <tr>
        <td>
          <strong>${escapeHtml(tracker.name || 'Unnamed tracker')}</strong>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">${escapeHtml(tracker.model || 'Unknown model')}${tracker.serialNumber ? ` · S/N ${escapeHtml(tracker.serialNumber)}` : ''}</div>
        </td>
        <td data-label="Assigned">
          <strong>${escapeHtml(tracker.assignedAsset || 'Unassigned / spare')}</strong>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">${escapeHtml(tracker.contactName || tracker.contactEmail || 'No account contact saved')}</div>
        </td>
        <td data-label="Provider">
          <div>${escapeHtml(tracker.provider || 'Unknown provider')}</div>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">${escapeHtml(tracker.paymentPlan || 'No payment plan')}${tracker.trackingPlan ? ` · ${escapeHtml(tracker.trackingPlan)}` : ''}</div>
        </td>
        <td data-label="Billing">
          <div style="color:var(--amber);font-weight:500;">${moneyLabel(tracker.monthlyFee || 0)}/mo</div>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">Activation ${moneyLabel(tracker.activationFee || 0)}</div>
        </td>
        <td data-label="Transaction">
          <div>${tracker.transactionId ? `Txn ${escapeHtml(tracker.transactionId)}` : 'No transaction saved'}</div>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">${tracker.authorizationCode ? `Auth ${escapeHtml(tracker.authorizationCode)} · ` : ''}${escapeHtml(trackerDateLabel(tracker.transactionDate))}</div>
        </td>
        <td data-label="Status">
          <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-start;">
            ${trackerStatusBadge(tracker.status)}
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
              <button class="btn btn-ghost btn-sm" data-tracking-action="live-map" data-tracker-id="${Number(tracker.id)}">${tracker.shareSpotUrl ? 'View live map' : 'Select tracker'}</button>
              <button class="btn btn-ghost btn-sm" data-tracking-action="edit" data-tracker-id="${Number(tracker.id)}">Edit</button>
              <button class="btn btn-danger btn-sm" data-tracking-action="delete" data-tracker-id="${Number(tracker.id)}">Delete</button>
            </div>
          </div>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6"><div class="empty"><div class="icon">📡</div><p>No trackers saved yet. Add the first tracker here.</p></div></td></tr>');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-tracking-action]') : null;
    if (!target) return;
    const action = target.dataset.trackingAction;
    const id = Number(target.dataset.trackerId);
    if (action === 'refresh') {
      renderTracking();
      return;
    }
    if (!Number.isFinite(id)) return;
    if (action === 'edit') {
      openTrackerModal(id);
    } else if (action === 'delete') {
      deleteTracker(id);
    } else if (action === 'live-map') {
      openTrackerLiveMap(id);
    }
  });
  async function saveTracker() {
    const name = document.getElementById('t-name').value.trim();
    const serialNumber = document.getElementById('t-serial').value.trim();
    if (!name || !serialNumber) {
      showToast('⚠️ Add a device label and serial number');
      return;
    }
    const existingTracker = editingTrackerId
      ? trackers.find((tracker) => Number(tracker.id) === Number(editingTrackerId))
      : null;
    if (editingTrackerId && !existingTracker) {
      showToast('⚠️ Tracker record not found');
      return;
    }
    const duplicateTracker = trackers.find((tracker) => {
      if (Number(tracker.id) === Number(editingTrackerId || 0)) return false;
      return trackerSerialKey(tracker.serialNumber) === trackerSerialKey(serialNumber);
    });
    if (duplicateTracker) {
      showToast(`⚠️ Serial number already belongs to ${duplicateTracker.name || 'another tracker'}`);
      return;
    }
    const previousTrackers = JSON.parse(JSON.stringify(trackers));
    const previousSelectedTrackerId = selectedTrackerId;
    const tracker = existingTracker || {
      id: nextId(trackers),
      createdAt: new Date().toISOString()
    };
    tracker.name = name;
    tracker.provider = document.getElementById('t-provider').value.trim() || 'LandAirSea';
    tracker.model = document.getElementById('t-model').value.trim() || 'FiftyFour';
    tracker.serialNumber = serialNumber;
    tracker.assignedAsset = document.getElementById('t-asset').value.trim();
    tracker.status = document.getElementById('t-status').value || 'active';
    tracker.paymentPlan = document.getElementById('t-payment-plan').value.trim();
    tracker.trackingPlan = document.getElementById('t-tracking-plan').value.trim();
    tracker.monthlyFee = Number(document.getElementById('t-monthly-fee').value || 0);
    tracker.activationFee = Number(document.getElementById('t-activation-fee').value || 0);
    tracker.transactionId = document.getElementById('t-transaction-id').value.trim();
    tracker.authorizationCode = document.getElementById('t-auth-code').value.trim();
    tracker.transactionDate = document.getElementById('t-transaction-date').value.trim();
    tracker.shareSpotUrl = normalizeTrackerShareUrl(document.getElementById('t-share-url').value);
    tracker.lastCheckIn = document.getElementById('t-last-checkin').value.trim();
    tracker.contactName = document.getElementById('t-contact-name').value.trim();
    tracker.contactEmail = document.getElementById('t-contact-email').value.trim();
    tracker.notes = document.getElementById('t-notes').value.trim();
    tracker.updatedAt = new Date().toISOString();
    if (!existingTracker) trackers.unshift(tracker);
    selectedTrackerId = Number(tracker.id);
    if (!(await persistStateChange())) {
      trackers = previousTrackers;
      selectedTrackerId = previousSelectedTrackerId;
      return;
    }
    closeTrackerModal();
    syncAssetSelectors();
    renderTracking();
    renderMaint();
    showToast(existingTracker ? '📡 Tracker updated' : '📡 Tracker saved');
  }
  
  async function deleteTracker(trackerId = null) {
    const resolvedTrackerId = Number(trackerId ?? editingTrackerId ?? selectedTrackerId ?? 0);
    const tracker = trackers.find((item) => Number(item.id) === resolvedTrackerId);
    if (!tracker) {
      showToast('⚠️ Tracker record not found');
      return;
    }
    const confirmed = window.confirm(`Delete tracker "${tracker.name}" (${tracker.serialNumber || 'no serial'})?`);
    if (!confirmed) return;
    const previousTrackers = JSON.parse(JSON.stringify(trackers));
    const previousSelectedTrackerId = selectedTrackerId;
    const shouldCloseEditor = editingTrackerId && Number(editingTrackerId) === resolvedTrackerId;
    trackers = trackers.filter((item) => Number(item.id) !== resolvedTrackerId);
    if (Number(selectedTrackerId) === resolvedTrackerId) {
      selectedTrackerId = trackers[0] ? Number(trackers[0].id) : null;
    }
    if (!(await persistStateChange())) {
      trackers = previousTrackers;
      selectedTrackerId = previousSelectedTrackerId;
      return;
    }
    if (shouldCloseEditor) closeTrackerModal();
    syncAssetSelectors();
    renderTracking();
    renderMaint();
    showToast('🗑️ Tracker removed');
  }
  
  async function updateStatus(id, status) {
    const booking = bookings.find((item) => Number(item.id) === Number(id));
    if (!booking) return;
    const previousStatus = booking.status;
    const previousUpdatedAt = booking.updatedAt;
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    try {
      if (!(await persistStateChange())) {
        booking.status = previousStatus;
        booking.updatedAt = previousUpdatedAt;
        return;
      }
      const reviewAutoSent = normalizeBookingStatusValue(status) === 'completed' && normalizeBookingStatusValue(previousStatus) !== 'completed'
        ? await autoSendReviewForBooking(booking)
        : false;
      renderBookings();
      renderInvoices();
      renderUpcoming();
      renderDashboardMetrics();
      renderBookingBars();
      renderCRM();
      renderCommsPanel();
      renderReviewHub();
      renderReminders();
      renderWaivers();
      updatePendingBadge();
      showToast(reviewAutoSent ? '✅ Updated to completed and sent the review request' : `✅ Updated to ${status}`);
    } catch (error) {
      booking.status = previousStatus;
      booking.updatedAt = previousUpdatedAt;
      showToast(`⚠️ ${error.message || 'Could not update booking status'}`);
    }
  }
  
  async function confirmDeposit(id) {
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return;
    const previousDeposit = booking.deposit;
    const previousPaymentStatus = booking.paymentStatus;
    const previousPaymentCompletedAt = booking.paymentCompletedAt;
    const previousUpdatedAt = booking.updatedAt;
    const previousInvoices = invoices.map((invoice) => ({ ...invoice }));
    booking.deposit = true;
    booking.paymentStatus = 'paid';
    booking.paymentCompletedAt = new Date().toISOString();
    booking.updatedAt = booking.paymentCompletedAt;
  
    // Sync the booking's linked invoice so it reflects the collected deposit. The
    // server re-derives a booking's deposit status from its invoice (and will
    // auto-create an unpaid one otherwise), so without this the flag reverts on the
    // next sync. ensureLinkedInvoiceForBookingLocally records the right amount for
    // the booking type: the deposit due for checkout-flow bookings, full for manual.
    ensureLinkedInvoiceForBookingLocally(booking);
  
    const rollback = () => {
      booking.deposit = previousDeposit;
      booking.paymentStatus = previousPaymentStatus;
      booking.paymentCompletedAt = previousPaymentCompletedAt;
      booking.updatedAt = previousUpdatedAt;
      invoices = previousInvoices;
    };
  
    try {
      if (!(await persistStateChange())) {
        rollback();
        return;
      }
      renderBookings();
      renderInvoices();
      renderUpcoming();
      renderDashboardMetrics();
      renderBookingBars();
      renderCRM();
      renderCommsPanel();
      renderWaivers();
      updatePendingBadge();
      showToast(`💰 Deposit confirmed for ${bookingDisplayName(booking)}`);
    } catch (error) {
      rollback();
      showToast(`⚠️ ${error.message || 'Could not confirm the deposit'}`);
    }
  }
  
  async function deleteBooking(bookingId) {
    const booking = bookings.find((item) => Number(item.id) === Number(bookingId));
    if (!booking) {
      showToast('⚠️ Booking record not found');
      return;
    }
    const confirmed = window.confirm(`Delete the booking for ${bookingDisplayName(booking)}? This cannot be undone from ops.`);
    if (!confirmed) return;
    const previousBookings = JSON.parse(JSON.stringify(bookings));
    const previousInvoices = JSON.parse(JSON.stringify(invoices));
    const previousCustomers = JSON.parse(JSON.stringify(customers));
    const previousCustomer = findCustomerForBooking(booking);
    const shouldCloseEditor = editingBookingId && Number(editingBookingId) === Number(bookingId);
    bookings = bookings.filter((item) => Number(item.id) !== Number(bookingId));
    invoices.forEach((invoice) => {
      if (!invoiceMatchesBookingRecord(invoice, booking)) return;
      invoice.bookingId = 0;
      invoice.bookingPublicToken = '';
      invoice.paymentSessionId = '';
      invoice.paymentIntentId = '';
      invoice.rawFields = mergeCrmFields(invoice.rawFields, {
        bookingId: '',
        bookingPublicToken: '',
        paymentSessionId: '',
        paymentIntentId: '',
        bookingStatus: 'deleted'
      });
    });
    if (previousCustomer) syncCustomerRollup(previousCustomer);
    if (!(await persistStateChange())) {
      bookings = previousBookings;
      invoices = previousInvoices;
      customers = previousCustomers;
      return;
    }
    if (shouldCloseEditor) {
      closeModal('booking-modal');
      resetBookingForm();
    }
    renderBookings();
    renderInvoices();
    renderUpcoming();
    renderDashboardMetrics();
    renderBookingBars();
    renderCRM();
    renderWaivers();
    renderCommsPanel();
    renderReviewHub();
    renderReminders();
    updatePendingBadge();
    showToast('🗑️ Booking removed');
  }
  
  function filterTable(input, tableId) {
    const q = input.value.toLowerCase();
    document.querySelectorAll('#'+tableId+' tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
  
  // ── INVOICES ──
  function renderFleetLegend() {
    const legend = document.getElementById('fleet-legend');
    if (!legend) return;
    const palette = ['#f5a623', '#7dd9ff', '#10b981', '#8b5cf6', '#ef4444'];
    const counts = new Map();
    upcomingScheduledBookings().forEach((booking) => {
      const label = bookingCraftLabel(booking);
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    renderOpsMarkup(legend, Array.from(counts.entries()).map(([label, count], index) => `
      <div class="legend-item"><div class="legend-dot" style="background:${palette[index % palette.length]}"></div>${escapeHtml(label)} — ${count}</div>
    `).join(''));
  }
  function renderDashboardMetrics() {
    const pendingDeposits = pendingOpsBookings().length;
    const revenue = revenueThisMonth();
    const monthlyBookings = scheduledBookings().filter((booking) => isSameMonth(dateValue(booking.date))).length;
    const collectedInvoicesThisMonth = invoices.filter((invoice) => invoiceCollectedAmount(invoice) > 0 && isSameMonth(invoiceDateValue(invoice))).length;
  
    const pendingEl = document.getElementById('dashboard-kpi-pending');
    const pendingMeta = document.getElementById('dashboard-kpi-pending-meta');
    const revenueEl = document.getElementById('dashboard-kpi-revenue');
    const revenueMeta = document.getElementById('dashboard-kpi-revenue-meta');
    const bookingsEl = document.getElementById('dashboard-kpi-bookings');
    const bookingsMeta = document.getElementById('dashboard-kpi-bookings-meta');
  
    if (pendingEl) pendingEl.textContent = pendingDeposits.toLocaleString();
    if (pendingMeta) pendingMeta.textContent = pendingDeposits ? `${pendingDeposits} paid bookings still need ops confirmation` : 'No paid bookings are waiting on ops follow-up';
    if (revenueEl) revenueEl.textContent = `${Math.round(revenue).toLocaleString()}`;
    if (revenueMeta) revenueMeta.textContent = collectedInvoicesThisMonth ? 'Invoice payments collected this month' : 'Paid bookings recognized this month';
    if (bookingsEl) bookingsEl.textContent = monthlyBookings.toLocaleString();
    if (bookingsMeta) bookingsMeta.textContent = `${monthlyBookings} rentals scheduled this month`;
    renderFleetLegend();
  }
  async function markInvoicePaid(invoiceId) {
    const invoice = invoices.find((item) => Number(item.id) === Number(invoiceId));
    if (!invoice) return;
    const outstanding = invoiceOutstandingAmount(invoice);
    if (outstanding <= 0) { showToast('Already fully collected ✓'); return; }
    if (!confirm(`Mark this invoice fully paid? This records ${moneyLabel(outstanding)} collected.`)) return;
    const prevStatus = invoice.status;
    const prevPaid = invoice.paidAmount;
    const prevBalance = invoice.balanceDue;
    invoice.paidAmount = Number(invoice.total || 0);
    invoice.balanceDue = 0;
    invoice.status = 'paid';
    try {
      if (!(await persistStateChange())) {
        invoice.status = prevStatus;
        invoice.paidAmount = prevPaid;
        invoice.balanceDue = prevBalance;
        showToast('⚠️ Could not save — try again');
        return;
      }
      renderInvoices();
      renderDashboardMetrics();
      renderUpcoming();
      renderCRM();
      showToast(`✅ Marked paid — collected ${moneyLabel(outstanding)}`);
    } catch (error) {
      invoice.status = prevStatus;
      invoice.paidAmount = prevPaid;
      showToast(`⚠️ ${error.message || 'Could not mark invoice paid'}`);
    }
  }
  
  function renderInvoices() {
    const filteredInvoices = sortNewestFirst(filteredInvoicesList(), (invoice) => invoiceDateValue(invoice));
    const paidInvoices = filteredInvoices.filter((invoice) => invoiceCollectedAmount(invoice) > 0);
    const openInvoices = filteredInvoices.filter((invoice) => ['draft', 'sent', 'open', 'partially paid', 'unpaid', 'overdue'].includes(normalizeInvoiceStatus(invoice.status)));
    const unknownInvoices = filteredInvoices.filter((invoice) => !invoiceHasKnownCustomer(invoice));
    const paidTotal = paidInvoices.reduce((sum, invoice) => sum + invoiceCollectedAmount(invoice), 0);
    const openTotal = openInvoices.reduce((sum, invoice) => sum + invoiceOutstandingAmount(invoice), 0);
  
    const countEl = document.getElementById('invoice-kpi-count');
    const updatedEl = document.getElementById('invoice-kpi-updated');
    const paidEl = document.getElementById('invoice-kpi-paid');
    const paidCountEl = document.getElementById('invoice-kpi-paid-count');
    const openEl = document.getElementById('invoice-kpi-open');
    const openCountEl = document.getElementById('invoice-kpi-open-count');
    const unknownEl = document.getElementById('invoice-kpi-unknown');
    if (countEl) countEl.textContent = filteredInvoices.length.toLocaleString();
    if (updatedEl) updatedEl.textContent = invoiceImportMeta.importedAt ? `${invoiceImportMeta.recordCount} rows synced` : 'No invoice import yet';
    if (paidEl) paidEl.textContent = `${paidTotal.toLocaleString()}`;
    if (paidCountEl) paidCountEl.textContent = `${paidInvoices.length} collected invoices`;
    if (openEl) openEl.textContent = `${openTotal.toLocaleString()}`;
    if (openCountEl) openCountEl.textContent = `${openInvoices.length} open invoices`;
    if (unknownEl) unknownEl.textContent = unknownInvoices.length.toLocaleString();
  
    const table = document.getElementById('invoice-table');
    if (!table) return;
    const emptyMsg = invoiceSearchQuery
      ? 'No invoices match your search.'
      : invoiceStatusFilter === 'overdue' ? 'No overdue invoices — all caught up. 🎉'
      : invoiceStatusFilter === 'open' ? 'No open balances in this view.'
      : invoiceStatusFilter === 'paid' ? 'No paid invoices in this view.'
      : invoicePeriodFilter === 'today' ? 'No invoices for today yet.'
      : invoicePeriodFilter === 'week' ? 'No invoices this week.'
      : invoicePeriodFilter === 'month' ? 'No invoices this month.'
      : invoicePeriodFilter === 'year' ? 'No invoices this year.'
      : invoicePeriodFilter === 'custom' ? 'No invoices in this date range.'
      : 'No invoices yet.';
    renderOpsMarkup(table, filteredInvoices.length ? filteredInvoices.map((invoice) => `
      <tr class="${invoiceOutstandingAmount(invoice) > 0 ? 'inv-owing' : ''}">
        ${(() => {
          const contact = invoiceDisplayContact(invoice);
          return `
        <td>
          <strong>${escapeHtml(invoice.invoiceNumber || 'No number')}</strong>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">${escapeHtml(invoice.invoiceName || 'Invoice')}</div>
        </td>
        <td data-label="Customer">
          <strong>${escapeHtml(contact.name || 'Unknown')}</strong>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">${contact.phone ? `<a href="tel:${phoneHref(contact.phone)}" style="color:var(--wave);text-decoration:none;">${escapeHtml(contact.phone)}</a>` : escapeHtml(contact.email || 'No contact')}</div>
        </td>
        <td data-label="Issued">${escapeHtml(formatShortDate(invoice.issueDate))}</td>
        <td data-label="Due">${escapeHtml(formatShortDate(invoice.dueDate))}</td>
        <td data-label="Items">${escapeHtml(invoiceLineSummary(invoice))}</td>
        <td data-label="Amount" style="font-weight:600;">${moneyLabel(invoice.total || 0)}<div style="font-size:0.72rem;margin-top:0.2rem;">${invoiceOutstandingAmount(invoice) > 0 ? `<span style="color:var(--amber);">${moneyLabel(invoiceOutstandingAmount(invoice))} due</span>` : '<span style="color:var(--green);">Paid in full</span>'}</div></td>
        <td data-label="Status">${invoiceIsOverdue(invoice) ? '<span class="badge badge-noshow">Overdue</span>' : invoiceStatusBadge(invoice.status)}</td>
        <td data-label="" style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          ${invoiceOutstandingAmount(invoice) > 0 ? `<button class="btn btn-success btn-sm" data-invoice-action="paid" data-invoice-id="${Number(invoice.id)}">💵 Mark Paid</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-invoice-action="review" data-invoice-id="${Number(invoice.id)}">⭐ Review</button>
          <button class="btn btn-ghost btn-sm" data-invoice-action="edit" data-invoice-id="${Number(invoice.id)}">Edit</button>
          <button class="btn btn-danger btn-sm" data-invoice-action="delete" data-invoice-id="${Number(invoice.id)}">Delete</button>
        </td>
        `;
        })()}
      </tr>
    `).join('') : `<tr><td colspan="8"><div class="empty"><div class="icon">🧾</div><p>${escapeHtml(emptyMsg)}</p></div></td></tr>`);
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-invoice-action]') : null;
    if (!target) return;
    const action = target.dataset.invoiceAction;
    const id = Number(target.dataset.invoiceId);
    if (!Number.isFinite(id)) return;
    if (action === 'paid') {
      markInvoicePaid(id);
    } else if (action === 'review') {
      requestReviewForInvoice(id);
    } else if (action === 'edit') {
      openInvoiceModal(id);
    } else if (action === 'delete') {
      deleteInvoice(id);
    }
  });
  
  // ── CRM ──
  function customerHasWaiver(customer) {
    return Boolean(
      customer.waiverOnFile === true ||
      String(customer.waiverSignedAt || '').trim() ||
      String(customer.waiverSignature || '').trim()
    );
  }
  function customerNeedsFollowUp(customer) {
    if ((Number(customer.bookings) || 0) === 0) return true;
    const lastActivityDays = dateValue(customer.lastActivity) ? daysSince(customer.lastActivity) : null;
    const lastBookingDays = dateValue(customer.lastBooking) ? daysSince(customer.lastBooking) : null;
    const dayCandidates = [lastActivityDays, lastBookingDays].filter((value) => Number.isFinite(value));
    if (!dayCandidates.length) return false;
    const recentDays = Math.min(...dayCandidates);
    return recentDays >= 30;
  }
  function customerIsBest(customer) {
    const totalSpent = Number(customer.totalSpent) || 0;
    const bookingsCount = Number(customer.bookings) || 0;
    const tags = `${customer.tag || ''} ${customer.crmTags || ''}`.toLowerCase();
    return totalSpent >= 1000 || bookingsCount >= 2 || tags.includes('vip') || tags.includes('repeat');
  }
  function customerLastTouchValue(customer) {
    return [customer.createdAt, customer.lastBooking, customer.lastActivity].reduce((latest, value) => (
      updateLatestDate(latest, value)
    ), '');
  }
  function customerLastTouchLabel(customer) {
    const lastTouch = customerLastTouchValue(customer);
    if (!lastTouch) return 'No recent activity saved';
    const days = daysSince(lastTouch);
    if (days === 999) return 'No recent activity saved';
    return days === 0 ? 'Touched today' : `Touched ${days}d ago`;
  }
  function crmFilterMatches(customer) {
    if (crmViewFilter === 'followup') return customerNeedsFollowUp(customer);
    if (crmViewFilter === 'waiver') return !customerHasWaiver(customer);
    if (crmViewFilter === 'best') return customerIsBest(customer);
    return true;
  }
  function sortCustomersForCRM(list) {
    const items = [...list];
    if (crmSortMode === 'spend') {
      return items.sort((left, right) => (Number(right.totalSpent) || 0) - (Number(left.totalSpent) || 0));
    }
    if (crmSortMode === 'bookings') {
      return items.sort((left, right) => (Number(right.bookings) || 0) - (Number(left.bookings) || 0) || (Number(right.totalSpent) || 0) - (Number(left.totalSpent) || 0));
    }
    if (crmSortMode === 'name') {
      return items.sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
    }
    return sortNewestFirst(items, (customer) => customerLastTouchValue(customer));
  }
  
  function customerWaiverSignedLabel(customer) {
    if (dateValue(customer.waiverSignedAt)) return formatShortDate(customer.waiverSignedAt);
    if (String(customer.waiverSignature || '').trim()) return 'Signature on file';
    if (customer.waiverOnFile) return 'On file';
    return '—';
  }
  
  function customerWaiverDetailLabel(customer) {
    const detailParts = [];
    if (dateValue(customer.dateOfBirth)) detailParts.push(`DOB ${formatShortDate(customer.dateOfBirth)}`);
    else if (String(customer.dateOfBirth || '').trim()) detailParts.push(`DOB ${escapeHtml(customer.dateOfBirth)}`);
    if (String(customer.waiverInitials || '').trim()) detailParts.push(`Initials ${escapeHtml(customer.waiverInitials)}`);
    if (String(customer.waiverSignature || '').trim()) detailParts.push('Signature saved');
    return detailParts.length ? detailParts.join(' · ') : 'No extra waiver details saved';
  }
  
  function filterWaivers(input) {
    waiverSearchQuery = String(input.value || '').trim().toLowerCase();
    renderWaivers();
  }
  
  function renderWaivers() {
    const signedCustomers = customers
      .filter(customerHasWaiver)
      .filter((customer) => {
        if (!waiverSearchQuery) return true;
        return [
          customer.name,
          customer.phone,
          customer.email,
          customer.dateOfBirth,
          customer.waiverInitials,
          customer.emergencyName,
          customer.emergencyPhone,
          customer.crmNotes
        ].join(' ').toLowerCase().includes(waiverSearchQuery);
      })
      .sort((left, right) => {
        const leftDate = dateValue(left.waiverSignedAt || left.lastActivity || left.createdAt);
        const rightDate = dateValue(right.waiverSignedAt || right.lastActivity || right.createdAt);
        return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
      });
  
    const totalSigned = customers.filter(customerHasWaiver).length;
    const signedThisMonth = customers.filter((customer) => customerHasWaiver(customer) && isSameMonth(dateValue(customer.waiverSignedAt))).length;
    const waiverOnlyLeads = customers.filter((customer) => customerHasWaiver(customer) && (Number(customer.bookings) || 0) === 0).length;
    const missingEmergency = customers.filter((customer) => customerHasWaiver(customer) && !String(customer.emergencyName || '').trim() && !String(customer.emergencyPhone || '').trim()).length;
  
    if (document.getElementById('waiver-kpi-total')) document.getElementById('waiver-kpi-total').textContent = totalSigned.toLocaleString();
    if (document.getElementById('waiver-kpi-total-meta')) document.getElementById('waiver-kpi-total-meta').textContent = `${signedCustomers.length} match the current search`;
    if (document.getElementById('waiver-kpi-month')) document.getElementById('waiver-kpi-month').textContent = signedThisMonth.toLocaleString();
    if (document.getElementById('waiver-kpi-month-meta')) document.getElementById('waiver-kpi-month-meta').textContent = signedThisMonth ? `${signedThisMonth} signed this month` : 'No waiver submissions this month yet';
    if (document.getElementById('waiver-kpi-leads')) document.getElementById('waiver-kpi-leads').textContent = waiverOnlyLeads.toLocaleString();
    if (document.getElementById('waiver-kpi-leads-meta')) document.getElementById('waiver-kpi-leads-meta').textContent = waiverOnlyLeads ? `${waiverOnlyLeads} signed but not booked yet` : 'Every signed waiver has booking history';
    if (document.getElementById('waiver-kpi-emergency')) document.getElementById('waiver-kpi-emergency').textContent = missingEmergency.toLocaleString();
    if (document.getElementById('waiver-kpi-emergency-meta')) document.getElementById('waiver-kpi-emergency-meta').textContent = missingEmergency ? `${missingEmergency} records missing emergency details` : 'Emergency details look complete';
    if (document.getElementById('waiver-summary-pill')) document.getElementById('waiver-summary-pill').textContent = totalSigned ? `${totalSigned} signed waiver${totalSigned === 1 ? '' : 's'} on file` : 'No signed waivers yet';
  
    const table = document.getElementById('waivers-table');
    if (!table) return;
    renderOpsMarkup(table, signedCustomers.length ? signedCustomers.map((customer) => {
      const contactLine = [customer.phone, customer.email].filter(Boolean).map(escapeHtml);
      const emergencyLine = [customer.emergencyName, customer.emergencyPhone].filter(Boolean).map(escapeHtml);
      return `
        <tr>
          <td>
            <strong>${escapeHtml(customer.name || 'Unnamed customer')}</strong>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem;">${escapeHtml(customer.source || 'Website waiver')}</div>
          </td>
          <td data-label="Contact">${contactLine.length ? contactLine.join('<br>') : '<span style="color:var(--muted);">No contact info saved</span>'}</td>
          <td data-label="Signed">
            <div>${escapeHtml(customerWaiverSignedLabel(customer))}</div>
            <div style="font-size:0.72rem;color:var(--green);margin-top:0.2rem;">${String(customer.waiverSignature || '').trim() ? 'Signature saved' : 'Signed waiver on file'}</div>
          </td>
          <td data-label="Waiver" style="color:var(--muted);">${customerWaiverDetailLabel(customer)}</td>
          <td data-label="Emergency">${emergencyLine.length ? emergencyLine.join('<br>') : '<span style="color:var(--muted);">No emergency info saved</span>'}</td>
          <td data-label="Bookings">
            <div>${Number(customer.bookings) || 0} booking${Number(customer.bookings) === 1 ? '' : 's'}</div>
            <div style="font-size:0.72rem;color:var(--wave);margin-top:0.2rem;">${moneyLabel(customer.totalSpent)} total spent</div>
          </td>
          <td data-label="">
            <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
              <button class="btn btn-ghost btn-sm" data-customer-action="edit" data-customer-id="${Number(customer.id)}">Edit</button>
              ${customer.phone ? `<a href="tel:${phoneHref(customer.phone)}" class="btn btn-ghost btn-sm" style="text-decoration:none;display:inline-block;">📞 Call</a>` : ''}
              ${customer.email ? `<a href="mailto:${encodeURIComponent(customer.email)}" class="btn btn-ghost btn-sm" style="text-decoration:none;display:inline-block;">✉️ Email</a>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="7"><div class="empty"><div class="icon">📝</div><p>No signed waivers match this search yet.</p></div></td></tr>');
  }
  
  function toggleCustomerDetail(customerId) {
    expandedCustomerId = Number(expandedCustomerId) === Number(customerId) ? null : Number(customerId);
    renderCRM();
  }
  
  function rebookCustomer(customerId) {
    const customer = customers.find((item) => Number(item.id) === Number(customerId));
    if (!customer) return;
    openBookingModal(); // opens a fresh "New Booking" form
    const nameEl = document.getElementById('b-name');
    const phoneEl = document.getElementById('b-phone');
    const emailEl = document.getElementById('b-email');
    if (nameEl) nameEl.value = customer.name || '';
    if (phoneEl) phoneEl.value = customer.phone || '';
    if (emailEl) emailEl.value = customer.email || '';
    if (typeof calcBookingPrice === 'function') calcBookingPrice();
    showToast(`Rebooking ${customer.name || 'customer'} — pick craft, date & time`);
  }
  
  function renderCRM() {
    const searchedCustomers = customers.filter((customer) => {
      if (!crmSearchQuery) return true;
      return [customer.name, customer.phone, customer.email, customer.company, customer.source, customer.crmTags, customer.crmNotes, customer.emergencyName]
        .join(' ')
        .toLowerCase()
        .includes(crmSearchQuery);
    });
    const filteredCustomers = searchedCustomers.filter(crmFilterMatches);
    const orderedCustomers = sortCustomersForCRM(filteredCustomers);
    const totalCustomers = customers.length;
    const followUpCount = customers.filter(customerNeedsFollowUp).length;
    const waiverCount = customers.filter(customerHasWaiver).length;
    const bestCount = customers.filter(customerIsBest).length;
    const summaryEl = document.getElementById('crm-summary-line');
    const sortEl = document.getElementById('crm-sort');
    if (sortEl && sortEl.value !== crmSortMode) sortEl.value = crmSortMode;
    if (document.getElementById('crm-kpi-total')) document.getElementById('crm-kpi-total').textContent = totalCustomers.toLocaleString();
    if (document.getElementById('crm-kpi-total-meta')) document.getElementById('crm-kpi-total-meta').textContent = `${searchedCustomers.length} match the current search`;
    if (document.getElementById('crm-kpi-followup')) document.getElementById('crm-kpi-followup').textContent = followUpCount.toLocaleString();
    if (document.getElementById('crm-kpi-followup-meta')) document.getElementById('crm-kpi-followup-meta').textContent = followUpCount ? `${followUpCount} customers need outreach` : 'No overdue outreach right now';
    if (document.getElementById('crm-kpi-waiver')) document.getElementById('crm-kpi-waiver').textContent = waiverCount.toLocaleString();
    if (document.getElementById('crm-kpi-waiver-meta')) document.getElementById('crm-kpi-waiver-meta').textContent = `${Math.max(totalCustomers - waiverCount, 0)} still need waiver collection`;
    if (document.getElementById('crm-kpi-best')) document.getElementById('crm-kpi-best').textContent = bestCount.toLocaleString();
    if (document.getElementById('crm-kpi-best-meta')) document.getElementById('crm-kpi-best-meta').textContent = bestCount ? `${bestCount} customers worth rebooking first` : 'No VIP or repeat riders tagged yet';
    if (summaryEl) {
      const filterLabel = crmViewFilter === 'followup'
        ? 'customers who need follow-up'
        : crmViewFilter === 'waiver'
          ? 'customers who still need a waiver'
          : crmViewFilter === 'best'
            ? 'best customers to prioritize'
            : 'customers in the CRM';
      summaryEl.textContent = `${orderedCustomers.length} ${filterLabel}${crmSearchQuery ? ` for “${crmSearchQuery}”` : ''}. Sort is set to ${crmSortMode === 'recent' ? 'recent activity' : crmSortMode === 'spend' ? 'highest spend' : crmSortMode === 'bookings' ? 'most bookings' : 'name A-Z'}.`;
    }
    renderOpsMarkup(document.getElementById('crm-grid'), orderedCustomers.map((c,i) => {
      const isExpanded = Number(expandedCustomerId) === Number(c.id);
      const statusFlags = `
        ${customerNeedsFollowUp(c) ? '<span class="customer-flag followup">Follow-up due</span>' : '<span class="customer-flag ready">Recently active</span>'}
        ${customerHasWaiver(c) ? '<span class="customer-flag ready">Waiver on file</span>' : '<span class="customer-flag waiver">Waiver needed</span>'}
        ${customerIsBest(c) ? '<span class="customer-flag value">Best customer</span>' : ''}
      `;
      const detailPieces = [c.company, c.source, c.crmTags].filter(Boolean).map(escapeHtml).join(' · ');
      const contactLine = [c.phone, c.email].filter(Boolean).map(escapeHtml).join(' · ') || 'No contact info saved';
      const cleanPhone = String(c.phone || '').replace(/[^\d+]/g, '');
      const sinceLast = dateValue(c.lastBooking) ? `${daysSince(c.lastBooking)}d` : '—';
      return `
        <div class="customer-card">
          <button class="customer-summary" type="button" data-customer-action="toggle" data-customer-id="${Number(c.id)}" aria-expanded="${isExpanded ? 'true' : 'false'}">
            <div class="customer-main">
              <div class="customer-avatar" style="background:${AVATAR_COLORS[i%AVATAR_COLORS.length]}22;color:${AVATAR_COLORS[i%AVATAR_COLORS.length]};">${escapeHtml(initials(c.name))}</div>
              <div class="customer-identity">
                <div class="customer-name-row">
                  <div class="customer-name">${escapeHtml(c.name)}</div>
                  <span class="customer-open-hint">${isExpanded ? 'Hide details' : 'Open details'}</span>
                </div>
                <div class="customer-flags">${statusFlags}</div>
                <div class="customer-basic">${contactLine}</div>
              </div>
            </div>
          </button>
          ${isExpanded ? `
            <div class="customer-detail">
              <div class="customer-detail-block">
                <div class="customer-detail-label">Booking summary</div>
                <div class="customer-detail-value">${Number(c.bookings) || 0} booking${Number(c.bookings) === 1 ? '' : 's'} · ${moneyLabel(c.totalSpent || 0)} total spent · ${escapeHtml(customerLastTouchLabel(c))}</div>
              </div>
              <div class="customer-detail-block">
                <div class="customer-detail-label">Profile</div>
                <div class="customer-detail-value ${detailPieces ? '' : 'muted'}">${detailPieces || 'No extra profile details saved'}</div>
              </div>
              <div class="customer-detail-block">
                <div class="customer-detail-label">Last booking</div>
                <div class="customer-detail-value">${dateValue(c.lastBooking) ? `${formatShortDate(c.lastBooking)} · ${sinceLast} since last ride` : 'No booking history saved'}</div>
              </div>
              <div class="customer-detail-block">
                <div class="customer-detail-label">Waiver</div>
                <div class="customer-detail-value">${customerHasWaiver(c) ? `Signed ${formatShortDate(c.waiverSignedAt)}` : 'Waiver still needed'}</div>
              </div>
              <div class="customer-detail-block">
                <div class="customer-detail-label">Emergency contact</div>
                <div class="customer-detail-value ${c.emergencyName || c.emergencyPhone ? '' : 'muted'}">${[c.emergencyName, c.emergencyPhone].filter(Boolean).map(escapeHtml).join(' · ') || 'No emergency contact saved'}</div>
              </div>
              <div class="customer-detail-block" style="grid-column:1/-1;">
                <div class="customer-detail-label">Notes</div>
                <div class="customer-detail-value ${c.crmNotes ? '' : 'muted'}">${escapeHtml(c.crmNotes || 'No internal notes saved')}</div>
              </div>
              <div class="customer-detail-actions">
                ${cleanPhone ? `<a class="btn btn-success btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;" href="tel:${cleanPhone}">📞 Call</a>` : ''}
                ${cleanPhone ? `<a class="btn btn-ghost btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;" href="sms:${cleanPhone}">💬 Text</a>` : ''}
                <button class="btn btn-primary btn-sm" data-customer-action="rebook" data-customer-id="${Number(c.id)}">🔁 Rebook</button>
                <button class="btn btn-primary btn-sm" data-customer-action="payment" data-customer-id="${Number(c.id)}">Payment</button>
                <button class="btn btn-ghost btn-sm" data-customer-action="invoice" data-customer-id="${Number(c.id)}">Invoice</button>
                <button class="btn btn-primary btn-sm" data-customer-action="edit" data-customer-id="${Number(c.id)}">Edit</button>
                <button class="btn btn-danger btn-sm" data-customer-action="delete" data-customer-id="${Number(c.id)}">Delete</button>
              </div>
            </div>
          ` : ''}
        </div>`;
    }).join('') || '<div class="empty"><div class="icon">🔎</div><p>No customers match this search.</p></div>');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-customer-action]') : null;
    if (!target) return;
    const action = target.dataset.customerAction;
    const id = Number(target.dataset.customerId);
    if (!Number.isFinite(id)) return;
    if (action === 'toggle') {
      toggleCustomerDetail(id);
    } else if (action === 'rebook') {
      rebookCustomer(id);
    } else if (action === 'payment') {
      openInvoiceModalForCustomer(id, 'payment');
    } else if (action === 'invoice') {
      openInvoiceModalForCustomer(id, 'invoice');
    } else if (action === 'edit') {
      openCustomerModal(id);
    } else if (action === 'delete') {
      deleteCustomer(id);
    }
  });
  
  async function saveCustomer() {
    const name = document.getElementById('c-name').value.trim();
    if(!name) { showToast('⚠️ Enter a name'); return; }
    const customerId = editingCustomerId || Number(document.getElementById('c-id').value) || null;
    const previousCustomers = JSON.parse(JSON.stringify(customers));
    const payload = {
      name,
      phone: document.getElementById('c-phone').value.trim(),
      email: document.getElementById('c-email').value.trim(),
      company: document.getElementById('c-company').value.trim(),
      source: document.getElementById('c-source').value.trim(),
      tag: document.getElementById('c-tag').value,
      crmTags: document.getElementById('c-crm-tags').value.trim(),
      waiverSignedAt: document.getElementById('c-waiver-signed').value || '',
      emergencyName: document.getElementById('c-emergency-name').value.trim(),
      emergencyPhone: document.getElementById('c-emergency-phone').value.trim(),
      crmNotes: document.getElementById('c-notes').value.trim()
    };
    if (customerId) {
      const customer = customers.find((item) => Number(item.id) === Number(customerId));
      if (!customer) {
        showToast('⚠️ Customer record not found');
        return;
      }
      Object.assign(customer, payload);
    } else {
      customers.unshift({
        id: nextId(customers),
        ...payload,
        createdAt: new Date().toISOString(),
        importSource: 'manual',
        crmFields: {}
      });
    }
    if (!(await persistStateChange())) {
      customers = previousCustomers;
      return;
    }
    closeModal('customer-modal');
    showToast(customerId ? '✅ Customer updated' : '✅ Customer added');
    renderInvoices();
    renderCRM();
    renderWaivers();
    renderCommsPanel();
    renderReviewHub();
    renderReminders();
    resetCustomerForm();
  }
  async function deleteCustomer(customerId) {
    const customer = customers.find((item) => Number(item.id) === Number(customerId));
    if (!customer) {
      showToast('⚠️ Customer record not found');
      return;
    }
    const confirmed = window.confirm(`Delete ${customer.name} from the CRM? Existing bookings and invoices will stay in place.`);
    if (!confirmed) return;
    const previousBookings = bookings.map((booking) => ({ ...booking }));
    const previousInvoices = invoices.map((invoice) => ({ ...invoice }));
    const previousCommunications = communicationsLog.map((entry) => ({ ...entry }));
    const previousCustomers = customers.map((item) => ({ ...item }));
    const previousExpandedCustomerId = expandedCustomerId;
    const shouldCloseEditor = editingCustomerId && Number(editingCustomerId) === Number(customerId);
    bookings.forEach((booking) => {
      if (Number(booking.customerId || 0) === Number(customerId)) booking.customerId = null;
    });
    invoices.forEach((invoice) => {
      if (Number(invoice.customerId || 0) === Number(customerId)) invoice.customerId = null;
    });
    communicationsLog.forEach((entry) => {
      if (Number(entry.customerId || 0) === Number(customerId)) entry.customerId = null;
    });
    customers = customers.filter((item) => Number(item.id) !== Number(customerId));
    if (Number(expandedCustomerId) === Number(customerId)) expandedCustomerId = null;
    if (!(await persistStateChange())) {
      bookings = previousBookings;
      invoices = previousInvoices;
      communicationsLog = previousCommunications;
      customers = previousCustomers;
      expandedCustomerId = previousExpandedCustomerId;
      return;
    }
    if (shouldCloseEditor) {
      closeModal('customer-modal');
      resetCustomerForm();
    }
    renderInvoices();
    renderCRM();
    renderWaivers();
    renderCommsPanel();
    renderReviewHub();
    renderReminders();
    showToast('🗑️ Customer removed');
  }
  
  // A customer counts as "empty" only when there is genuinely nothing on file:
  // no real name (blank or a placeholder), no phone, no email, no bookings, no
  // spend, no waiver, and no booking/invoice linked to them. Deliberately strict
  // so we never delete anyone who carries real information.
  const CUSTOMER_PLACEHOLDER_NAMES = new Set(['', 'imported customer', 'imported booking', 'guest', 'unknown', 'walk-in', 'walk in', 'n/a', 'customer', 'new customer']);
  function customerIsEmpty(customer = {}) {
    const name = String(customer.name || '').trim().toLowerCase();
    if (!CUSTOMER_PLACEHOLDER_NAMES.has(name)) return false;
    if (String(customer.phone || '').trim()) return false;
    if (String(customer.email || '').trim()) return false;
    if ((Number(customer.bookings) || 0) > 0) return false;
    if ((Number(customer.totalSpent) || 0) > 0) return false;
    if (typeof customerHasWaiver === 'function' && customerHasWaiver(customer)) return false;
    if (bookings.some((booking) => Number(booking.customerId || 0) === Number(customer.id))) return false;
    if (invoices.some((invoice) => Number(invoice.customerId || 0) === Number(customer.id))) return false;
    return true;
  }
  async function cleanupEmptyCustomers() {
    const empties = customers.filter(customerIsEmpty);
    if (!empties.length) {
      showToast('✅ No empty customer records to remove — your count is already clean');
      return;
    }
    const plural = empties.length === 1 ? '' : 's';
    const confirmed = window.confirm(`Remove ${empties.length} blank customer record${plural}?\n\nThese have no name, phone, email, bookings, spend, or waiver. Everyone with any real info is kept.`);
    if (!confirmed) return;
    const removeIds = new Set(empties.map((customer) => Number(customer.id)));
    const previousCustomers = customers.map((customer) => ({ ...customer }));
    customers = customers.filter((customer) => !removeIds.has(Number(customer.id)));
    if (Number(expandedCustomerId) && removeIds.has(Number(expandedCustomerId))) expandedCustomerId = null;
    if (!(await persistStateChange())) {
      customers = previousCustomers;
      showToast('⚠️ Could not save — nothing was removed');
      return;
    }
    renderCRM();
    renderWaivers();
    renderReminders();
    showToast(`🧹 Removed ${empties.length} blank customer record${plural}`);
  }
  
  // ── EXPENSES ──
  function renderExpenses() {
    const monthExpenses = expensesInPeriod('month');
    const monthTotal = expensePeriodTotal('month');
    const recurringMonthly = recurringExpenseMonthlyTotal();
    const seasonalAnnual = seasonalExpenseYearlyTotal();
    const recurringAnnual = recurringExpenseYearlyTotal();
  
    document.getElementById('expense-kpi-month').textContent = `${Math.round(monthTotal).toLocaleString()}`;
    document.getElementById('expense-kpi-month-meta').textContent = `${monthExpenses.length} expense line${monthExpenses.length === 1 ? '' : 's'} hitting this month`;
    document.getElementById('expense-kpi-delivery').textContent = `${Math.round(recurringMonthly).toLocaleString()}`;
    document.getElementById('expense-kpi-delivery-meta').textContent = recurringMonthly ? 'Active recurring charges this month' : 'No recurring charges active this month';
    document.getElementById('expense-kpi-direct').textContent = `${Math.round(seasonalAnnual).toLocaleString()}`;
    document.getElementById('expense-kpi-direct-meta').textContent = seasonalAnnual ? 'Projected seasonal total across the active season' : 'No seasonal recurring expenses saved';
    document.getElementById('expense-kpi-ytd').textContent = `${Math.round(recurringAnnual).toLocaleString()}`;
    document.getElementById('expense-kpi-ytd-meta').textContent = recurringAnnual ? 'Projected recurring total for the full year' : 'No recurring expenses saved yet';
  
    const table = document.getElementById('expense-table');
    if (!table) return;
    const ordered = sortNewestFirst(expenses, (expense) => expense.date);
    renderOpsMarkup(table, ordered.length ? ordered.map((expense) => `
      <tr>
        <td>${escapeHtml(formatShortDate(expense.date))}</td>
        <td data-label="Category">${escapeHtml(expense.category)}</td>
        <td data-label="Schedule">${escapeHtml(expenseScheduleLabel(expense))}</td>
        <td data-label="Expense"><strong>${escapeHtml(expense.name)}</strong></td>
        <td data-label="Notes" style="color:var(--muted);">${escapeHtml(expense.notes || '—')}</td>
        <td data-label="Amount" style="color:var(--amber);font-weight:500;">${Number(expense.amount || 0).toLocaleString()}</td>
        <td data-label="">
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" data-expense-action="edit" data-expense-id="${Number(expense.id)}">Edit</button>
            <button class="btn btn-danger btn-sm" data-expense-action="delete" data-expense-id="${Number(expense.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="7"><div class="empty"><div class="icon">💸</div><p>No expenses logged yet.</p></div></td></tr>');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-expense-action]') : null;
    if (!target) return;
    const action = target.dataset.expenseAction;
    const id = Number(target.dataset.expenseId);
    if (!Number.isFinite(id)) return;
    if (action === 'edit') {
      openExpenseModal(id);
    } else if (action === 'delete') {
      deleteExpense(id);
    }
  });
  async function saveExpense() {
    const name = document.getElementById('e-name').value.trim();
    const amount = parseFloat(document.getElementById('e-amount').value || '0');
    if (!name || !amount) {
      showToast('⚠️ Add an expense name and amount');
      return;
    }
    const previousExpenses = JSON.parse(JSON.stringify(expenses));
    const payload = {
      date: document.getElementById('e-date').value || today(),
      category: document.getElementById('e-category').value,
      recurringType: normalizeExpenseRecurringType(document.getElementById('e-recurring-type').value),
      name,
      amount,
      seasonStartMonth: expenseMonthNumber(document.getElementById('e-season-start').value, 5),
      seasonEndMonth: expenseMonthNumber(document.getElementById('e-season-end').value, 9),
      notes: document.getElementById('e-notes').value.trim()
    };
    const isEditingExpense = Boolean(editingExpenseId);
    if (editingExpenseId) {
      const expense = expenses.find((item) => Number(item.id) === Number(editingExpenseId));
      if (!expense) {
        showToast('⚠️ Expense record not found');
        return;
      }
      Object.assign(expense, payload);
    } else {
      expenses.unshift({
        id: nextId(expenses),
        ...payload
      });
    }
    if (!(await persistStateChange())) {
      expenses = previousExpenses;
      return;
    }
    closeModal('expense-modal');
    resetExpenseForm();
    renderExpenses();
    renderDashboardMetrics();
    showToast(isEditingExpense ? '💸 Expense updated' : '💸 Expense saved');
  }
  
  async function deleteExpense(expenseId) {
    const expense = expenses.find((item) => Number(item.id) === Number(expenseId));
    if (!expense) {
      showToast('⚠️ Expense record not found');
      return;
    }
    const confirmed = window.confirm(`Delete expense "${expense.name}" for ${Number(expense.amount || 0).toLocaleString()}?`);
    if (!confirmed) return;
    const previousExpenses = JSON.parse(JSON.stringify(expenses));
    const shouldCloseEditor = editingExpenseId && Number(editingExpenseId) === Number(expenseId);
    expenses = expenses.filter((item) => Number(item.id) !== Number(expenseId));
    if (!(await persistStateChange())) {
      expenses = previousExpenses;
      return;
    }
    if (shouldCloseEditor) {
      closeModal('expense-modal');
      resetExpenseForm();
    }
    renderExpenses();
    renderDashboardMetrics();
    showToast('🗑️ Expense removed');
  }
  
  // ── COMMUNICATIONS ──
  function renderCommunications() {
    const table = document.getElementById('communications-table');
    if (!table) return;
    const ordered = sortNewestFirst(communicationsLog, (item) => item.date);
    renderOpsMarkup(table, ordered.length ? ordered.map((item) => `
      <tr>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.customerName || 'General')}</td>
        <td>${escapeHtml(item.channel || 'note')}</td>
        <td style="color:var(--muted);">${escapeHtml(shortText(item.message, 150))}</td>
      </tr>
    `).join('') : '<tr><td colspan="4"><div class="empty"><div class="icon">💬</div><p>No communications logged yet.</p></div></td></tr>');
  }
  function normalizeMassEmailSelection() {
    const validIds = new Set(
      customers
        .filter((customer) => normalizeEmail(customer.email))
        .map((customer) => Number(customer.id))
    );
    selectedMassEmailCustomerIds = new Set(
      Array.from(selectedMassEmailCustomerIds)
        .map((value) => Number(value))
        .filter((value) => validIds.has(value))
    );
  }
  function massEmailEligibleCustomers() {
    return customers.filter((customer) => normalizeEmail(customer.email));
  }
  function massEmailRecipientMatchesSearch(customer) {
    if (!massEmailSearchQuery) return true;
    return [
      customer.name,
      customer.phone,
      customer.email,
      customer.company,
      customer.source,
      customer.crmTags,
      customer.crmNotes,
      customer.tag
    ].join(' ').toLowerCase().includes(massEmailSearchQuery);
  }
  function massEmailVisibleCustomers() {
    return sortCustomersForCRM(massEmailEligibleCustomers().filter(massEmailRecipientMatchesSearch));
  }
  function selectedMassEmailCustomers() {
    normalizeMassEmailSelection();
    return massEmailEligibleCustomers().filter((customer) => selectedMassEmailCustomerIds.has(Number(customer.id)));
  }
  function setMassEmailAudienceMode(value) {
    massEmailAudienceMode = value === 'selected' ? 'selected' : 'all';
    renderMassEmailDraft();
  }
  function filterMassEmailRecipients(input) {
    massEmailSearchQuery = String(input?.value || '').trim().toLowerCase();
    renderMassEmailDraft();
  }
  function toggleMassEmailRecipient(customerId, checked) {
    const normalizedId = Number(customerId);
    if (checked) selectedMassEmailCustomerIds.add(normalizedId);
    else selectedMassEmailCustomerIds.delete(normalizedId);
    renderMassEmailDraft();
  }
  function applyMassEmailQuickSelect(mode = 'visible') {
    normalizeMassEmailSelection();
    if (mode === 'clear') {
      selectedMassEmailCustomerIds.clear();
      renderMassEmailDraft();
      return;
    }
    let targets = [];
    if (mode === 'vip') {
      targets = massEmailEligibleCustomers().filter((customer) => ['repeat', 'vip'].includes(String(customer.tag || '').toLowerCase()));
    } else if (mode === 'followup') {
      targets = massEmailEligibleCustomers().filter(customerNeedsFollowUp);
    } else {
      targets = massEmailVisibleCustomers();
    }
    targets.forEach((customer) => selectedMassEmailCustomerIds.add(Number(customer.id)));
    renderMassEmailDraft();
  }
  function renderMassEmailDraft() {
    normalizeMassEmailSelection();
    const audienceInput = document.getElementById('mass-email-audience');
    const searchInput = document.getElementById('mass-email-search');
    if (audienceInput && audienceInput.value !== massEmailAudienceMode) audienceInput.value = massEmailAudienceMode;
    if (searchInput && searchInput.value !== massEmailSearchQuery) searchInput.value = massEmailSearchQuery;
    const eligibleCustomers = massEmailEligibleCustomers();
    const visibleCustomers = massEmailVisibleCustomers();
    const selectedCustomers = selectedMassEmailCustomers();
    const audienceCustomers = massEmailAudienceMode === 'selected' ? selectedCustomers : eligibleCustomers;
    const emails = uniqueValues(audienceCustomers.map((customer) => normalizeEmail(customer.email)));
    const batchCount = Math.ceil(emails.length / 50);
    document.getElementById('mass-email-count').textContent = emails.length.toLocaleString();
    document.getElementById('mass-batch-count').textContent = batchCount.toLocaleString();
    document.getElementById('mass-audience-count').textContent = audienceCustomers.length.toLocaleString();
    const note = document.getElementById('mass-provider-note');
    const detail = document.getElementById('mass-provider-detail');
    const button = document.getElementById('mass-email-link');
    const summary = document.getElementById('mass-email-selection-summary');
    const list = document.getElementById('mass-email-recipient-list');
    const panel = document.getElementById('mass-email-recipient-panel');
    if (panel) panel.hidden = massEmailAudienceMode !== 'selected';
    if (note) note.textContent = integrations.emailConfigured
      ? 'Draft one campaign and Shoreline Ops will send it through Resend in batches of up to 50 recipients.'
      : 'Draft one campaign now. Add Resend credentials to send it directly from Shoreline Ops.';
    if (detail) detail.textContent = integrations.emailConfigured
      ? (massEmailAudienceMode === 'selected'
        ? `Resend is configured. This campaign will go to ${emails.length} recipients in ${batchCount} ${batchCount === 1 ? 'batch' : 'batches'} from your selected customers.`
        : `Resend is configured. This campaign will go to ${emails.length} recipients in ${batchCount} ${batchCount === 1 ? 'batch' : 'batches'} from the CRM email list.`)
      : 'Resend is not configured yet, so the email provider send button will stay disabled.';
    if (button) button.disabled = !integrations.emailConfigured || !emails.length || (massEmailAudienceMode === 'selected' && !selectedCustomers.length);
    if (summary) {
      summary.textContent = massEmailAudienceMode === 'selected'
        ? `${selectedCustomers.length} selected · ${emails.length} email recipients ready · sends in batches of 50`
        : `${eligibleCustomers.length} customers with email on file`;
    }
    if (list) {
      renderOpsMarkup(list, visibleCustomers.length ? visibleCustomers.map((customer) => {
        const selected = selectedMassEmailCustomerIds.has(Number(customer.id));
        const tags = [
          customerNeedsFollowUp(customer) ? 'Follow-up due' : '',
          customerHasWaiver(customer) ? 'Waiver on file' : '',
          customerIsBest(customer) ? 'Best customer' : ''
        ].filter(Boolean).join(' · ');
        return `
          <label class="list-row" style="align-items:flex-start;gap:0.75rem;cursor:pointer;">
            <input type="checkbox" ${selected ? 'checked' : ''} onchange="toggleMassEmailRecipient(${Number(customer.id)}, this.checked)" style="margin-top:0.2rem;">
            <div class="list-row-main">
              <strong>${escapeHtml(customer.name || 'Customer')}</strong>
              <div class="sub">${escapeHtml(customer.email || '')}${customer.phone ? ` · ${escapeHtml(customer.phone)}` : ''}</div>
              <div class="sub">${escapeHtml(tags || customerLastTouchLabel(customer))}</div>
            </div>
          </label>
        `;
      }).join('') : '<div class="empty"><div class="icon">📬</div><p>No customers with email match this search.</p></div>');
    }
  }
  function renderCommsPanel() {
    const select = document.getElementById('comm-customer');
    const customerCard = document.getElementById('comm-customer-card');
    if (!select || !customerCard) return;
  
    const ordered = [...customers].sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
    const existingValue = select.value;
    renderOpsMarkup(select, ordered.map((customer) => `<option value="${customer.id}">${escapeHtml(customer.name)}</option>`).join(''));
    if (existingValue && ordered.some((customer) => String(customer.id) === existingValue)) {
      select.value = existingValue;
    }
    const current = ordered.find((customer) => String(customer.id) === String(select.value)) || ordered[0];
    if (!current) {
      renderOpsMarkup(select, '');
      renderOpsMarkup(customerCard, '<p class="note-soft">Import or add a customer to start drafting follow-ups.</p>');
      renderMassEmailDraft();
      renderCommunications();
      return;
    }
    select.value = String(current.id);
    renderOpsMarkup(customerCard, `
      <h3>${escapeHtml(current.name)}</h3>
      <p>${current.phone ? escapeHtml(current.phone) : 'No phone on file'}${current.email ? ` · ${escapeHtml(current.email)}` : ''}</p>
      <div class="mini-kpis">
        <div class="mini-kpi"><strong>${current.bookings}</strong><span>bookings</span></div>
        <div class="mini-kpi money-hide"><strong>${moneyLabel(current.totalSpent)}</strong><span>lifetime</span></div>
        <div class="mini-kpi"><strong>${current.lastBooking === 'N/A' ? '—' : current.lastBooking}</strong><span>last booking</span></div>
      </div>
    `);
    const textLink = document.getElementById('comm-text-link');
    const emailLink = document.getElementById('comm-email-link');
    const providerNote = document.getElementById('comm-provider-note');
    if (providerNote) {
      providerNote.textContent = integrations.smsConfigured || integrations.emailConfigured
        ? 'Pick a customer, draft the message once, then send it through the connected provider.'
        : 'Provider keys are not configured yet, so this section is still in draft-only mode.';
    }
    if (textLink) {
      textLink.disabled = !(integrations.smsConfigured && current.phone);
      textLink.style.opacity = textLink.disabled ? '0.45' : '1';
    }
    if (emailLink) {
      emailLink.disabled = !(integrations.emailConfigured && current.email);
      emailLink.style.opacity = emailLink.disabled ? '0.45' : '1';
    }
    renderMassEmailDraft();
    renderCommunications();
  }
  async function sendDirectMessage(channel) {
    const select = document.getElementById('comm-customer');
    const message = document.getElementById('comm-message')?.value.trim();
    const customer = customers.find((item) => String(item.id) === String(select?.value));
    if (!customer || !message) {
      showToast('⚠️ Choose a customer and add your message first');
      return;
    }
    try {
      const sentAt = new Date().toISOString();
      if (channel === 'sms') {
        if (!integrations.smsConfigured || !customer.phone) throw new Error('SMS is not configured or this customer has no phone number.');
        await requestJson('/api/ops/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'sms', to: customer.phone, body: message })
        });
      } else {
        if (!integrations.emailConfigured || !customer.email) throw new Error('Email is not configured or this customer has no email address.');
        await requestJson('/api/ops/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'email',
            to: customer.email,
            subject: 'Shoreline Aquatics follow-up',
            body: message
          })
        });
      }
      touchCustomerActivity({ customerId: customer.id, name: customer.name, phone: customer.phone, email: customer.email }, sentAt);
      communicationsLog.unshift({
        id: nextId(communicationsLog),
        date: sentAt,
        customerId: customer.id,
        customerName: customer.name,
        channel,
        message
      });
      const logged = await persistStateChange();
      renderCommunications();
      renderCRM();
      renderReminders();
      renderCommsPanel();
      showToast(logged ? (channel === 'sms' ? '📲 Text sent' : '✉️ Email sent') : '⚠️ Message sent, but the CRM log could not be saved');
    } catch (error) {
      showToast(`⚠️ ${error.message}`);
    }
  }
  async function sendMassEmail() {
    const audienceCustomers = massEmailAudienceMode === 'selected' ? selectedMassEmailCustomers() : massEmailEligibleCustomers();
    const bcc = uniqueValues(audienceCustomers.map((customer) => normalizeEmail(customer.email)));
    const subject = document.getElementById('mass-email-subject')?.value.trim() || '';
    const body = document.getElementById('mass-email-body')?.value.trim() || '';
    if (!integrations.emailConfigured) {
      showToast('⚠️ Resend is not configured yet');
      return;
    }
    if (massEmailAudienceMode === 'selected' && !audienceCustomers.length) {
      showToast('⚠️ Select at least one customer before sending');
      return;
    }
    if (!bcc.length || !subject || !body) {
      showToast('⚠️ Add a subject, body, and make sure customers have emails on file');
      return;
    }
    try {
      const sentAt = new Date().toISOString();
      const response = await requestJson('/api/ops/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'mass-email',
          bcc,
          subject,
          body
        })
      });
      const batchCount = Number(response?.result?.batches) || Math.max(1, Math.ceil(bcc.length / 50));
      const recipientEmails = new Set(bcc);
      audienceCustomers.forEach((customer) => {
        const email = normalizeEmail(customer.email);
        if (!email || !recipientEmails.has(email)) return;
        customer.lastActivity = sentAt;
      });
      communicationsLog.unshift({
        id: nextId(communicationsLog),
        date: sentAt,
        customerName: 'Mass campaign',
        channel: 'mass-email',
        message: `${subject} — ${body}`
      });
      const logged = await persistStateChange();
      renderCommunications();
      renderCRM();
      renderReminders();
      renderCommsPanel();
      showToast(logged ? `✉️ Mass email sent to ${bcc.length} recipients in ${batchCount} ${batchCount === 1 ? 'batch' : 'batches'}` : `⚠️ Mass email sent in ${batchCount} ${batchCount === 1 ? 'batch' : 'batches'}, but the CRM log could not be saved`);
    } catch (error) {
      showToast(`⚠️ ${error.message}`);
    }
  }
  async function logCommunication() {
    const select = document.getElementById('comm-customer');
    const message = document.getElementById('comm-message')?.value.trim();
    const customer = customers.find((item) => String(item.id) === String(select?.value));
    if (!customer || !message) {
      showToast('⚠️ Choose a customer and add your message first');
      return;
    }
    const loggedAt = new Date().toISOString();
    touchCustomerActivity({ customerId: customer.id, name: customer.name, phone: customer.phone, email: customer.email }, loggedAt);
    communicationsLog.unshift({
      id: nextId(communicationsLog),
      date: loggedAt,
      customerId: customer.id,
      customerName: customer.name,
      channel: customer.email && customer.phone ? 'text/email draft' : customer.phone ? 'text draft' : 'email draft',
      message
    });
    if (!(await persistStateChange())) return;
    renderCommunications();
    renderCRM();
    renderReminders();
    renderCommsPanel();
    showToast('💬 Communication note saved');
  }
  
  // ── REVIEWS ──
  function ensureReviewRequestForBooking(booking) {
    return ensureReviewRequestForBookingInList(booking, reviewRequests);
  }
  function reviewRequestBooking(request = {}) {
    return bookings.find((booking) => Number(booking.id || 0) === Number(request.bookingId || 0)) || null;
  }
  function resolveReviewRequestContact(request = {}) {
    const booking = reviewRequestBooking(request);
    const customer = findCustomerForContact({
      bookingId: request.bookingId,
      name: request.customerName,
      phone: request.phone,
      email: request.email
    }) || (booking ? findCustomerForBooking(booking) : null);
    return {
      booking,
      customer,
      customerName: String(customer?.name || booking?.name || request.customerName || '').trim(),
      phone: String(customer?.phone || booking?.phone || request.phone || '').trim(),
      email: String(customer?.email || booking?.email || request.email || '').trim()
    };
  }
  function reviewRequestStillValid(request = {}) {
    if (String(request.status || '').toLowerCase() === 'reviewed') return true;
    const booking = reviewRequestBooking(request);
    return Boolean(booking && normalizeBookingStatusValue(booking.status) === 'completed');
  }
  function normalizeReviewRequestList(baseRequests = reviewRequests) {
    const source = Array.isArray(baseRequests) ? baseRequests : [];
    const requestList = cloneReviewRequests(source).filter(reviewRequestStillValid);
    return {
      requestList,
      changed: requestList.length !== source.length
    };
  }
  function ensureReviewRequestForBookingInList(booking, requestList) {
    if (!booking || normalizeBookingStatusValue(booking.status) !== 'completed') return { request: null, created: false };
    const existing = requestList.find((request) => request.bookingId === booking.id);
    if (existing) return { request: existing, created: false };
    if (reviews.some((review) => review.bookingId === booking.id)) return { request: null, created: false };
    const request = {
      id: nextId(requestList),
      bookingId: booking.id,
      customerName: booking.name,
      phone: booking.phone,
      email: booking.email,
      sentAt: '',
      status: 'pending'
    };
    requestList.unshift(request);
    return { request, created: true };
  }
  function prepareReviewRequestsForCompletedBookings(baseRequests = reviewRequests) {
    const normalized = normalizeReviewRequestList(baseRequests);
    const requestList = normalized.requestList;
    let changed = normalized.changed;
    bookings.filter((booking) => normalizeBookingStatusValue(booking.status) === 'completed').forEach((booking) => {
      const result = ensureReviewRequestForBookingInList(booking, requestList);
      if (result.created) changed = true;
    });
    return { requestList, changed };
  }
  function reviewMessage(name) {
    return `Hey ${firstName(name)}! Thanks again for riding with Shoreline Aquatics. If you had a great time, we'd really appreciate a quick review about your experience on the lake.`;
  }
  async function saveReviewSettings() {
    const googleUrl = document.getElementById('review-google-url')?.value.trim() || '';
    const facebookUrl = document.getElementById('review-facebook-url')?.value.trim() || '';
    const hasLink = Boolean(googleUrl || facebookUrl);
    const autoSendField = document.getElementById('review-auto-send')?.value;
    // Pick a channel that's actually configured so it sends instead of silently
    // failing — fall back to email when SMS (Twilio) isn't set up.
    let channel = (document.getElementById('review-default-channel')?.value || 'email') === 'sms' ? 'sms' : 'email';
    // Can't use SMS without Twilio — fall back to email so it actually sends.
    if (channel === 'sms' && !integrations.smsConfigured) channel = 'email';
    const nextSettings = {
      googleUrl,
      facebookUrl,
      // Setting a review link is the whole point of this page, so auto-send is on
      // by default once a link exists — unless the owner explicitly picks Off.
      autoSend: hasLink && autoSendField !== 'off',
      channel
    };
    const previousReviewSettings = {...reviewSettings};
    reviewSettings = nextSettings;
    const saved = await saveStateSnapshot({
      ...snapshotState(),
      reviewSettings: nextSettings
    });
    if (!saved) {
      reviewSettings = previousReviewSettings;
      renderReviewHub({ skipQueueSync: true });
      return;
    }
    await loadIntegrationStatus();
    renderReviewHub({ skipQueueSync: true });
    renderSystemPage();
    showToast('✅ Review automation updated');
  }
  let reviewQueueSyncPending = false;
  function syncReviewQueueForCompletedBookings() {
    if (!backendAvailable || reviewQueueSyncPending) return;
    const { requestList, changed } = prepareReviewRequestsForCompletedBookings();
    if (!changed) return;
    reviewQueueSyncPending = true;
    saveStateSnapshot({
      ...snapshotState(),
      reviewRequests: requestList
    }, {silent:true}).then((saved) => {
      if (!saved) return;
      reviewRequests = requestList;
      renderReviewHub({ skipQueueSync: true });
    }).catch((error) => {
      console.error('Review queue sync failed:', error);
    }).finally(() => {
      reviewQueueSyncPending = false;
    });
  }
  // "⭐ Review" button on an invoice row — text/email the customer a review request.
  // Routes to the invoice's linked booking (or that customer's most recent booking)
  // so it reuses the same review-send flow, gating, and channel selection.
  function requestReviewForInvoice(invoiceId) {
    const invoice = invoices.find((item) => Number(item.id) === Number(invoiceId));
    if (!invoice) { showToast('⚠️ Invoice not found'); return; }
    const booking = linkedBookingForInvoiceRecord(invoice);
    if (booking && Number(booking.id)) { askForReview(Number(booking.id)); return; }
    const custId = Number(invoice.customerId || 0);
    const fallback = custId
      ? bookings
          .filter((b) => Number(b.customerId) === custId)
          .sort((a, b) => bookingScheduleSortKey(b).localeCompare(bookingScheduleSortKey(a)))[0]
      : null;
    if (fallback && Number(fallback.id)) { askForReview(Number(fallback.id)); return; }
    showToast('⚠️ No booking linked to this invoice to text a review to');
  }
  
  // Parse the "Send review link to people" textarea into [{name, phone}].
  // Each line is either "Name, phone" (split on the LAST comma so names with
  // commas still work) or just a phone number.
  function parseReviewBlastLines(raw) {
    const out = [];
    String(raw || '').split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let name = '';
      let phone = trimmed;
      const comma = trimmed.lastIndexOf(',');
      if (comma >= 0) {
        name = trimmed.slice(0, comma).trim();
        phone = trimmed.slice(comma + 1).trim();
      }
      const digits = phone.replace(/[^\d]/g, '');
      out.push({ name, phone, valid: digits.length >= 10 });
    });
    return out;
  }
  
  // Blast the review link to a hand-typed list of phone numbers (no invoice needed).
  async function sendReviewBlast() {
    const raw = document.getElementById('review-blast-list')?.value || '';
    const statusEl = document.getElementById('review-blast-status');
    const resultsEl = document.getElementById('review-blast-results');
    const btn = document.getElementById('review-blast-btn');
    if (resultsEl) renderOpsMarkup(resultsEl, '');
    const parsed = parseReviewBlastLines(raw);
    const valid = parsed.filter((r) => r.valid);
    const invalid = parsed.filter((r) => !r.valid);
    if (!parsed.length) { showToast('⚠️ Paste at least one phone number'); return; }
    if (!integrations.reviewLinksConfigured) {
      showToast('⚠️ Add your Google review link in Reviews settings first');
      return;
    }
    if (!integrations.smsConfigured) {
      showToast('⚠️ Texts can’t send yet — add your Twilio keys in Cloudflare first');
      if (statusEl) statusEl.textContent = 'SMS is not connected yet (System page shows the status).';
      return;
    }
    if (!valid.length) { showToast('⚠️ No valid phone numbers found (need 10+ digits)'); return; }
    if (!confirm(`Text the review link to ${valid.length} ${valid.length === 1 ? 'person' : 'people'}?`)) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    if (statusEl) statusEl.textContent = 'Sending…';
    try {
      const data = await requestJson('/api/ops/reviews/send-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: valid.map((r) => ({ name: r.name, phone: r.phone })) })
      });
      const results = Array.isArray(data.results) ? data.results : [];
      if (statusEl) statusEl.textContent = `Sent ${data.sent || 0} of ${data.total || results.length}${data.failed ? ` · ${data.failed} failed` : ''}.`;
      if (resultsEl) {
        const rows = results.map((r) => `<div class="list-row"><span>${escapeHtml(r.name || r.phone)}</span><span style="color:${r.ok ? 'var(--green)' : 'var(--red)'};">${r.ok ? '✓ Sent' : '⚠️ ' + escapeHtml(r.error || 'Failed')}</span></div>`);
        if (invalid.length) rows.push(`<div class="list-row"><span style="color:var(--muted);">${invalid.length} skipped (not a valid number)</span><span></span></div>`);
        renderOpsMarkup(resultsEl, rows.join(''));
      }
      if (data.sent) showToast(`⭐ Review link sent to ${data.sent}`);
    } catch (error) {
      if (statusEl) statusEl.textContent = '';
      showToast(`⚠️ ${error.message || 'Could not send'}`);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Send review link'; }
    }
  }
  
  // Manually send a review request for one hand-picked booking (the "⭐ Review"
  // button). Unlike autoSendReviewForBooking, this ignores the auto-send toggle —
  // the owner is choosing to send — but still needs a review link + a usable channel.
  async function askForReview(bookingId) {
    const booking = bookings.find((item) => Number(item.id) === Number(bookingId));
    if (!booking) return;
    if (!integrations.reviewLinksConfigured) {
      showToast('⚠️ Add your Google review link in Reviews settings first');
      showPage('reviews');
      return;
    }
    let request = reviewRequests.find((item) => Number(item.bookingId) === Number(booking.id));
    if (!request) {
      const requestList = cloneReviewRequests(reviewRequests);
      const prepared = ensureReviewRequestForBookingInList(booking, requestList);
      request = prepared.request;
      if (prepared.created) {
        const saved = await saveStateSnapshot({ ...snapshotState(), reviewRequests: requestList }, { silent: true });
        if (!saved) { showToast('⚠️ Could not save — try again'); return; }
        reviewRequests = requestList;
      }
    }
    if (!request) { showToast('⚠️ Could not prepare the review request'); return; }
    if (String(request.status || '').toLowerCase() === 'reviewed') {
      showToast('✓ This customer already left a review');
      return;
    }
    const contact = resolveReviewRequestContact(request);
    const canText = Boolean(integrations.smsConfigured && contact.phone);
    const canEmail = Boolean(integrations.emailConfigured && contact.email);
    const channel = canText ? 'text' : (canEmail ? 'email' : '');
    if (!channel) { showToast('⚠️ No phone or email on file for this customer'); return; }
    await sendReviewDrop(request.id, channel);
  }
  async function autoSendReviewForBooking(booking) {
    if (!backendAvailable || !integrations.reviewAutomationEnabled || !integrations.reviewLinksConfigured) return false;
    let request = reviewRequests.find((item) => item.bookingId === booking.id);
    let created = false;
    if (!request) {
      const requestList = cloneReviewRequests(reviewRequests);
      const prepared = ensureReviewRequestForBookingInList(booking, requestList);
      request = prepared.request;
      created = prepared.created;
      if (created) {
        const saved = await saveStateSnapshot({
          ...snapshotState(),
          reviewRequests: requestList
        }, {silent:true});
        if (!saved) return false;
        reviewRequests = requestList;
      }
    }
    if (created) {
      renderReviewHub({ skipQueueSync: true });
    }
    if (!request || String(request.status || '').toLowerCase() === 'reviewed' || request.sentAt) return false;
    const resolvedContact = resolveReviewRequestContact(request);
    const canText = Boolean(integrations.smsConfigured && resolvedContact.phone);
    const canEmail = Boolean(integrations.emailConfigured && resolvedContact.email);
    const preferred = integrations.reviewChannel === 'email' ? 'email' : 'text';
    const channel = preferred === 'email'
      ? (canEmail ? 'email' : canText ? 'text' : '')
      : (canText ? 'text' : canEmail ? 'email' : '');
    if (!channel) return false;
    try {
      await sendReviewDrop(request.id, channel, { silent: true, preserveReviewHub: true });
      return true;
    } catch (error) {
      console.error('Automatic review request failed:', error);
      return false;
    }
  }
  async function sendReviewDrop(requestId, channel, options = {}) {
    const request = reviewRequests.find((item) => item.id === requestId);
    if (!request) return false;
    const apiChannel = channel === 'text' ? 'sms' : 'email';
    const previousReviewRequests = JSON.parse(JSON.stringify(reviewRequests));
    const previousCustomers = JSON.parse(JSON.stringify(customers));
    const resolvedContact = resolveReviewRequestContact(request);
    try {
      await requestJson('/api/ops/reviews/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: apiChannel,
          customerName: resolvedContact.customerName,
          phone: resolvedContact.phone,
          email: resolvedContact.email
        })
      });
      request.customerName = resolvedContact.customerName || request.customerName;
      request.phone = resolvedContact.phone || request.phone;
      request.email = resolvedContact.email || request.email;
      request.sentAt = new Date().toISOString();
      request.channel = apiChannel;
      request.status = 'sent';
      touchCustomerActivity({
        bookingId: request.bookingId,
        name: resolvedContact.customerName,
        phone: resolvedContact.phone,
        email: resolvedContact.email
      }, request.sentAt);
      const saved = await persistStateChange({silent:true});
      if (!saved) {
        reviewRequests = previousReviewRequests;
        customers = previousCustomers;
        throw new Error('Review request was sent, but the CRM could not save the send status. Refresh and verify the queue.');
      }
      renderCRM();
      renderReminders();
      renderCommsPanel();
      if (!options.preserveReviewHub) renderReviewHub();
      if (!options.silent) showToast(apiChannel === 'sms' ? '⭐ Review text sent' : '⭐ Review email sent');
      return true;
    } catch (error) {
      if (!options.silent) showToast(`⚠️ ${error.message}`);
      throw error;
    }
  }
  async function markReviewCompleted(requestId) {
    const request = reviewRequests.find((item) => item.id === requestId);
    if (!request) return;
    const resolvedContact = resolveReviewRequestContact(request);
    const rating = window.prompt('Star rating (1-5)', '5');
    const reviewText = window.prompt('Paste the review text or a short summary', '');
    const previousReviews = JSON.parse(JSON.stringify(reviews));
    const previousReviewRequests = JSON.parse(JSON.stringify(reviewRequests));
    const previousCustomers = JSON.parse(JSON.stringify(customers));
    const reviewDate = new Date().toISOString();
    reviews.unshift({
      id: nextId(reviews),
      bookingId: request.bookingId,
      customerName: resolvedContact.customerName || request.customerName,
      rating: Number(rating) || 5,
      text: reviewText || 'Review logged manually',
      date: reviewDate,
      responded: false
    });
    request.status = 'reviewed';
    touchCustomerActivity({
      bookingId: request.bookingId,
      name: resolvedContact.customerName,
      phone: resolvedContact.phone,
      email: resolvedContact.email
    }, reviewDate);
    if (!(await persistStateChange())) {
      reviews = previousReviews;
      reviewRequests = previousReviewRequests;
      customers = previousCustomers;
      return;
    }
    renderCRM();
    renderReminders();
    renderCommsPanel();
    renderReviewHub();
    showToast('⭐ Review logged');
  }
  async function toggleReviewResponded(reviewId) {
    const review = reviews.find((item) => item.id === reviewId);
    if (!review) return;
    const previousResponded = Boolean(review.responded);
    review.responded = !review.responded;
    if (!(await persistStateChange())) {
      review.responded = previousResponded;
      return;
    }
    renderReviewHub();
  }
  function renderReviewHub(options = {}) {
    if (!options.skipQueueSync) {
      syncReviewQueueForCompletedBookings();
    }
    const googleInput = document.getElementById('review-google-url');
    const facebookInput = document.getElementById('review-facebook-url');
    const channelInput = document.getElementById('review-default-channel');
    const autoSendInput = document.getElementById('review-auto-send');
    const settingsNote = document.getElementById('review-settings-note');
    if (googleInput) googleInput.value = reviewSettings.googleUrl || '';
    if (facebookInput) facebookInput.value = reviewSettings.facebookUrl || '';
    if (channelInput) channelInput.value = (reviewSettings.channel === 'sms' && integrations.smsConfigured) ? 'sms' : 'email';
    // Only force the toggle when a link already exists (reflecting a saved choice);
    // for a fresh setup leave it at the 'On' default so pasting a link + Save is enough.
    if (autoSendInput && (reviewSettings.googleUrl || reviewSettings.facebookUrl)) {
      autoSendInput.value = reviewSettings.autoSend ? 'on' : 'off';
    }
    if (settingsNote) {
      settingsNote.textContent = integrations.reviewLinksConfigured
        ? `Review links are configured. Auto-send is ${integrations.reviewAutomationEnabled ? 'on' : 'off'} and the default channel is ${integrations.reviewChannel}.`
        : 'Add at least one Google or Facebook review link, then choose whether completed rentals should auto-send.';
    }
    const pending = reviewRequests.filter((request) => reviewRequestStillValid(request) && String(request.status || '').toLowerCase() !== 'reviewed');
    const completedRentals = bookings.filter((booking) => normalizeBookingStatusValue(booking.status) === 'completed').length;
    const reviewRate = completedRentals ? Math.round((reviews.length / completedRentals) * 100) : 0;
    document.getElementById('reviews-kpi-pending').textContent = pending.length.toLocaleString();
    document.getElementById('reviews-kpi-complete').textContent = reviews.length.toLocaleString();
    document.getElementById('reviews-kpi-response').textContent = reviews.filter((review) => !review.responded).length.toLocaleString();
    document.getElementById('reviews-kpi-rate').textContent = `${reviewRate}%`;
  
    const requestList = document.getElementById('review-request-list');
    const logList = document.getElementById('review-log-list');
    const providerNote = document.getElementById('review-provider-note');
    if (providerNote) {
      providerNote.textContent = integrations.reviewLinksConfigured
        ? `Completed rentals queue up here. Auto-send is ${integrations.reviewAutomationEnabled ? 'enabled' : 'disabled'} and the default channel is ${integrations.reviewChannel}.`
        : 'Add Google and/or Facebook review links above before sending automated review requests.';
    }
    if (requestList) {
      renderOpsMarkup(requestList, pending.length ? sortNewestFirst(pending, (item) => item.sentAt || '').map((request) => {
        const resolvedContact = resolveReviewRequestContact(request);
        const canText = integrations.reviewLinksConfigured && integrations.smsConfigured && resolvedContact.phone;
        const canEmail = integrations.reviewLinksConfigured && integrations.emailConfigured && resolvedContact.email;
        return `
        <div class="list-row">
          <div class="list-row-main">
            <strong>${escapeHtml(resolvedContact.customerName || request.customerName || 'Customer')}</strong>
            <div class="sub">${escapeHtml(request.sentAt ? `Last sent ${request.sentAt.slice(0, 10)}` : 'Ready to send now')}</div>
          </div>
          <div class="list-row-actions">
            <button class="btn btn-primary btn-sm" ${canText ? '' : 'disabled style="opacity:0.45"'} data-review-action="send-text" data-review-request-id="${Number(request.id)}">Text request</button>
            <button class="btn btn-ghost btn-sm" ${canEmail ? '' : 'disabled style="opacity:0.45"'} data-review-action="send-email" data-review-request-id="${Number(request.id)}">Email request</button>
            <button class="btn btn-ghost btn-sm" data-review-action="complete" data-review-request-id="${Number(request.id)}">Log review</button>
          </div>
        </div>
      `;
      }).join('') : '<div class="empty"><div class="icon">🎉</div><p>No pending review drops right now.</p></div>');
    }
    if (logList) {
      renderOpsMarkup(logList, reviews.length ? sortNewestFirst(reviews, (item) => item.date).map((review) => `
        <div class="list-row">
          <div class="list-row-main">
            <strong>${escapeHtml(review.customerName)} · ${'★'.repeat(Math.max(1, Math.min(5, Number(review.rating) || 5)))}</strong>
            <div class="sub">${escapeHtml(shortText(review.text, 180))}</div>
            <div class="sub">${escapeHtml(String(review.date || '').slice(0, 10) || 'No date')}</div>
          </div>
          <div class="list-row-actions">
            <span class="badge ${review.responded ? 'badge-confirmed' : 'badge-pending'}">${review.responded ? 'Responded' : 'Needs response'}</span>
            <button class="btn btn-ghost btn-sm" data-review-action="toggle-responded" data-review-id="${Number(review.id)}">${review.responded ? 'Mark unanswered' : 'Mark responded'}</button>
          </div>
        </div>
      `).join('') : '<div class="empty"><div class="icon">⭐</div><p>No reviews logged yet.</p></div>');
    }
  }
  
  // ── SOCIAL ──
  async function saveSocialDraft() {
    const caption = document.getElementById('social-caption')?.value.trim();
    const link = document.getElementById('social-link')?.value.trim();
    if (!caption) {
      showToast('⚠️ Add a caption first');
      return;
    }
    const previousSocialPosts = JSON.parse(JSON.stringify(socialPosts));
    socialPosts.unshift({
      id: nextId(socialPosts),
      caption,
      link,
      createdAt: new Date().toISOString()
    });
    if (!(await persistStateChange())) {
      socialPosts = previousSocialPosts;
      return;
    }
    renderSocialQueue();
    showToast('📣 Social draft saved');
  }
  async function publishSocialNow() {
    const caption = document.getElementById('social-caption')?.value.trim();
    const link = document.getElementById('social-link')?.value.trim();
    if (!integrations.socialConfigured) {
      showToast('⚠️ Social automation webhook is not configured yet');
      return;
    }
    if (!caption) {
      showToast('⚠️ Add a caption first');
      return;
    }
    try {
      await requestJson('/api/ops/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          link,
          platforms: Array.isArray(integrations.socialPlatforms) ? integrations.socialPlatforms : []
        })
      });
      showToast('📣 Social post dispatched');
    } catch (error) {
      showToast(`⚠️ ${error.message}`);
    }
  }
  function copySocialCaption() {
    const caption = document.getElementById('social-caption')?.value.trim() || '';
    const link = document.getElementById('social-link')?.value.trim() || '';
    const payload = link ? `${caption}\n\n${link}` : caption;
    navigator.clipboard?.writeText(payload);
    showToast('📋 Caption copied');
  }
  function copyCampaignTemplate(message) {
    const text = String(message || '').trim();
    if (!text) return;
    navigator.clipboard?.writeText(text);
    showToast('📋 Campaign template copied');
  }
  function copySavedSocial(postId) {
    const post = socialPosts.find((item) => item.id === postId);
    if (!post) return;
    const payload = post.link ? `${post.caption}\n\n${post.link}` : post.caption;
    navigator.clipboard?.writeText(payload);
    showToast('📋 Saved draft copied');
  }
  function renderSocialQueue() {
    const list = document.getElementById('social-post-list');
    const providerNote = document.getElementById('social-provider-note');
    const providerDetail = document.getElementById('social-provider-detail');
    const publishButton = document.getElementById('social-publish-button');
    if (providerNote) {
      providerNote.textContent = integrations.socialConfigured
        ? 'Write the post once here, then dispatch it through the connected social automation or platform webhooks.'
        : 'Add a social automation webhook or platform webhook to dispatch one post across your channels.';
    }
    if (providerDetail) {
      providerDetail.textContent = integrations.socialConfigured
        ? (integrations.socialAutomationConfigured
          ? 'The publish button will send your caption and link payload to the automation webhook, which can fan it out to every connected platform.'
          : `The publish button will send to these configured platforms: ${(integrations.socialPlatforms || []).join(', ') || 'none'}.`)
        : 'No social webhook is configured yet, so drafts can only be saved or copied for now.';
    }
    if (publishButton) {
      publishButton.disabled = !integrations.socialConfigured;
      publishButton.style.opacity = publishButton.disabled ? '0.45' : '1';
    }
    if (!list) return;
    const ordered = sortNewestFirst(socialPosts, (item) => item.createdAt);
    renderOpsMarkup(list, ordered.length ? ordered.map((post) => `
      <div class="list-row">
        <div class="list-row-main">
          <strong>${escapeHtml(String(post.createdAt || '').slice(0, 10) || 'Draft')}</strong>
          <div class="sub">${escapeHtml(shortText(post.caption, 180))}</div>
          <div class="sub">${post.link ? escapeHtml(post.link) : 'No link attached'}</div>
        </div>
        <div class="list-row-actions">
          <button class="btn btn-ghost btn-sm" data-social-action="copy-saved" data-social-post-id="${Number(post.id)}">Copy draft</button>
        </div>
      </div>
    `).join('') : '<div class="empty"><div class="icon">📣</div><p>No social drafts saved yet.</p></div>');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-review-action], [data-social-action]') : null;
    if (!target) return;
    const reviewAction = target.dataset.reviewAction;
    if (reviewAction === 'send-text') {
      const id = Number(target.dataset.reviewRequestId);
      if (Number.isFinite(id)) sendReviewDrop(id, 'text');
      return;
    }
    if (reviewAction === 'send-email') {
      const id = Number(target.dataset.reviewRequestId);
      if (Number.isFinite(id)) sendReviewDrop(id, 'email');
      return;
    }
    if (reviewAction === 'complete') {
      const id = Number(target.dataset.reviewRequestId);
      if (Number.isFinite(id)) markReviewCompleted(id);
      return;
    }
    if (reviewAction === 'toggle-responded') {
      const id = Number(target.dataset.reviewId);
      if (Number.isFinite(id)) toggleReviewResponded(id);
      return;
    }
    if (target.dataset.socialAction === 'copy-saved') {
      const id = Number(target.dataset.socialPostId);
      if (Number.isFinite(id)) copySavedSocial(id);
    }
  });
  
  // ── FUEL ──
  let fuelIdSyncPending = false;
  function syncFuelEntryIds() {
    if (!backendAvailable || fuelIdSyncPending) return;
    const {items, changed} = listWithEntryIds(fuelLog);
    if (!changed) return;
    fuelIdSyncPending = true;
    saveStateSnapshot({
      ...snapshotState(),
      fuelLog: items
    }, {silent:true}).then((saved) => {
      if (!saved) return;
      fuelLog = items;
      renderFuel({skipIdSync:true});
    }).catch((error) => {
      console.error('Fuel id sync failed:', error);
    }).finally(() => {
      fuelIdSyncPending = false;
    });
  }
  function renderFuel(options = {}) {
    if (!options.skipIdSync) ensureLocalEntryIds(fuelLog, syncFuelEntryIds);
    syncAssetSelectors();
    const monthFuel = fuelLog.filter((entry) => isSameMonth(dateValue(entry.date)));
    const monthCost = monthFuel.reduce((sum, entry) => sum + (Number(entry.gallons || 0) * Number(entry.ppg || 0)), 0);
    const monthHours = monthFuel.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const costPerHour = monthHours > 0 ? monthCost / monthHours : 0;
    document.getElementById('fuel-kpi-month').textContent = `${monthCost.toFixed(2)}`;
    document.getElementById('fuel-kpi-month-meta').textContent = `${monthFuel.length} fuel entr${monthFuel.length === 1 ? 'y' : 'ies'} this month`;
    document.getElementById('fuel-kpi-rate').textContent = monthHours > 0 ? `${costPerHour.toFixed(2)}` : '$0.00';
    document.getElementById('fuel-kpi-rate-meta').textContent = monthHours > 0 ? `${monthHours.toFixed(1)} rental hours logged this month` : 'No rental hours logged yet';
    document.getElementById('fuel-kpi-hours').textContent = monthHours.toFixed(1);
    document.getElementById('fuel-kpi-hours-meta').textContent = 'This month';
    renderOpsMarkup(document.getElementById('fuel-log'), sortNewestFirst(fuelLog, (entry) => entry.date).map(f => {
      const cost = (Number(f.gallons || 0) * Number(f.ppg || 0)).toFixed(2);
      const cph = Number(f.hours || 0) > 0 ? (Number(cost)/Number(f.hours)).toFixed(2) : '–';
      return `<div class="fuel-entry">
        <span style="font-size:1.3rem;">⛽</span>
        <div style="flex:1;"><div class="fuel-craft">${escapeHtml(f.craft)}</div><div class="fuel-meta">${escapeHtml(formatShortDate(f.date))} · ${escapeHtml(String(f.gallons))} gal @ ${escapeHtml(String(f.ppg))} · ${escapeHtml(String(f.hours))}hrs · Ref: ${escapeHtml(f.ref || '—')}</div></div>
        <div style="text-align:right;">
          <div class="fuel-cost">${cost}</div>
          <div style="font-size:0.72rem;color:var(--muted);">${cph}/hr</div>
          <div class="fuel-entry-actions" style="margin-top:0.55rem;justify-content:flex-end;">
            <button class="btn btn-ghost btn-sm" data-fuel-action="edit" data-fuel-id="${Number(f.id)}">Edit</button>
            <button class="btn btn-danger btn-sm" data-fuel-action="delete" data-fuel-id="${Number(f.id)}">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('') || '<div class="empty"><div class="icon">⛽</div><p>No fuel entries logged yet.</p></div>');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-fuel-action]') : null;
    if (!target) return;
    const action = target.dataset.fuelAction;
    const id = Number(target.dataset.fuelId);
    if (!Number.isFinite(id)) return;
    if (action === 'edit') {
      openFuelModal(id);
    } else if (action === 'delete') {
      deleteFuelEntry(id);
    }
  });
  
  async function saveFuel() {
    const craft = document.getElementById('f-craft').value.trim();
    const gallons = parseFloat(document.getElementById('f-gallons').value) || 0;
    const ppg = parseFloat(document.getElementById('f-ppg').value) || 3.85;
    if (!craft || !gallons) {
      showToast('⚠️ Add equipment and gallons');
      return;
    }
    const previousFuelLog = JSON.parse(JSON.stringify(fuelLog));
    const payload = {
      craft,
      date: document.getElementById('f-date').value || today(),
      gallons,
      ppg,
      hours: parseFloat(document.getElementById('f-hours').value) || 0,
      ref: document.getElementById('f-ref').value.trim() || '—'
    };
    const isEditingFuel = Boolean(editingFuelId);
    if (editingFuelId) {
      const entry = fuelLog.find((item) => Number(item.id) === Number(editingFuelId));
      if (!entry) {
        showToast('⚠️ Fuel entry not found');
        return;
      }
      Object.assign(entry, payload);
    } else {
      fuelLog.unshift({id: nextId(fuelLog), ...payload});
    }
    if (!(await persistStateChange())) {
      fuelLog = previousFuelLog;
      return;
    }
    closeModal('fuel-modal');
    resetFuelForm();
    syncAssetSelectors();
    renderFuel();
    renderExpenses();
    renderDashboardMetrics();
    renderMaint();
    showToast(isEditingFuel ? '⛽ Fuel entry updated' : '⛽ Fuel entry saved');
  }
  
  async function deleteFuelEntry(fuelId) {
    const entry = fuelLog.find((item) => Number(item.id) === Number(fuelId));
    if (!entry) {
      showToast('⚠️ Fuel entry not found');
      return;
    }
    const confirmed = window.confirm(`Delete fuel entry for ${entry.craft} on ${formatShortDate(entry.date)}?`);
    if (!confirmed) return;
    const previousFuelLog = JSON.parse(JSON.stringify(fuelLog));
    const shouldCloseEditor = editingFuelId && Number(editingFuelId) === Number(fuelId);
    fuelLog = fuelLog.filter((item) => Number(item.id) !== Number(fuelId));
    if (!(await persistStateChange())) {
      fuelLog = previousFuelLog;
      return;
    }
    if (shouldCloseEditor) {
      closeModal('fuel-modal');
      resetFuelForm();
    }
    syncAssetSelectors();
    renderFuel();
    renderExpenses();
    renderDashboardMetrics();
    renderMaint();
    showToast('🗑️ Fuel entry removed');
  }
  
  // ── MAINTENANCE ──
  let maintIdSyncPending = false;
  function syncMaintEntryIds() {
    if (!backendAvailable || maintIdSyncPending) return;
    const {items, changed} = listWithEntryIds(maintLog);
    if (!changed) return;
    maintIdSyncPending = true;
    saveStateSnapshot({
      ...snapshotState(),
      maintLog: items
    }, {silent:true}).then((saved) => {
      if (!saved) return;
      maintLog = items;
      renderMaint({skipIdSync:true});
    }).catch((error) => {
      console.error('Maint id sync failed:', error);
    }).finally(() => {
      maintIdSyncPending = false;
    });
  }
  function renderMaint(options = {}) {
    if (!options.skipIdSync) ensureLocalEntryIds(maintLog, syncMaintEntryIds);
    syncAssetSelectors();
    renderOpsMarkup(document.getElementById('maint-grid'), equipmentSummaries().map(e => {
      return `<div class="maint-card">
        <div class="maint-craft">${e.name}</div>
        <div class="maint-hours">Last service: ${e.lastServiceDate}</div>
        <div class="maint-progress">
          <div class="maint-progress-label"><span>Logged hours since service</span><span style="color:${e.color};">${e.hoursSinceService}/${e.serviceInterval}</span></div>
          <div class="maint-bar-track"><div class="maint-bar-fill" style="width:${e.pct}%;background:${e.color};"></div></div>
        </div>
        <div class="maint-next">
          <span class="label">Next service:</span>
          ${e.hoursLeft===0?'<span class="badge badge-noshow">OVERDUE</span>':e.hoursLeft<=10?`<span class="badge badge-pending">In ${e.hoursLeft} hrs</span>`:`<span style="color:var(--green);">In ${e.hoursLeft} hrs</span>`}
        </div>
      </div>`;
    }).join(''));
    renderOpsMarkup(document.getElementById('maint-log'), sortNewestFirst(maintLog, (entry) => entry.date).map(m=>`<tr><td>${escapeHtml(m.craft)}</td><td data-label="Service">${escapeHtml(m.type)}</td><td data-label="Date">${escapeHtml(formatShortDate(m.date))}</td><td data-label="Hours">${escapeHtml(String(m.hours))} hrs</td><td data-label="Cost" style="color:var(--amber);">${moneyLabel(m.cost || 0)}</td><td data-label="Notes" style="color:var(--muted);">${escapeHtml(m.notes || '—')}</td><td data-label=""><div style="display:flex;gap:0.45rem;flex-wrap:wrap;"><button class="btn btn-ghost btn-sm" data-maint-action="edit" data-maint-id="${Number(m.id)}">Edit</button><button class="btn btn-danger btn-sm" data-maint-action="delete" data-maint-id="${Number(m.id)}">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="7"><div class="empty"><div class="icon">🔧</div><p>No service history logged yet.</p></div></td></tr>');
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-maint-action]') : null;
    if (!target) return;
    const action = target.dataset.maintAction;
    const id = Number(target.dataset.maintId);
    if (!Number.isFinite(id)) return;
    if (action === 'edit') {
      openMaintModal(id);
    } else if (action === 'delete') {
      deleteMaintEntry(id);
    }
  });
  
  async function saveMaint() {
    const craft = document.getElementById('m-craft').value.trim();
    if (!craft) {
      showToast('⚠️ Add equipment name');
      return;
    }
    const previousMaintLog = JSON.parse(JSON.stringify(maintLog));
    const payload = {
      craft,
      type: document.getElementById('m-type').value,
      date: document.getElementById('m-date').value || today(),
      hours: parseFloat(document.getElementById('m-hours').value) || 0,
      cost: parseFloat(document.getElementById('m-cost').value) || 0,
      notes: document.getElementById('m-notes').value.trim()
    };
    const isEditingMaint = Boolean(editingMaintId);
    if (editingMaintId) {
      const entry = maintLog.find((item) => Number(item.id) === Number(editingMaintId));
      if (!entry) {
        showToast('⚠️ Service record not found');
        return;
      }
      Object.assign(entry, payload);
    } else {
      maintLog.unshift({id: nextId(maintLog), ...payload});
    }
    if (!(await persistStateChange())) {
      maintLog = previousMaintLog;
      return;
    }
    closeModal('maint-modal');
    resetMaintForm();
    syncAssetSelectors();
    renderMaint();
    showToast(isEditingMaint ? '🔧 Service updated' : '🔧 Service logged');
  }
  
  async function deleteMaintEntry(maintId) {
    const entry = maintLog.find((item) => Number(item.id) === Number(maintId));
    if (!entry) {
      showToast('⚠️ Service record not found');
      return;
    }
    const confirmed = window.confirm(`Delete ${entry.type} for ${entry.craft} on ${formatShortDate(entry.date)}?`);
    if (!confirmed) return;
    const previousMaintLog = JSON.parse(JSON.stringify(maintLog));
    const shouldCloseEditor = editingMaintId && Number(editingMaintId) === Number(maintId);
    maintLog = maintLog.filter((item) => Number(item.id) !== Number(maintId));
    if (!(await persistStateChange())) {
      maintLog = previousMaintLog;
      return;
    }
    if (shouldCloseEditor) {
      closeModal('maint-modal');
      resetMaintForm();
    }
    syncAssetSelectors();
    renderMaint();
    showToast('🗑️ Service entry removed');
  }
  
  // ── REMINDERS ──
  function renderReminders() {
    const overdue = customers
      .filter((customer) => {
        if (!dateValue(customer.lastBooking)) return false;
        return daysSince(customer.lastBooking) >= 30;
      })
      .sort((a,b)=>daysSince(b.lastBooking)-daysSince(a.lastBooking));
    renderOpsMarkup(document.getElementById('overdue-list'), overdue.length ? overdue.map(c=>`
      <div class="reminder-card">
        <div class="reminder-icon">👤</div>
        <div class="reminder-body">
          <div class="name">${escapeHtml(c.name)} <span style="color:var(--muted);font-weight:400;">· ${daysSince(c.lastBooking)} days ago</span></div>
          <div class="detail">${escapeHtml(c.phone || 'No phone on file')} · ${c.bookings} prev booking${c.bookings!==1?'s':''} · ${moneyLabel(c.totalSpent)} total spent</div>
        </div>
        <div class="reminder-action">
          ${c.phone ? `<a href="sms:${phoneHref(c.phone)}?body=${encodeURIComponent(`Hey ${firstName(c.name)}! It's Shoreline Aquatics — miss you on the lake! Book again this week and get 10% off. Reply YES to claim.`)}" class="btn btn-primary btn-sm" style="text-decoration:none;">💬 Text offer</a>` : '<span class="btn btn-primary btn-sm" style="opacity:0.45;cursor:default;">💬 Text offer</span>'}
          ${c.phone ? `<a href="tel:${phoneHref(c.phone)}" class="btn btn-ghost btn-sm" style="text-decoration:none;">📞 Call</a>` : '<span class="btn btn-ghost btn-sm" style="opacity:0.45;cursor:default;">📞 Call</span>'}
        </div>
      </div>`).join('') : '<div class="empty"><div class="icon">🎉</div><p>No customers overdue for re-engagement!</p></div>');
  
    const upcoming = upcomingScheduledBookings()
      .filter((booking) => !['completed', 'noshow', 'no-show'].includes(normalizeBookingStatusValue(booking.status)))
      .slice(0, 8);
    renderOpsMarkup(document.getElementById('upcoming-reminders'), upcoming.length ? upcoming.map(b=>`
      <div class="reminder-card">
        <div class="reminder-icon">📅</div>
        <div class="reminder-body">
          <div class="name">Reminder: ${escapeHtml(bookingDisplayName(b))}</div>
          <div class="detail">${escapeHtml(bookingCraftLabel(b))} · ${escapeHtml(b.date)} at ${escapeHtml(formatTimeLabel(b.time))}</div>
        </div>
        <div class="reminder-action">
          ${b.phone ? `<a href="sms:${phoneHref(b.phone)}?body=${encodeURIComponent(`Hey ${firstName(bookingDisplayName(b, 'there'))}! Reminder: your Shoreline Aquatics rental is on ${b.date} at ${formatTimeLabel(b.time)}. Don't forget your ID! Questions? (469) 693-7164.`)}" class="btn btn-primary btn-sm" style="text-decoration:none;">Send reminder</a>` : '<span class="btn btn-primary btn-sm" style="opacity:0.45;cursor:default;">Send reminder</span>'}
        </div>
      </div>`).join('') : '<div class="empty"><div class="icon">🗓️</div><p>No scheduled rentals need reminders right now.</p></div>');
  
    const campaignTemplates = [
      {name:'Slow weekday fill',channel:'Text or email',msg:'We have weekday jet ski and boat openings on Lake Lewisville this week. Want us to hold a time for your group?'},
      {name:'Weekend group push',channel:'Text or email',msg:'Weekend lake slots are filling now. If you want jet skis, a boat, or the full bundle, reply and we can lock your time in.'},
      {name:'Bring-them-back offer',channel:'Text only',msg:'Hey! It’s Shoreline Aquatics. We have a return-rider opening this week if you want back on the water. Reply and we’ll hold a slot for you.'},
    ];
    renderOpsMarkup(document.getElementById('campaigns-list'), campaignTemplates.map(c=>`
      <div class="reminder-card">
        <div class="reminder-icon">📣</div>
        <div class="reminder-body">
          <div class="name">${c.name}</div>
          <div class="detail">${c.channel} · "${c.msg}"</div>
        </div>
        <div class="reminder-action">
          <button class="btn btn-primary btn-sm" data-campaign-action="copy-template" data-message="${encodeURIComponent(c.msg)}">📋 Copy template</button>
        </div>
      </div>`).join(''));
  }
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-campaign-action]') : null;
    if (!target) return;
    if (target.dataset.campaignAction === 'copy-template') {
      copyCampaignTemplate(decodeURIComponent(target.dataset.message || ''));
    }
  });
  
  function switchReminderTab(tab, btn) {
    document.querySelectorAll('#page-reminders .tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    ['overdue','upcoming','campaigns'].forEach(name => {
      const reminderPanel = document.getElementById('reminder-'+name);
      if(reminderPanel) reminderPanel.style.display = name===tab ? 'block' : 'none';
    });
  }
  
  function renderSystemPage() {
    const accessList = document.getElementById('system-access-list');
    const statusList = document.getElementById('system-status-list');
    if (!accessList || !statusList) return;
  
    const user = currentSession?.user || {};
    const connectedServices = [
      integrations.smsConfigured,
      integrations.emailConfigured,
      integrations.reviewLinksConfigured,
      integrations.reviewAutomationEnabled,
      integrations.stripeConfigured,
      integrations.socialConfigured || integrations.socialAutomationConfigured
    ].filter(Boolean).length;
  
    document.getElementById('system-kpi-storage').textContent = backendAvailable ? 'Private sync' : 'Offline';
    document.getElementById('system-kpi-storage-meta').textContent = backendAvailable
      ? 'Shared server-backed CRM'
      : 'Private service unavailable';
    document.getElementById('system-kpi-role').textContent = user.displayName || 'Developer';
    document.getElementById('system-kpi-role-meta').textContent = user.role === 'developer'
      ? 'Full control'
      : 'Business access only';
    document.getElementById('system-kpi-integrations').textContent = String(connectedServices);
    document.getElementById('system-kpi-integrations-meta').textContent = 'Connected service checks';
    document.getElementById('system-kpi-access').textContent = '3';
    document.getElementById('system-kpi-access-meta').textContent = 'Developer, owner, and employee logins';
  
    renderOpsMarkup(accessList, `
      <div class="list-row">
        <div class="list-row-main">
          <strong>Developer login</strong>
          <div class="sub">Full business access plus website-development and system controls.</div>
        </div>
      </div>
      <div class="list-row">
        <div class="list-row-main">
          <strong>Owner login</strong>
          <div class="sub">Full business data access without website-development controls.</div>
        </div>
      </div>
      <div class="list-row">
        <div class="list-row-main">
          <strong>Employee login</strong>
          <div class="sub">Bookings-only access for mobile staff with the calendar and add-booking flow, without broader CRM or developer controls.</div>
        </div>
      </div>
      <div class="list-row">
        <div class="list-row-main">
          <strong>Live links</strong>
          <div class="sub"><a href="https://slaquatics.com" target="_blank" rel="noopener noreferrer">slaquatics.com</a> · <a href="${PRIVATE_OPS_URL}" target="_blank" rel="noopener noreferrer">private ops login</a></div>
        </div>
      </div>
    `);
  
    renderOpsMarkup(statusList, `
      <div class="list-row">
        <div class="list-row-main">
          <strong>CRM storage</strong>
          <div class="sub">${backendAvailable ? 'Connected to the private server-backed CRM.' : 'Not connected to the private CRM.'}</div>
        </div>
        <div class="list-row-actions"><span class="badge ${backendAvailable ? 'badge-confirmed' : 'badge-pending'}">${backendAvailable ? 'online' : 'offline'}</span></div>
      </div>
      <div class="list-row">
        <div class="list-row-main">
          <strong>Payments</strong>
          <div class="sub">${integrations.stripeConfigured ? 'Stripe checkout is configured.' : 'Stripe checkout is not configured.'}</div>
        </div>
        <div class="list-row-actions"><span class="badge ${integrations.stripeConfigured ? 'badge-confirmed' : 'badge-pending'}">${integrations.stripeConfigured ? 'configured' : 'needs setup'}</span></div>
      </div>
      <div class="list-row">
        <div class="list-row-main">
          <strong>Messaging</strong>
          <div class="sub">SMS: ${integrations.smsConfigured ? 'configured' : 'not configured'} · Email: ${integrations.emailConfigured ? 'configured' : 'not configured'}</div>
        </div>
        <div class="list-row-actions"><span class="badge ${(integrations.smsConfigured || integrations.emailConfigured) ? 'badge-confirmed' : 'badge-pending'}">${(integrations.smsConfigured || integrations.emailConfigured) ? 'available' : 'needs setup'}</span></div>
      </div>
      <div class="list-row">
        <div class="list-row-main">
          <strong>Review automation</strong>
          <div class="sub">Links: ${integrations.reviewLinksConfigured ? 'configured' : 'not configured'} · Auto-send: ${integrations.reviewAutomationEnabled ? 'enabled' : 'off'}</div>
        </div>
        <div class="list-row-actions"><span class="badge ${(integrations.reviewLinksConfigured && integrations.reviewAutomationEnabled) ? 'badge-confirmed' : 'badge-pending'}">${(integrations.reviewLinksConfigured && integrations.reviewAutomationEnabled) ? 'ready' : 'partial'}</span></div>
      </div>
    `);
    loadSystemHealth();
  }
  
  // ── DEVELOPER SYSTEM HEALTH (reads the developer-only health endpoint) ──
  function healthRow(title, detail, level) {
    const badge = level === 'ok'
      ? '<span class="badge badge-confirmed">ok</span>'
      : level === 'warn'
        ? '<span class="badge badge-noshow">action</span>'
        : '<span class="badge badge-pending">info</span>';
    return `<div class="list-row"><div class="list-row-main"><strong>${escapeHtml(title)}</strong><div class="sub">${escapeHtml(detail)}</div></div><div class="list-row-actions">${badge}</div></div>`;
  }
  function formatUptime(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
    return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
  }
  async function loadSystemHealth() {
    const host = document.getElementById('system-security-list');
    if (!host) return;
    if (!currentPermissions().canAccessSystem) {
      renderOpsMarkup(host, `<div class="list-row"><div class="list-row-main"><div class="sub">Available to the owner and developer logins only.</div></div></div>`);
      return;
    }
    try {
      const data = await requestJson('/api/ops/system/health');
      const rows = [];
      rows.push(healthRow('Session secret',
        data.runtime?.sessionSecretSet
          ? 'Fixed SESSION_SECRET is set — logins persist across restarts.'
          : 'SESSION_SECRET is not set — everyone is logged out on each restart or deploy.',
        data.runtime?.sessionSecretSet ? 'ok' : 'warn'));
      (data.auth?.warnings || [])
        .filter((warning) => !/SESSION_SECRET/.test(warning)) // covered by the dedicated row above
        .forEach((warning) => rows.push(healthRow('Config warning', warning, 'warn')));
      if (data.auth?.ok) rows.push(healthRow('Auth configuration', 'No security warnings — credentials and secret are configured.', 'ok'));
      rows.push(healthRow('Runtime',
        `Node ${data.runtime?.node || '?'} · ${data.runtime?.production ? 'production' : 'development'} · ${data.runtime?.storage || '?'} storage · up ${formatUptime(data.runtime?.uptimeSeconds)}.`,
        'neutral'));
      renderOpsMarkup(host, rows.join(''));
    } catch (error) {
      const message = error?.status === 404
        ? 'Health endpoint not deployed yet (ships with the backend update).'
        : `Could not load server health (${String(error?.message || 'error')}).`;
      renderOpsMarkup(host, `<div class="list-row"><div class="list-row-main"><div class="sub">${escapeHtml(message)}</div></div></div>`);
    }
  }
  
  // ── DASHBOARD BARS ──
  function renderBookingBars() {
    const start = startOfMonth(new Date());
    const weeks = [0, 1, 2, 3, 4].map((index) => {
      const weekStart = new Date(start.getFullYear(), start.getMonth(), 1 + (index * 7));
      const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 23, 59, 59, 999);
      const count = scheduledBookings().filter((booking) => {
        const bookingDate = dateValue(booking.date);
        return bookingDate && inRange(bookingDate, weekStart, weekEnd) && bookingDate.getMonth() === start.getMonth();
      }).length;
      return {w:`Week ${index + 1}`,v:count};
    }).filter((week) => week.v > 0 || week.w !== 'Week 5');
    if (!weeks.length) weeks.push({w:'Week 1', v:0});
    const max = Math.max(...weeks.map(w=>w.v), 0) || 1;
    renderOpsMarkup(document.getElementById('booking-bars'), weeks.map(w=>`
      <div class="bar-col">
        <div class="bar-val">${w.v}</div>
        <div class="bar" style="height:${Math.round((w.v/max)*100)}px;" title="${w.v} bookings"></div>
        <div class="bar-label">${w.w}</div>
      </div>`).join(''));
  }
  
  // ── UTILS ──
  function daysSince(dateStr) {
    if(!dateStr||dateStr==='N/A') return 999;
    const parsed = dateValue(dateStr);
    if (!parsed) return 999;
    const diff = Date.now() - parsed.getTime();
    return Math.floor(diff/(1000*60*60*24));
  }
  function today() { return isoFromDate(new Date()); }
  
  function assetServiceInterval(assetName = '') {
    const label = String(assetName || '').trim().toLowerCase();
    if (label.includes('boat')) return 150;
    if (label.includes('trailer')) return 180;
    return 100;
  }
  
  function knownAssetOptions() {
    const seen = new Set();
    const ordered = [];
    const addOption = (value) => {
      const label = String(value || '').trim();
      if (!label) return;
      const key = label.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      ordered.push(label);
    };
    fuelLog.forEach((entry) => addOption(entry.craft));
    maintLog.forEach((entry) => addOption(entry.craft));
    trackers.forEach((tracker) => addOption(tracker.assignedAsset));
    if (!ordered.length) DEFAULT_ASSET_OPTIONS.forEach(addOption);
    return ordered;
  }
  
  function syncAssetSelectors() {
    const options = knownAssetOptions();
    ['fuel-asset-options', 'maint-asset-options'].forEach((id) => {
      const list = document.getElementById(id);
      if (!list) return;
      renderOpsMarkup(list, options.map((option) => `<option value="${escapeHtml(option)}"></option>`).join(''));
    });
    [{ id: 't-asset', includeBlank: true, blankLabel: 'Unassigned / spare' }].forEach(({ id, includeBlank, blankLabel }) => {
      const select = document.getElementById(id);
      if (!select) return;
      const previous = select.value;
      renderOpsMarkup(select, [
        includeBlank ? `<option value="">${escapeHtml(blankLabel)}</option>` : '',
        ...options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
      ].join(''));
      if (previous && options.includes(previous)) {
        select.value = previous;
      } else if (includeBlank) {
        select.value = '';
      } else if (options.length) {
        select.value = options[0];
      }
    });
  }
  
  function equipmentSummaries() {
    return knownAssetOptions().map((name) => {
      const serviceInterval = assetServiceInterval(name);
      const assetMaint = maintLog
        .filter((entry) => String(entry.craft || '').trim() === name)
        .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
      const latestService = assetMaint[0] || null;
      const lastServiceDate = latestService?.date || 'No service logged yet';
      const serviceBaseline = dateValue(latestService?.date) || null;
      const hoursSinceService = fuelLog
        .filter((entry) => String(entry.craft || '').trim() === name)
        .filter((entry) => {
          const entryDate = dateValue(entry.date);
          return !serviceBaseline || !entryDate || entryDate >= serviceBaseline;
        })
        .reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
      const pct = Math.min(100, Math.round((hoursSinceService / serviceInterval) * 100));
      const color = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--green)';
      const hoursLeft = Math.max(0, serviceInterval - hoursSinceService);
      return {
        name,
        lastServiceDate,
        hoursSinceService,
        serviceInterval,
        pct,
        color,
        hoursLeft
      };
    });
  }
  
  function exposeRuntimeActions() {
    Object.assign(window, {
      applyMassEmailQuickSelect,
      calcBookingPrice,
      cleanupEmptyCustomers,
      closeModal,
      closeTrackerModal,
      copySocialCaption,
      deleteTracker,
      exportInvoicesCsv,
      exportReportsCsv,
      filterByStatus,
      filterCRM,
      filterInvoices,
      filterMassEmailRecipients,
      filterTable,
      filterWaivers,
      handleBookingAmountInput,
      handleCRMImport,
      handleInvoiceAmountInput,
      handleInvoiceDurationChange,
      handleInvoiceImport,
      handleInvoicePackageChange,
      importCRMFromTextarea,
      logCommunication,
      logout,
      maybeAutofillCustomer,
      openBookingModal,
      openCustomerModal,
      openExpenseModal,
      openInvoiceModal,
      openMaintModal,
      openModal,
      openTrackerModal,
      publishSocialNow,
      recalcAllInvoices,
      renderCommsPanel,
      renderMassEmailDraft,
      saveBooking,
      saveCustomer,
      saveExpense,
      saveFuel,
      saveInvoice,
      saveMaint,
      saveReviewSettings,
      saveSocialDraft,
      saveTracker,
      sendDirectMessage,
      sendMassEmail,
      sendReviewBlast,
      setCRMFilter,
      setCRMSort,
      setMassEmailAudienceMode,
      shiftCalendarMonth,
      showPage,
      switchReminderTab,
      toggleExpenseSeasonFields,
      toggleInvoicePaymentMethodCustom,
      toggleMassEmailRecipient,
      toggleMobileNav,
      triggerCRMImport,
      triggerInvoiceImport,
      updateBookingFilters,
      updateInvoiceFilters,
      updateInvoicePaymentHelper
    });
  }

  // ── INIT ──
  async function bootApp() {
    let ready = false;
    try {
      ready = await loadData();
      if (!ready) return;
      await loadIntegrationStatus();
    } catch (error) {
      console.error('Ops boot failed:', error);
      showServerRequiredState(error.message || 'Open the live private Shoreline ops app to use the shared server-backed CRM.');
      showToast(`⚠️ ${error.message || 'Could not connect to operations storage'}`);
    } finally {
      updateModeBadge();
      if (!ready) return;
      renderImportSummary();
      renderInvoiceImportSummary();
      renderUpcoming();
      renderDashboardMetrics();
      renderBookingBars();
      renderInvoices();
      renderCRM();
      renderWaivers();
      renderExpenses();
      syncAssetSelectors();
      renderTracking();
      renderCommsPanel();
      renderReviewHub();
      renderSocialQueue();
      renderSystemPage();
      updatePendingBadge();
      document.getElementById('b-date').value = today();
      document.getElementById('e-date').value = today();
      document.getElementById('f-date').value = today();
      document.getElementById('m-date').value = today();
      document.body.dataset.appReady = 'true';
    }
  }
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:' && !isNativeOpsApp()) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/ops-sw.js').catch((error) => {
        console.error('Ops service worker registration failed:', error);
      });
    });
  }
  exposeRuntimeActions();
  bootApp();
}
