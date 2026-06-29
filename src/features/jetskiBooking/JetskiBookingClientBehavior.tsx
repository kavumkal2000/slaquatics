'use client';

import { useEffect, useRef } from 'react';
import { LAUNCH_LOCATION_LABEL } from '../../lib/launch-info';

type RentalType = 'jetski' | 'boat' | 'bundle';
type CraftKey = 'jetski2' | 'jetski3' | 'jetski4' | 'boat' | 'bundle2' | 'bundle3' | 'bundle4' | 'partyboat';

type HolidayCraft = {
  label: string;
  durations: Record<number, number>;
};

type HolidaySpecial = {
  label: string;
  note: string;
  defaultCraft: CraftKey;
  crafts: Partial<Record<CraftKey, HolidayCraft>>;
};

type AvailabilitySlot = {
  canBook?: boolean;
  label?: string;
  time?: string;
  openJetSkis?: number;
  boatAvailable?: boolean;
};

type AvailabilityResponse = {
  blockedTimes?: string[];
  availableTimes?: string[];
  slotDetails?: AvailabilitySlot[];
  availabilityType?: string;
};

type BookingDraft = {
  publicToken?: string;
  craft?: string;
  craftKey?: CraftKey;
  duration?: number;
  drone?: boolean;
  karaoke?: boolean;
  tube?: boolean;
  date?: string;
  time?: string;
};

type BookingPayload = {
  type: RentalType;
  craft: CraftKey;
  craftLabel: string;
  duration: number;
  durationLabel: string;
  total: number;
  drone: boolean;
  karaoke: boolean;
  tube: boolean;
  publicToken: string;
  date: string;
  time: string;
  location: string;
  contactMethod: string;
  partySize: string;
  notes: string;
};

const PRICING: Record<CraftKey, Partial<Record<number, number>>> = {
  jetski2: { 2: 315, 3: 475, 4: 590, 6: 760, 8: 945 },
  jetski3: { 2: 475, 3: 710, 4: 885, 6: 1135, 8: 1420 },
  jetski4: { 2: 630, 3: 945, 4: 1180, 6: 1515, 8: 1890 },
  boat: { 1: 130, 2: 255, 3: 380, 4: 505, 6: 760, 8: 1010 },
  bundle2: { 2: 570, 3: 855, 4: 1095, 6: 1515, 8: 1955 },
  bundle3: { 2: 725, 3: 1090, 4: 1390, 6: 1890, 8: 2430 },
  bundle4: { 2: 885, 3: 1325, 4: 1680, 6: 2270, 8: 2900 },
  partyboat: { 2: 320, 3: 480, 4: 640, 6: 960, 8: 1280 }
};

const CRAFT_LABELS: Record<CraftKey, string> = {
  jetski2: '2 Yamaha Jet Skis',
  jetski3: '3 Yamaha Jet Skis',
  jetski4: '4 Yamaha Jet Skis',
  boat: 'Boat Rental',
  bundle2: '2 Yamaha Jet Skis + Boat',
  bundle3: '3 Yamaha Jet Skis + Boat',
  bundle4: '4 Yamaha Jet Skis + Boat',
  partyboat: 'Boat Rental (up to 14)'
};

const HOLIDAY_SPECIALS: Record<string, HolidaySpecial> = {
  '2026-07-04': {
    label: 'July 4th Special',
    note: 'Holiday special: 2 jet skis or the boat only on the 4th — pick your ride and a 4 or 8 hour block.',
    defaultCraft: 'jetski2',
    crafts: {
      jetski2: { label: '2 Jet Skis', durations: { 4: 900, 8: 1350 } },
      partyboat: { label: 'Boat', durations: { 4: 1000, 8: 2000 } }
    }
  }
};

const TYPE_TO_CRAFTS: Record<RentalType, CraftKey[]> = {
  jetski: ['jetski2', 'jetski3', 'jetski4'],
  boat: ['partyboat'],
  bundle: ['bundle2', 'bundle3', 'bundle4']
};

const LEGACY_CRAFT_MAP: Record<string, CraftKey> = {
  yamaha: 'jetski2',
  seadoo2: 'jetski2',
  seadoo4: 'jetski4'
};

const FALLBACK_GOOGLE_REVIEW_URL = 'https://www.google.com/search?q=Shoreline+Aquatics+Lake+Lewisville+reviews';

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const clearElement = (element: Element) => element.replaceChildren();
const appendTextElement = (parent: Element, tag: keyof HTMLElementTagNameMap, className: string, text: string) => {
  const child = document.createElement(tag);
  if (className) child.className = className;
  child.textContent = text;
  parent.appendChild(child);
  return child;
};
const createSlotCard = (className: string, title: string, body: string, tag: string) => {
  const card = document.createElement('div');
  card.className = className;
  appendTextElement(card, 'strong', '', title);
  appendTextElement(card, 'span', '', body);
  appendTextElement(card, 'span', 'slot-tag', tag);
  return card;
};
const asCraftKey = (value: string | null | undefined): CraftKey | null => (
  value && Object.prototype.hasOwnProperty.call(CRAFT_LABELS, value) ? value as CraftKey : null
);
const asRentalType = (value: string | null | undefined): RentalType | null => (
  value === 'jetski' || value === 'boat' || value === 'bundle' ? value : null
);

function formatCurrency(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function normalizeCraft(craft: string | null) {
  if (!craft) return null;
  return LEGACY_CRAFT_MAP[craft] || asCraftKey(craft);
}

function localIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalIsoDate(iso: string) {
  const parts = String(iso || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function todayLocalIso() {
  return localIsoDate(new Date());
}

function formatSelectedDate(iso: string) {
  const date = parseLocalIsoDate(iso);
  if (!date) return 'Choose a date';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTimeLabel(value = '') {
  const [hourText = '', minuteText = '00'] = String(value).split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return value || 'Choose a time';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minuteText} ${suffix}`;
}

function isBundleType(craft: CraftKey) {
  return craft.startsWith('bundle');
}

function craftUsesBoat(craft: CraftKey) {
  return craft === 'boat' || craft === 'partyboat' || isBundleType(craft);
}

function getJetSkiCount(craft: CraftKey | string) {
  if (craft.startsWith('jetski')) return Number.parseInt(craft.replace('jetski', ''), 10) || 0;
  if (craft.startsWith('bundle')) return Number.parseInt(craft.replace('bundle', ''), 10) || 0;
  return 0;
}

function craftNeedsAvailabilityCheck(craft: CraftKey) {
  return craftUsesBoat(craft) || getJetSkiCount(craft) > 0;
}

function availabilityLabelForCraft(craft: CraftKey) {
  if (isBundleType(craft)) return 'bundle';
  if (craftUsesBoat(craft)) return 'boat';
  if (getJetSkiCount(craft) > 0) return 'jet ski';
  return 'rental';
}

function getHourlyRateLabel(craft: CraftKey, duration: number, basePrice: number) {
  if (craft === 'boat' || craft === 'partyboat') return '$160/hr';
  if (isBundleType(craft)) return 'Custom bundle pricing';
  const jetSkiCount = getJetSkiCount(craft);
  if (!jetSkiCount || !duration) return 'Included in package';
  return `$${Math.round(basePrice / jetSkiCount / duration)}/hr per ski`;
}

function getSavingsLabel(craft: CraftKey, duration: number, basePrice: number) {
  if (craft === 'boat' || craft === 'partyboat') return 'Captain included';
  if (isBundleType(craft)) return 'Boat + captain built in';
  const jetSkiCount = getJetSkiCount(craft);
  if (!jetSkiCount || duration <= 2) return 'Base rate';
  const savings = Math.max(0, 75 * jetSkiCount * duration - basePrice);
  return savings > 0 ? `Save $${savings.toLocaleString()} total` : 'Base rate';
}

function setText(id: string, value: string) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function setAvailabilityNote(message = '', tone = '') {
  const note = byId('availability-note');
  if (!note) return;
  if (!message) {
    note.hidden = true;
    note.textContent = '';
    note.className = 'field-hint';
    return;
  }
  note.hidden = false;
  note.textContent = message;
  note.className = `field-hint${tone ? ` ${tone}` : ''}`;
}

function createBookingController(signal: AbortSignal) {
  let currentType: RentalType = 'jetski';
  let calendarMonthCursor: Date | null = null;
  let selectedBookingDate = '';
  let holidayDuration = 4;
  let holidayCraft: CraftKey | '' = '';
  let bookingTouched = false;
  let backendWarmPromise: Promise<unknown> | null = null;
  let activeAvailabilityRequest = 0;
  let draftAutoSaveTimer = 0;
  let draftSavePromise: Promise<BookingDraft | null> | null = null;
  let lastSavedDraftKey = '';
  let lastSavedDraft: BookingDraft | null = null;
  let integrationsStatus: { reviewGoogleUrl?: string } | null = null;
  let latestAvailability: AvailabilityResponse | null = null;

  const craftSelect = () => byId<HTMLSelectElement>('craft');
  const durationSelect = () => byId<HTMLSelectElement>('duration');
  const timeSelect = () => byId<HTMLSelectElement>('time');
  const dateInput = () => byId<HTMLInputElement>('date');
  const tokenInput = () => byId<HTMLInputElement>('booking-token');
  const checkbox = (id: string) => byId<HTMLInputElement>(id);
  const currentCraft = () => asCraftKey(craftSelect()?.value) || 'jetski2';
  const currentDuration = () => Number(durationSelect()?.value || 0);

  const holidayForDate = (iso: string) => HOLIDAY_SPECIALS[String(iso || '').trim()] || null;

  const resolveHolidayCraft = (holiday: HolidaySpecial | null): CraftKey => {
    if (!holiday) return 'jetski2';
    const keys = Object.keys(holiday.crafts) as CraftKey[];
    if (!keys.includes(holidayCraft as CraftKey)) {
      const fromSelect = currentCraft();
      holidayCraft = keys.includes(fromSelect) ? fromSelect : (holiday.defaultCraft || keys[0]);
    }
    return holidayCraft as CraftKey;
  };

  const holidayDurationsFor = (holiday: HolidaySpecial | null) => {
    if (!holiday) return {};
    const craft = resolveHolidayCraft(holiday);
    return holiday.crafts[craft]?.durations || {};
  };

  const buildBookingPayloadBase = () => {
    const holiday = holidayForDate(selectedBookingDate);
    const craft = holiday ? resolveHolidayCraft(holiday) : currentCraft();
    const duration = holiday ? holidayDuration : currentDuration();
    const drone = checkbox('addon-drone')?.checked || false;
    const showBoatAddons = craftUsesBoat(craft);
    const karaoke = showBoatAddons && (checkbox('addon-karaoke')?.checked || false);
    const tube = showBoatAddons && (checkbox('addon-tube')?.checked || false);
    const addonsTotal = (drone ? 50 : 0) + (karaoke ? 50 : 0) + (tube ? 50 : 0);
    const baseTotal = holiday ? Number(holidayDurationsFor(holiday)[duration] || 0) : (PRICING[craft]?.[duration] || 0);
    return {
      type: currentType,
      craft,
      craftLabel: CRAFT_LABELS[craft],
      duration,
      durationLabel: duration === 8 ? 'Full Day (8 hours)' : `${duration} ${duration === 1 ? 'hour' : 'hours'}`,
      total: baseTotal + addonsTotal,
      drone,
      karaoke,
      tube
    };
  };

  const buildDraftComparableKey = (payload: Partial<BookingPayload & BookingDraft> = {}) => JSON.stringify({
    type: payload.type || currentType,
    craft: payload.craft || '',
    duration: Number(payload.duration || 0),
    drone: Boolean(payload.drone),
    karaoke: Boolean(payload.karaoke),
    tube: Boolean(payload.tube),
    date: String(payload.date || ''),
    time: String(payload.time || ''),
    location: String(payload.location || '')
  });

  const applyIntegrationStatus = () => {
    const card = byId('live-reviews-card');
    if (!card) return;
    const googleUrl = integrationsStatus?.reviewGoogleUrl || FALLBACK_GOOGLE_REVIEW_URL;
    const reviewConfigured = Boolean(integrationsStatus?.reviewGoogleUrl);
    clearElement(card);
    appendTextElement(card, 'div', 'summary-kicker', 'Live Google reviews');
    const total = appendTextElement(card, 'div', 'summary-total', '5.0★');
    total.style.fontSize = '3rem';
    appendTextElement(card, 'div', 'summary-title', reviewConfigured ? 'Read the live Google review feed' : 'Google review link ready for renters');
    appendTextElement(
      card,
      'div',
      'summary-note',
      reviewConfigured
        ? 'Open the real Google review profile before booking if you want social proof straight from recent renters.'
        : 'Your Google review link will show here once it is configured in Shoreline ops. The backup link still opens Google results.'
    );
    const link = document.createElement('a');
    link.className = 'live-review-link';
    link.href = googleUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open live Google reviews';
    card.appendChild(link);
  };

  const renderAvailabilitySpotlight = (slotDetails: AvailabilitySlot[] = [], availabilityType = availabilityLabelForCraft(currentCraft())) => {
    const grid = byId('availability-slot-grid');
    const copy = byId('availability-spotlight-copy');
    if (!grid || !copy) return;
    const requestedJetSkis = getJetSkiCount(currentCraft());
    const formattedDate = formatSelectedDate(selectedBookingDate);
    const availableSlots = slotDetails.filter((slot) => slot.canBook).slice(0, 6);

    if (!selectedBookingDate) {
      copy.textContent = 'Choose the day and package below to see live open slots and how many jet skis are still open.';
      const card = document.createElement('div');
      card.className = 'slot-card';
      appendTextElement(card, 'strong', '', 'Pick a rental day');
      appendTextElement(card, 'span', '', 'As soon as you choose the date, live start times will show here before the contact step.');
      grid.replaceChildren(card);
      return;
    }

    if (!availableSlots.length) {
      copy.textContent = `No open ${availabilityType} start times are left on ${formattedDate}. Try another day or text Shoreline for help.`;
      grid.replaceChildren(createSlotCard('slot-card error', formattedDate, 'That day is sold out for the current package and duration.', 'Sold out'));
      return;
    }

    copy.textContent = `Live open ${availabilityType} start times for ${formattedDate}. These update before the contact and waiver step.`;
    grid.replaceChildren(...availableSlots.map((slot) => {
      const urgencyClass = requestedJetSkis > 0 && Number(slot.openJetSkis || 0) <= requestedJetSkis + 1 ? ' warning' : '';
      const availabilityLine = availabilityType === 'boat'
        ? 'Boat open for this start'
        : availabilityType === 'bundle'
          ? `${slot.openJetSkis} skis open · ${slot.boatAvailable ? 'boat open' : 'boat booked'}`
          : `${slot.openJetSkis} skis open`;
      const tag = requestedJetSkis > 0 && Number(slot.openJetSkis || 0) <= requestedJetSkis + 1 ? 'Going fast' : 'Open now';
      return createSlotCard(`slot-card${urgencyClass}`, String(slot.label || ''), availabilityLine, tag);
    }));
  };

  const refreshTimeOptions = (blockedTimes: string[] = []) => {
    const select = timeSelect();
    if (!select) return;
    const blocked = new Set(blockedTimes);
    const options = Array.from(select.options);
    options.forEach((option) => {
      if (!option.dataset.baseLabel) option.dataset.baseLabel = option.textContent || '';
      const unavailable = blocked.has(option.value);
      option.disabled = unavailable;
      option.textContent = unavailable ? `${option.dataset.baseLabel} · Unavailable` : option.dataset.baseLabel;
    });
    if (select.value && blocked.has(select.value)) {
      const firstAvailable = options.find((option) => !option.disabled);
      select.value = firstAvailable ? firstAvailable.value : '';
    }
  };

  const prewarmOps = () => {
    if (backendWarmPromise) return backendWarmPromise;
    backendWarmPromise = fetch('/api/public/integrations/status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal
    })
      .then((response) => response.json().catch(() => ({})))
      .then((body) => {
        integrationsStatus = body?.integrations || null;
        applyIntegrationStatus();
        return body;
      })
      .catch(() => null);
    return backendWarmPromise;
  };

  const updateAddonVisibility = () => {
    const holiday = holidayForDate(selectedBookingDate);
    const craft = holiday ? resolveHolidayCraft(holiday) : currentCraft();
    const showBoatAddons = craftUsesBoat(craft);
    ['addon-karaoke-row', 'addon-tube-row'].forEach((rowId) => {
      const row = byId(rowId);
      if (row) row.style.display = showBoatAddons ? '' : 'none';
    });
    if (!showBoatAddons) {
      const karaoke = checkbox('addon-karaoke');
      const tube = checkbox('addon-tube');
      if (karaoke) karaoke.checked = false;
      if (tube) tube.checked = false;
    }
  };

  const renderHolidayCard = (holiday: HolidaySpecial) => {
    setText('holiday-title', holiday.label);
    setText('holiday-note', holiday.note);
    const options = byId('holiday-options');
    if (!options) return;
    const activeCraft = resolveHolidayCraft(holiday);
    const craftKeys = Object.keys(holiday.crafts) as CraftKey[];
    const nodes: HTMLElement[] = [];
    if (craftKeys.length > 1) {
      const craftToggle = document.createElement('div');
      craftToggle.className = 'holiday-crafts';
      craftKeys.forEach((key) => {
        const active = key === activeCraft;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `holiday-craft${active ? ' active' : ''}`;
        button.dataset.holidayCraft = key;
        button.setAttribute('aria-pressed', String(active));
        button.textContent = holiday.crafts[key]?.label || key;
        craftToggle.appendChild(button);
      });
      nodes.push(craftToggle);
    }
    const durations = holiday.crafts[activeCraft]?.durations || {};
    const durationWrap = document.createElement('div');
    durationWrap.className = 'holiday-durations';
    Object.keys(durations).map(Number).sort((a, b) => a - b).forEach((hours) => {
      const active = hours === holidayDuration;
      const label = hours === 8 ? 'Full Day · 8 hours' : `${hours} hours`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `holiday-opt${active ? ' active' : ''}`;
      button.dataset.holidayDuration = String(hours);
      button.setAttribute('aria-pressed', String(active));
      appendTextElement(button, 'span', 'holiday-opt-dur', label);
      appendTextElement(button, 'span', 'holiday-opt-price', `$${Number(durations[hours] || 0).toLocaleString()}`);
      durationWrap.appendChild(button);
    });
    nodes.push(durationWrap);
    options.replaceChildren(...nodes);
  };

  const applyHolidayConstraints = () => {
    const card = byId('holiday-special');
    const holiday = holidayForDate(selectedBookingDate);
    if (!holiday) {
      if (card) card.hidden = true;
      return;
    }
    resolveHolidayCraft(holiday);
    const allowed = Object.keys(holidayDurationsFor(holiday)).map(Number);
    if (!allowed.includes(holidayDuration)) {
      const locked = currentDuration();
      holidayDuration = allowed.includes(locked) ? locked : allowed[0];
    }
    if (card) {
      card.hidden = false;
      renderHolidayCard(holiday);
    }
  };

  const updateSummary = () => {
    applyHolidayConstraints();
    updateAddonVisibility();
    const payload = buildBookingPayloadBase();
    const holiday = holidayForDate(selectedBookingDate);
    const baseTotal = holiday ? Number(holidayDurationsFor(holiday)[payload.duration] || 0) : (PRICING[payload.craft]?.[payload.duration] || 0);
    const selectedAddons = [
      payload.drone ? 'aerial drone video' : '',
      payload.karaoke ? 'karaoke setup' : '',
      payload.tube ? 'towable tube' : ''
    ].filter(Boolean);
    const addonsNote = selectedAddons.length ? ` Add-ons: ${selectedAddons.join(', ')} (+$50 each).` : '';

    setText('summary-total', formatCurrency(payload.total));
    setText('summary-title', payload.craftLabel);
    setText('summary-duration', payload.durationLabel);
    setText('summary-date', formatSelectedDate(selectedBookingDate));
    setText('summary-time', formatTimeLabel(timeSelect()?.value || '10:00'));

    if (holiday) {
      const includes = craftUsesBoat(payload.craft)
        ? 'the boat with captain, life jackets, and a full tank'
        : '2 Yamaha jet skis, life jackets, full tanks, and the safety briefing';
      setText('summary-note', `${holiday.label}: ${payload.durationLabel} on ${includes} included.${addonsNote}`);
      setText('summary-rate-label', 'Holiday rate');
      setText('summary-rate', `$${baseTotal.toLocaleString()} flat`);
      setText('summary-value-label', 'Special');
      setText('summary-value', holiday.label);
      return;
    }

    setText('summary-rate', getHourlyRateLabel(payload.craft, payload.duration, baseTotal));
    setText('summary-value', getSavingsLabel(payload.craft, payload.duration, baseTotal));
    if (payload.craft === 'boat' || payload.craft === 'partyboat') {
      setText('summary-note', `Boat rental with captain included.${addonsNote || ' Life jackets and a full tank are included.'}`);
      setText('summary-rate-label', 'Hourly rate');
      setText('summary-value-label', 'Included');
    } else if (isBundleType(payload.craft)) {
      setText('summary-note', `${payload.durationLabel} bundle with Yamaha jet skis, the captained boat, life jackets, fuel, and briefing included.${addonsNote}`);
      setText('summary-rate-label', 'Bundle rate');
      setText('summary-value-label', 'Included');
    } else {
      setText('summary-note', `${payload.durationLabel} rental with ${payload.craftLabel.toLowerCase()}, life jackets, a full tank, and a safety briefing included.${addonsNote}`);
      setText('summary-rate-label', 'Hourly rate');
      setText('summary-value-label', 'Savings');
    }
  };

  const setType = (type: RentalType) => {
    currentType = type;
    setText('craft-label', type === 'boat' ? 'Boat rental option' : type === 'bundle' ? 'Bundle size' : 'Number of jet skis needed');
    document.querySelectorAll<HTMLElement>('.type-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.type === type);
    });
    const select = craftSelect();
    if (!select) return;
    select.replaceChildren(...TYPE_TO_CRAFTS[type].map((craft) => {
      const option = document.createElement('option');
      option.value = craft;
      option.textContent = CRAFT_LABELS[craft];
      return option;
    }));
    populateDurationOptions();
  };

  function populateDurationOptions(selectedHours?: number) {
    const select = durationSelect();
    const craft = currentCraft();
    if (!select) return;
    const durations = Object.keys(PRICING[craft] || {}).map(Number).sort((a, b) => a - b);
    select.replaceChildren(...durations.map((hours) => {
      const label = hours === 8 ? 'Full Day (8 hours)' : `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
      const option = document.createElement('option');
      option.value = String(hours);
      option.textContent = label;
      return option;
    }));
    if (selectedHours && PRICING[craft]?.[selectedHours]) select.value = String(selectedHours);
    updateSummary();
  }

  const createBookingPayload = (): BookingPayload => {
    const base = buildBookingPayloadBase();
    return {
      ...base,
      publicToken: tokenInput()?.value.trim() || '',
      date: dateInput()?.value || '',
      time: timeSelect()?.value || '',
      location: LAUNCH_LOCATION_LABEL,
      contactMethod: 'text',
      partySize: '',
      notes: ''
    };
  };

  const saveDraftBooking = async (payload: BookingPayload & { paymentStatus?: string; depositAmount?: number }) => {
    const response = await fetch('/api/public/booking-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'We could not save your booking details right now.');
    return body.booking as BookingDraft | null;
  };

  const loadDraftBooking = async (token: string) => {
    const response = await fetch(`/api/public/booking?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'We could not load your booking details right now.');
    return body.booking as BookingDraft | null;
  };

  const persistDraftBooking = async (options: { force?: boolean } = {}) => {
    const payload = createBookingPayload();
    const draftKey = buildDraftComparableKey(payload);
    if (!payload.date || !payload.time || !payload.craft || !payload.duration) return null;
    if (!options.force && lastSavedDraftKey === draftKey && tokenInput()?.value.trim()) return lastSavedDraft;
    await prewarmOps();
    const booking = await saveDraftBooking({ ...payload, paymentStatus: 'unpaid', depositAmount: 50 });
    if (booking?.publicToken) {
      const token = tokenInput();
      if (token) token.value = booking.publicToken;
      lastSavedDraftKey = draftKey;
      lastSavedDraft = booking;
    }
    return booking;
  };

  const scheduleDraftSave = () => {
    if (!bookingTouched) return;
    window.clearTimeout(draftAutoSaveTimer);
    draftAutoSaveTimer = window.setTimeout(() => {
      draftSavePromise = persistDraftBooking().catch((error) => {
        console.warn('Draft autosave skipped:', error);
        return null;
      });
    }, 260);
  };

  const renderCalendarSummary = () => {
    const formatted = formatSelectedDate(selectedBookingDate);
    setText('calendar-pill-date', formatted);
    setText('calendar-big-date', formatted);
    setText('calendar-selected-inline', formatted);
    setText('calendar-copy', `Selected rental day: ${formatted}. Exact launch time and package summary stay editable below.`);
    updateSummary();
  };

  const renderCalendar = () => {
    const grid = byId('calendar-grid');
    const monthLabel = byId('calendar-month');
    if (!grid || !monthLabel) return;
    if (!selectedBookingDate) selectedBookingDate = todayLocalIso();
    if (!calendarMonthCursor) {
      const selectedDate = parseLocalIsoDate(selectedBookingDate) || new Date();
      calendarMonthCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }
    monthLabel.textContent = calendarMonthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const firstVisible = new Date(calendarMonthCursor.getFullYear(), calendarMonthCursor.getMonth(), 1 - calendarMonthCursor.getDay());
    const today = todayLocalIso();
    const cells: HTMLButtonElement[] = [];
    for (let offset = 0; offset < 42; offset += 1) {
      const cellDate = new Date(firstVisible.getFullYear(), firstVisible.getMonth(), firstVisible.getDate() + offset);
      const cellIso = localIsoDate(cellDate);
      const isOtherMonth = cellDate.getMonth() !== calendarMonthCursor.getMonth();
      const isToday = cellIso === today;
      const isSelected = cellIso === selectedBookingDate;
      const isPast = cellIso < today;
      const label = isSelected ? 'Selected' : (!isPast && !isOtherMonth && offset < 14 ? 'Open' : '');
      const button = document.createElement('button');
      button.className = `calendar-day${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isPast ? ' is-past' : ''}`;
      button.type = 'button';
      button.dataset.calendarDate = cellIso;
      if (isPast) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      }
      const top = document.createElement('div');
      top.className = 'calendar-day-top';
      appendTextElement(top, 'span', 'calendar-day-num', String(cellDate.getDate()));
      if (isSelected) appendTextElement(top, 'span', 'calendar-day-badge', 'Go');
      button.appendChild(top);
      appendTextElement(button, 'div', 'calendar-day-meta', label);
      cells.push(button);
    }
    grid.replaceChildren(...cells);
    renderCalendarSummary();
  };

  const refreshBoatAvailability = async (options: { quiet?: boolean } = {}) => {
    const payload = createBookingPayload();
    const requestId = ++activeAvailabilityRequest;
    const availabilityLabel = availabilityLabelForCraft(payload.craft);
    if (!payload.date || !payload.duration || !craftNeedsAvailabilityCheck(payload.craft)) {
      refreshTimeOptions([]);
      setAvailabilityNote('');
      renderAvailabilitySpotlight([]);
      return;
    }
    if (!options.quiet) setAvailabilityNote(`Checking live ${availabilityLabel} availability for this day...`);
    try {
      await prewarmOps();
      const params = new URLSearchParams({ date: payload.date, duration: String(payload.duration), craft: payload.craft });
      if (payload.publicToken) params.set('booking', payload.publicToken);
      const response = await fetch(`/api/public/availability?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal
      });
      const body = await response.json().catch(() => ({})) as AvailabilityResponse & { error?: string };
      if (requestId !== activeAvailabilityRequest) return;
      if (!response.ok) throw new Error(body.error || `Could not check ${availabilityLabel} availability right now.`);
      latestAvailability = body;
      const blockedTimes = Array.isArray(body.blockedTimes) ? body.blockedTimes : [];
      const availableTimes = Array.isArray(body.availableTimes) ? body.availableTimes : [];
      const slotDetails = Array.isArray(body.slotDetails) ? body.slotDetails : [];
      const responseLabel = body.availabilityType === 'bundle'
        ? 'bundle'
        : body.availabilityType === 'boat'
          ? 'boat'
          : body.availabilityType === 'jetski'
            ? 'jet ski'
            : availabilityLabel;
      refreshTimeOptions(blockedTimes);
      renderAvailabilitySpotlight(slotDetails, responseLabel);
      if (!availableTimes.length) {
        setAvailabilityNote(`This ${responseLabel} package is fully booked for the available start times on this day. Choose another date.`, 'error');
      } else if (blockedTimes.length) {
        setAvailabilityNote(`${blockedTimes.length} ${responseLabel} start time${blockedTimes.length === 1 ? '' : 's'} unavailable for this day.`, 'warn');
      } else {
        setAvailabilityNote(`All ${responseLabel} start times are open for this date.`, 'success');
      }
    } catch (error) {
      if (requestId !== activeAvailabilityRequest) return;
      latestAvailability = null;
      refreshTimeOptions([]);
      setAvailabilityNote(error instanceof Error ? error.message : `Could not check ${availabilityLabel} availability right now.`, 'warn');
      renderAvailabilitySpotlight([]);
    } finally {
      if (requestId === activeAvailabilityRequest) updateSummary();
    }
  };

  const selectCalendarDate = (iso: string) => {
    selectedBookingDate = iso;
    const input = dateInput();
    if (input) input.value = iso;
    const date = parseLocalIsoDate(iso);
    if (date) calendarMonthCursor = new Date(date.getFullYear(), date.getMonth(), 1);
    renderCalendar();
    bookingTouched = true;
    void refreshBoatAvailability({ quiet: true });
    scheduleDraftSave();
  };

  const shiftCalendarMonth = (delta: number) => {
    if (!calendarMonthCursor) calendarMonthCursor = new Date();
    calendarMonthCursor = new Date(calendarMonthCursor.getFullYear(), calendarMonthCursor.getMonth() + delta, 1);
    renderCalendar();
  };

  const selectHolidayCraft = (craftKey: CraftKey) => {
    holidayCraft = craftKey;
    const holiday = holidayForDate(selectedBookingDate);
    const allowed = Object.keys(holidayDurationsFor(holiday)).map(Number);
    if (!allowed.includes(holidayDuration)) holidayDuration = allowed[0];
    bookingTouched = true;
    updateSummary();
    scheduleDraftSave();
  };

  const selectHolidayDuration = (hours: number) => {
    holidayDuration = hours || 4;
    bookingTouched = true;
    updateSummary();
    scheduleDraftSave();
  };

  const applyQueryDefaults = () => {
    const params = new URLSearchParams(window.location.search);
    const craft = normalizeCraft(params.get('craft'));
    const type = asRentalType(params.get('type'));
    const hours = Number(params.get('hours') || 0);
    const date = params.get('date');
    const isYes = (value: string | null) => value === 'yes' || value === '1' || value === 'true';

    if (type) setType(type);
    else if (craft === 'boat' || craft === 'partyboat') setType('boat');
    else if (craft?.startsWith('bundle')) setType('bundle');

    const craftField = craftSelect();
    if (craft && craftField) craftField.value = craft;
    populateDurationOptions(hours);
    const drone = checkbox('addon-drone');
    const karaoke = checkbox('addon-karaoke');
    const tube = checkbox('addon-tube');
    if (drone) drone.checked = isYes(params.get('drone'));
    if (karaoke) karaoke.checked = isYes(params.get('karaoke'));
    if (tube) tube.checked = isYes(params.get('tube'));

    if (date) {
      selectedBookingDate = date;
      const input = dateInput();
      if (input) input.value = date;
      const parsed = parseLocalIsoDate(date);
      if (parsed) calendarMonthCursor = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      const holiday = holidayForDate(date);
      if (holiday) {
        const wantCraft = craft === 'boat' ? 'partyboat' : craft;
        if (wantCraft && holiday.crafts[wantCraft]) holidayCraft = wantCraft;
        const durations = holidayDurationsFor(holiday);
        if (hours && durations[hours]) holidayDuration = hours;
      }
    }

    const time = params.get('time');
    const timeField = timeSelect();
    if (time && timeField && Array.from(timeField.options).some((option) => option.value === time)) timeField.value = time;
    updateSummary();
  };

  const applyDraftBooking = (booking: BookingDraft | null) => {
    if (!booking) return;
    const token = tokenInput();
    if (token) token.value = booking.publicToken || '';
    if (booking.craftKey && CRAFT_LABELS[booking.craftKey]) {
      if (booking.craftKey === 'boat' || booking.craftKey === 'partyboat') setType('boat');
      else if (booking.craftKey.startsWith('bundle')) setType('bundle');
      else setType('jetski');
      const craftField = craftSelect();
      if (craftField) craftField.value = booking.craftKey;
      populateDurationOptions(Number(booking.duration || 0));
    }
    const drone = checkbox('addon-drone');
    const karaoke = checkbox('addon-karaoke');
    const tube = checkbox('addon-tube');
    if (drone) drone.checked = Boolean(booking.drone);
    if (karaoke) karaoke.checked = Boolean(booking.karaoke);
    if (tube) tube.checked = Boolean(booking.tube);
    if (booking.date) {
      selectedBookingDate = booking.date;
      const input = dateInput();
      if (input) input.value = booking.date;
      const parsed = parseLocalIsoDate(booking.date);
      if (parsed) calendarMonthCursor = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      const holiday = holidayForDate(booking.date);
      if (holiday) {
        const bookedCraft = booking.craftKey === 'boat' ? 'partyboat' : booking.craftKey;
        if (bookedCraft && holiday.crafts[bookedCraft]) holidayCraft = bookedCraft;
        if (holidayDurationsFor(holiday)[Number(booking.duration)]) holidayDuration = Number(booking.duration);
      }
    }
    if (booking.time && timeSelect()) timeSelect()!.value = booking.time;
    lastSavedDraft = booking;
    lastSavedDraftKey = buildDraftComparableKey({
      ...booking,
      type: currentType,
      craft: booking.craftKey || asCraftKey(booking.craft) || undefined
    });
    updateSummary();
    renderCalendar();
    void refreshBoatAvailability({ quiet: true });
  };

  const validatePayload = (payload: BookingPayload) => {
    if (!payload.date || !payload.time) return 'Please choose the rental date and preferred start time.';
    if (payload.date < todayLocalIso()) return 'Please choose today or a future date.';
    if (!payload.craft || !payload.duration || !payload.total) return 'Please choose a valid package and duration before continuing.';
    return '';
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    const payload = createBookingPayload();
    const status = byId('form-status');
    const error = validatePayload(payload);
    if (!status) return;
    if (error) {
      status.textContent = error;
      status.classList.remove('success');
      return;
    }
    status.textContent = 'Saving your booking details...';
    status.classList.remove('success');
    try {
      await prewarmOps();
      if (draftSavePromise) await draftSavePromise.catch(() => null);
      const booking = lastSavedDraftKey === buildDraftComparableKey(payload) && tokenInput()?.value.trim()
        ? lastSavedDraft
        : await persistDraftBooking({ force: true });
      if (!booking?.publicToken) throw new Error('Booking draft was saved, but no booking token was returned.');
      const token = tokenInput();
      if (token) token.value = booking.publicToken;
      status.textContent = 'Booking details saved. Opening the contact, waiver, and checkout page...';
      status.classList.add('success');
      window.location.href = `../jetski-booking-confirmation/?booking=${encodeURIComponent(booking.publicToken)}`;
    } catch (submitError) {
      status.textContent = submitError instanceof Error ? submitError.message : 'We could not save your booking right now.';
      status.classList.remove('success');
    }
  };

  const initHeroVideo = () => {
    const video = byId<HTMLVideoElement>('hero-video');
    const wrap = byId('hero-video-wrap');
    const play = byId<HTMLButtonElement>('hero-video-play');
    if (!video || !wrap || !play) return;
    const showManualPlay = () => wrap.classList.add('autoplay-blocked');
    const hideManualPlay = () => wrap.classList.remove('autoplay-blocked');
    const autoplayPromise = video.play();
    if (autoplayPromise && typeof autoplayPromise.catch === 'function') autoplayPromise.then(hideManualPlay).catch(showManualPlay);
    play.addEventListener('click', async () => {
      try {
        if (video.paused) {
          video.muted = false;
          await video.play();
          hideManualPlay();
          play.textContent = 'Pause video';
        } else {
          video.pause();
          play.textContent = 'Play video';
        }
      } catch {
        showManualPlay();
      }
    }, { signal });
    video.addEventListener('play', () => { play.textContent = 'Pause video'; }, { signal });
    video.addEventListener('pause', () => {
      wrap.classList.add('autoplay-blocked');
      play.textContent = 'Play video';
    }, { signal });
  };

  const bindEvents = () => {
    document.querySelectorAll<HTMLElement>('.type-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const type = asRentalType(button.dataset.type);
        if (!type) return;
        setType(type);
        bookingTouched = true;
        void refreshBoatAvailability({ quiet: true });
        scheduleDraftSave();
      }, { signal });
    });
    craftSelect()?.addEventListener('change', () => {
      populateDurationOptions();
      bookingTouched = true;
      void refreshBoatAvailability({ quiet: true });
      scheduleDraftSave();
    }, { signal });
    durationSelect()?.addEventListener('change', () => {
      updateSummary();
      bookingTouched = true;
      void refreshBoatAvailability({ quiet: true });
      scheduleDraftSave();
    }, { signal });
    ['addon-drone', 'addon-karaoke', 'addon-tube'].forEach((id) => {
      checkbox(id)?.addEventListener('change', () => {
        updateSummary();
        bookingTouched = true;
        scheduleDraftSave();
      }, { signal });
    });
    timeSelect()?.addEventListener('change', () => {
      updateSummary();
      bookingTouched = true;
      scheduleDraftSave();
    }, { signal });
    dateInput()?.addEventListener('change', (event) => {
      const input = event.currentTarget as HTMLInputElement;
      if (!input.value) return;
      selectedBookingDate = input.value;
      const parsed = parseLocalIsoDate(selectedBookingDate);
      if (parsed) calendarMonthCursor = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      renderCalendar();
      bookingTouched = true;
      void refreshBoatAvailability({ quiet: true });
      scheduleDraftSave();
    }, { signal });
    byId('booking-form')?.addEventListener('submit', handleSubmit, { signal });
    document.querySelector('[aria-label="Previous month"]')?.addEventListener('click', () => shiftCalendarMonth(-1), { signal });
    document.querySelector('[aria-label="Next month"]')?.addEventListener('click', () => shiftCalendarMonth(1), { signal });
    byId('calendar-grid')?.addEventListener('click', (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-calendar-date]');
      if (!button || button.disabled) return;
      selectCalendarDate(button.dataset.calendarDate || '');
    }, { signal });
    byId('holiday-options')?.addEventListener('click', (event) => {
      const target = (event.target as Element).closest<HTMLElement>('[data-holiday-craft], [data-holiday-duration]');
      if (!target) return;
      if (target.dataset.holidayCraft) {
        const craft = asCraftKey(target.dataset.holidayCraft);
        if (craft) selectHolidayCraft(craft);
      } else if (target.dataset.holidayDuration) {
        selectHolidayDuration(Number(target.dataset.holidayDuration));
      }
    }, { signal });
  };

  const init = async () => {
    const date = dateInput();
    const time = timeSelect();
    if (date) {
      date.value = todayLocalIso();
      date.min = todayLocalIso();
      selectedBookingDate = date.value;
    }
    if (time) time.value = '10:00';
    setType('jetski');
    initHeroVideo();
    applyIntegrationStatus();
    void prewarmOps();
    const params = new URLSearchParams(window.location.search);
    const bookingToken = params.get('booking');
    if (bookingToken) {
      try {
        const booking = await loadDraftBooking(bookingToken);
        applyDraftBooking(booking);
        return;
      } catch (error) {
        console.warn('Booking draft load failed:', error);
      }
    }
    applyQueryDefaults();
    renderCalendar();
    updateSummary();
    void refreshBoatAvailability({ quiet: true });
  };

  bindEvents();
  void init();

  signal.addEventListener('abort', () => {
    window.clearTimeout(draftAutoSaveTimer);
  }, { once: true });
}

export function JetskiBookingClientBehavior() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();
    createBookingController(controller.signal);
    return () => controller.abort();
  }, []);

  return null;
}
