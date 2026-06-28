'use client';

import { useEffect, useRef } from 'react';

type Craft =
  | 'jetski2'
  | 'jetski3'
  | 'jetski4'
  | 'boat'
  | 'bundle2'
  | 'bundle3'
  | 'bundle4'
  | 'partyboat';

type Pricing = Record<string, Record<number, number>>;

const PRICING: Pricing = {
  jetski2: { 2: 315, 3: 475, 4: 590, 6: 760, 8: 945 },
  jetski3: { 2: 475, 3: 710, 4: 885, 6: 1135, 8: 1420 },
  jetski4: { 2: 630, 3: 945, 4: 1180, 6: 1515, 8: 1890 },
  boat: { 1: 130, 2: 255, 3: 380, 4: 505, 6: 760, 8: 1010 },
  bundle2: { 2: 570, 3: 855, 4: 1095, 6: 1515, 8: 1955 },
  bundle3: { 2: 725, 3: 1090, 4: 1390, 6: 1890, 8: 2430 },
  bundle4: { 2: 885, 3: 1325, 4: 1680, 6: 2270, 8: 2900 },
  partyboat: { 2: 320, 3: 480, 4: 640, 6: 960, 8: 1280 }
};

const CRAFT_NAMES: Partial<Record<Craft, string>> = {
  jetski2: '2 Yamaha Jet Skis',
  jetski3: '3 Yamaha Jet Skis',
  jetski4: '4 Yamaha Jet Skis',
  boat: 'Boat Rental',
  bundle2: '2 Yamaha Jet Skis + Boat',
  bundle3: '3 Yamaha Jet Skis + Boat',
  bundle4: '4 Yamaha Jet Skis + Boat'
};

function byId<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

function selectedDataset(groupId: string, key: string) {
  return document.querySelector<HTMLElement>(`#${groupId} .calc-option.selected`)?.dataset[key] || '';
}

function selectOption(groupId: string, element: HTMLElement) {
  document.querySelectorAll(`#${groupId} .calc-option`).forEach((option) => option.classList.remove('selected'));
  element.classList.add('selected');
}

function getDroneSelection(groupId: string) {
  return (selectedDataset(groupId, 'drone') || 'no') === 'yes';
}

function getJetSkiCount(craft: string) {
  if (craft.startsWith('jetski')) return Number.parseInt(craft.replace('jetski', ''), 10) || 0;
  if (craft.startsWith('bundle')) return Number.parseInt(craft.replace('bundle', ''), 10) || 0;
  return 0;
}

function hourlyRateLabel(craft: string, hours: number, basePrice: number) {
  if (craft === 'boat' || craft === 'partyboat') return '$160/hr';
  const jetSkiCount = getJetSkiCount(craft);
  if (!jetSkiCount || !hours) return '';
  return `$${Math.round(basePrice / jetSkiCount / hours)}/hr per ski`;
}

function savingsLabel(craft: string, hours: number, basePrice: number) {
  if (!craft.startsWith('jetski')) return '';
  const jetSkiCount = getJetSkiCount(craft);
  if (!jetSkiCount || hours <= 2) return 'Base rate is $79/hr per ski.';
  const savings = Math.max(0, 75 * jetSkiCount * hours - basePrice);
  return savings > 0
    ? `Save $${savings.toLocaleString()} total compared with the 2-hour rate. $55 due today at checkout.`
    : 'Base rate is $79/hr per ski. $55 due today at checkout.';
}

function bookingUrl(params: Record<string, string | number>) {
  const url = new URL('jetski-booking/', window.location.href);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}

function setText(id: string, value: string) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function setHref(id: string, value: string) {
  const element = byId<HTMLAnchorElement>(id);
  if (element) element.href = value;
}

function clearElement(element: Element) {
  element.replaceChildren();
}

function appendSpan(parent: Element, className: string, text: string) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  parent.appendChild(span);
  return span;
}

function calculateJetSkis() {
  const craft = selectedDataset('js-craft-opts', 'craft') || 'jetski2';
  const hours = Number.parseInt(selectedDataset('js-dur-opts', 'hours'), 10) || 2;
  const drone = getDroneSelection('js-drone-opts');
  const basePrice = PRICING[craft]?.[hours] || 0;
  const total = basePrice + (drone ? 50 : 0);
  const durationLabel = hours === 8 ? 'Full Day (8hrs)' : `${hours}hrs`;

  setText('js-price', money(total));
  setText('js-desc', `${CRAFT_NAMES[craft as Craft] || craft} · ${durationLabel} · ${hourlyRateLabel(craft, hours, basePrice)}${drone ? ' · Drone added' : ''}`);
  setText('js-book-btn', 'Continue to Calendar & Contact + Waiver →');
  setText('js-savings-note', savingsLabel(craft, hours, basePrice));
  setHref('js-book-btn', bookingUrl({ type: 'jetski', craft, hours, drone: drone ? 'yes' : 'no', total }));
}

function calculateBoat() {
  const hours = Number.parseInt(selectedDataset('bt-dur-opts', 'hours'), 10) || 4;
  const drone = getDroneSelection('bt-drone-opts');
  const basePrice = PRICING.partyboat[hours] || 0;
  const total = basePrice + (drone ? 50 : 0);
  const durationLabel = hours === 8 ? 'Full Day (8hrs)' : `${hours}hr${hours > 1 ? 's' : ''}`;

  setText('bt-price', money(total));
  setText('bt-desc', `Boat Rental · ${durationLabel} · Up to 14 guests${drone ? ' · Drone added' : ''}`);
  setText('bt-book-btn', 'Continue to Calendar & Contact + Waiver →');
  setHref('bt-book-btn', bookingUrl({ type: 'boat', craft: 'partyboat', hours, drone: drone ? 'yes' : 'no', total }));
}

function calculateBundle() {
  const craft = selectedDataset('bd-craft-opts', 'craft') || 'bundle2';
  const hours = Number.parseInt(selectedDataset('bd-dur-opts', 'hours'), 10) || 2;
  const drone = getDroneSelection('bd-drone-opts');
  const basePrice = PRICING[craft]?.[hours] || 0;
  const total = basePrice + (drone ? 50 : 0);
  const durationLabel = hours === 8 ? 'Full Day (8hrs)' : `${hours}hrs`;

  setText('bd-price', money(total));
  setText('bd-desc', `${CRAFT_NAMES[craft as Craft]} · ${durationLabel}${drone ? ' · Drone added' : ''}`);
  setText('bd-book-btn', 'Continue to Calendar & Contact + Waiver →');
  setHref('bd-book-btn', bookingUrl({ type: 'bundle', craft, hours, drone: drone ? 'yes' : 'no', total }));
}

function recalculateForGroup(groupId: string) {
  if (groupId.startsWith('js-')) calculateJetSkis();
  if (groupId.startsWith('bt-')) calculateBoat();
  if (groupId.startsWith('bd-')) calculateBundle();
}

function switchCalculatorTab(tab: string) {
  document.querySelectorAll('.calc-tab-btn').forEach((button) => button.classList.remove('active'));
  document.querySelectorAll('.calc-panel').forEach((panel) => panel.classList.remove('active'));
  byId(`tab-${tab}`)?.classList.add('active');
  byId(`panel-${tab}`)?.classList.add('active');
}

function visibleReviewCount() {
  if (window.innerWidth <= 760) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

function setupReviews(signal: AbortSignal) {
  let reviewIndex = 0;
  let reviewTimer = 0;

  const render = () => {
    const track = byId('reviews-track');
    const dotsWrap = byId('reviews-dots');
    if (!track || !dotsWrap) return;
    const slides = Array.from(track.children) as HTMLElement[];
    if (!slides.length) return;
    const maxIndex = Math.max(0, slides.length - visibleReviewCount());
    reviewIndex = Math.max(0, Math.min(reviewIndex, maxIndex));
    const gap = Number.parseFloat(window.getComputedStyle(track).gap || '0');
    const slideWidth = slides[0]?.getBoundingClientRect().width || 0;
    track.style.transform = `translateX(-${reviewIndex * (slideWidth + gap)}px)`;
    clearElement(dotsWrap);
    for (let index = 0; index <= maxIndex; index += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `review-dot${index === reviewIndex ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Show review position ${index + 1}`);
      dot.addEventListener('click', () => {
        reviewIndex = index;
        render();
      }, { signal });
      dotsWrap.appendChild(dot);
    }
  };

  const shift = (step: number) => {
    const slideCount = byId('reviews-track')?.children.length || 0;
    const maxIndex = Math.max(0, slideCount - visibleReviewCount());
    if (reviewIndex + step > maxIndex) reviewIndex = 0;
    else if (reviewIndex + step < 0) reviewIndex = maxIndex;
    else reviewIndex += step;
    render();
  };

  document.querySelector('[aria-label="Previous review"]')?.addEventListener('click', () => shift(-1), { signal });
  document.querySelector('[aria-label="Next review"]')?.addEventListener('click', () => shift(1), { signal });
  window.addEventListener('resize', render, { signal });
  reviewTimer = window.setInterval(() => {
    if (!document.hidden) shift(1);
  }, 4500);
  signal.addEventListener('abort', () => window.clearInterval(reviewTimer), { once: true });
  render();
}

function setupMobileNav(signal: AbortSignal) {
  const mobileNav = byId('mobile-nav');
  const backdrop = byId('mobile-nav-backdrop');
  const openButton = byId('mobile-menu-open');
  const closeButton = byId('mobile-menu-close');
  if (!mobileNav || !backdrop || !openButton || !closeButton) return;

  const close = () => {
    mobileNav.classList.remove('show');
    backdrop.classList.remove('show');
    mobileNav.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };
  const open = () => {
    mobileNav.classList.add('show');
    backdrop.classList.add('show');
    mobileNav.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  };

  openButton.addEventListener('click', () => mobileNav.classList.contains('show') ? close() : open(), { signal });
  closeButton.addEventListener('click', close, { signal });
  backdrop.addEventListener('click', close, { signal });
  document.querySelectorAll('.mobile-nav a').forEach((link) => link.addEventListener('click', close, { signal }));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  }, { signal });
}

function setupHeroVideo(signal: AbortSignal) {
  const video = byId<HTMLVideoElement>('hero-video');
  const wrap = byId('hero-video-wrap');
  const playButton = byId('hero-video-play');
  if (!video || !wrap) return;

  const setFallback = (blocked: boolean) => wrap.classList.toggle('autoplay-blocked', blocked);
  const tryPlay = async () => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    try {
      await video.play();
      setFallback(false);
    } catch {
      setFallback(true);
    }
  };

  video.addEventListener('playing', () => setFallback(false), { signal });
  video.addEventListener('canplay', () => { void tryPlay(); }, { signal });
  video.addEventListener('pause', () => {
    if (!document.hidden && !video.ended) setFallback(true);
  }, { signal });
  window.addEventListener('load', () => window.setTimeout(() => { void tryPlay(); }, 120), { signal });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void tryPlay();
  }, { signal });
  playButton?.addEventListener('click', () => { void tryPlay(); }, { signal });
}

function setupFleetSliders(signal: AbortSignal) {
  const slideTo = (slider: Element, index: number) => {
    const slides = Array.from(slider.querySelectorAll('.slide'));
    const dots = Array.from(slider.querySelectorAll('.slider-dot'));
    if (!slides.length) return;
    const next = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === next));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === next));
  };

  document.querySelectorAll('.fleet-slider').forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll('.slide'));
    const dotsWrap = slider.querySelector('.slider-dots');
    if (slides.length < 2) {
      slider.querySelectorAll<HTMLElement>('.slider-arrow').forEach((arrow) => { arrow.style.display = 'none'; });
      return;
    }
    if (!slides.some((slide) => slide.classList.contains('active'))) slides[0]?.classList.add('active');
    if (dotsWrap && !dotsWrap.children.length) {
      slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = `slider-dot${index === 0 ? ' active' : ''}`;
        dot.addEventListener('click', () => slideTo(slider, index), { signal });
        dotsWrap.appendChild(dot);
      });
    }
    slider.querySelector('.slider-arrow.prev')?.addEventListener('click', () => {
      const current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('active')));
      slideTo(slider, current - 1);
    }, { signal });
    slider.querySelector('.slider-arrow.next')?.addEventListener('click', () => {
      const current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('active')));
      slideTo(slider, current + 1);
    }, { signal });
  });
}

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateLabel(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return 'that date';
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function setupAvailability(signal: AbortSignal) {
  const dateInput = byId<HTMLInputElement>('avail-date');
  const status = byId('avail-status');
  const slotsHost = byId('avail-slots');
  if (!dateInput || !status || !slotsHost) return;

  const check = async () => {
    const date = dateInput.value;
    if (!date) return;
    status.textContent = 'Checking availability…';
    status.className = 'avail-status';
    clearElement(slotsHost);
    try {
      const response = await fetch(`/api/public/availability?date=${encodeURIComponent(date)}&craft=jetski2&duration=2`);
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      const slots = Array.isArray(data.slotDetails) ? data.slotDetails : [];
      if (!slots.length) {
        status.textContent = `Call (469) 693-7164 to check ${dateLabel(date)}.`;
        return;
      }
      const openCount = slots.filter((slot: { canBook?: boolean }) => slot.canBook).length;
      clearElement(status);
      if (openCount === 0) {
        appendSpan(status, 'full', `Fully booked on ${dateLabel(date)} — call (469) 693-7164 for the waitlist.`);
      } else {
        appendSpan(status, 'ok', `✅ ${openCount} open jet-ski time${openCount > 1 ? 's' : ''} on ${dateLabel(date)}`);
      }
      slots.forEach((slot: { canBook?: boolean; label?: string; time?: string; openJetSkis?: number }) => {
        const label = String(slot.label || slot.time || '');
        if (!slot.canBook) {
          const slotElement = document.createElement('div');
          slotElement.className = 'avail-slot booked';
          appendSpan(slotElement, 'slot-time', label);
          appendSpan(slotElement, 'slot-meta', 'Booked');
          slotsHost.appendChild(slotElement);
          return;
        }
        const open = Number(slot.openJetSkis);
        const meta = Number.isFinite(open) && open > 0 ? `${open} ski${open === 1 ? '' : 's'} open` : 'Available';
        const href = new URL('./jetski-booking/', window.location.href);
        href.searchParams.set('type', 'jetski');
        href.searchParams.set('craft', 'jetski2');
        href.searchParams.set('hours', '2');
        href.searchParams.set('date', date);
        href.searchParams.set('time', String(slot.time || ''));
        const slotLink = document.createElement('a');
        slotLink.className = 'avail-slot open';
        slotLink.href = href.toString();
        appendSpan(slotLink, 'slot-time', label);
        appendSpan(slotLink, 'slot-meta', meta);
        slotsHost.appendChild(slotLink);
      });
    } catch {
      status.textContent = "Live availability is taking a moment — call (469) 693-7164 and we'll check for you.";
      clearElement(slotsHost);
    }
  };

  const today = todayIso();
  dateInput.value = today;
  dateInput.min = today;
  dateInput.addEventListener('change', check, { signal });
  void check();
}

function setupLeadCapture(signal: AbortSignal) {
  const form = byId<HTMLFormElement>('avail-notify-form');
  const message = byId('avail-notify-msg');
  const submit = byId<HTMLButtonElement>('lead-submit');
  if (!form || !message || !submit) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstName = byId<HTMLInputElement>('lead-name')?.value.trim() || '';
    const phone = byId<HTMLInputElement>('lead-phone')?.value.trim() || '';
    const email = byId<HTMLInputElement>('lead-email')?.value.trim() || '';
    message.className = 'avail-notify-msg';
    if (!firstName) {
      message.textContent = 'Please add your first name.';
      message.classList.add('err');
      return;
    }
    if (!phone && !email) {
      message.textContent = 'Add a phone or email so we can reach you.';
      message.classList.add('err');
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      const response = await fetch('/api/public/seasonal-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, phone, email, preferredChannel: phone ? 'sms' : 'email' })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Something went wrong');
      }
      const body = await response.json();
      form.reset();
      message.textContent = `✅ You're on the list! We'll reach out by ${body.preferredChannel === 'sms' ? 'text' : 'email'} when spots open.`;
      message.classList.add('ok');
    } catch (error) {
      message.textContent = `${error instanceof Error ? error.message : 'Could not sign you up'} — or just call (469) 693-7164.`;
      message.classList.add('err');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Notify Me';
    }
  }, { signal });
}

function setupPageInteractions(signal: AbortSignal) {
  document.querySelectorAll('.faq-item').forEach((item) => {
    item.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((faq) => faq.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    }, { signal });
  });

  document.querySelectorAll<HTMLElement>('.calc-tab-btn[id^="tab-"]').forEach((button) => {
    button.addEventListener('click', () => switchCalculatorTab(button.id.replace('tab-', '')), { signal });
  });
  document.querySelectorAll<HTMLElement>('.calc-select-group .calc-option').forEach((option) => {
    option.addEventListener('click', () => {
      const group = option.closest<HTMLElement>('.calc-select-group');
      if (!group?.id) return;
      selectOption(group.id, option);
      recalculateForGroup(group.id);
    }, { signal });
  });
  byId('btt')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }), { signal });

  const onScroll = () => {
    byId('btt')?.style.setProperty('opacity', window.scrollY > 600 ? '1' : '0');
    byId('mobile-cta-bar')?.classList.toggle('show', window.scrollY > 600);
    let current = '';
    document.querySelectorAll<HTMLElement>('section[id]').forEach((section) => {
      if (window.scrollY >= section.offsetTop - 120) current = section.id;
    });
    document.querySelectorAll<HTMLAnchorElement>('nav ul a').forEach((link) => {
      link.style.color = link.getAttribute('href') === `#${current}` ? 'var(--gold)' : '';
    });
  };
  window.addEventListener('scroll', onScroll, { signal });

  calculateJetSkis();
  calculateBoat();
  calculateBundle();
}

export function HomeClientBehavior() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();
    const { signal } = controller;
    setupPageInteractions(signal);
    setupMobileNav(signal);
    setupHeroVideo(signal);
    setupFleetSliders(signal);
    setupReviews(signal);
    setupAvailability(signal);
    setupLeadCapture(signal);
    return () => controller.abort();
  }, []);

  return null;
}
