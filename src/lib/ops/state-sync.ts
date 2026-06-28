import type { OpsState } from './default-state.ts';

function digits(value = '') {
  return String(value || '').replace(/\D+/g, '');
}

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function normalizeStatus(value = '') {
  return String(value || '').trim().toLowerCase();
}

function normalizeInvoiceStatus(value = '') {
  const normalized = String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (normalized === 'paid in full' || normalized === 'fully paid' || normalized === 'full paid') return 'paid';
  if (normalized === 'partial' || normalized === 'partial paid' || normalized === 'partiallypaid') return 'partially paid';
  if (normalized === 'over due') return 'overdue';
  if (normalized === 'canceled') return 'cancelled';
  return normalized;
}

function nextId(items: any[]) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function latestDateValue(left = '', right = '') {
  const first = String(left || '').trim();
  const second = String(right || '').trim();
  if (!first) return second;
  if (!second) return first;
  return second > first ? second : first;
}

function invoiceDurationText(duration = 0) {
  const hours = Number(duration || 0);
  if (!hours) return '';
  return hours === 8 ? 'Full Day (8 hours)' : `${hours} hour${hours === 1 ? '' : 's'}`;
}

function bookingInvoiceDate(booking: any = {}, fallback = new Date().toISOString()) {
  const source = String(booking.paymentCompletedAt || booking.updatedAt || booking.createdAt || fallback || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return source;
  if (source.includes('T')) return source.slice(0, 10);
  return fallback.slice(0, 10);
}

function createWebsiteInvoiceNumber(booking: any = {}, fallback = new Date().toISOString()) {
  const datePart = bookingInvoiceDate(booking, fallback).replace(/-/g, '') || '00000000';
  const bookingPart = String(Number(booking.id || 0)).padStart(3, '0');
  return `SLA-WEB-${datePart}-${bookingPart}`;
}

function invoiceCollectedAmount(invoice: any = {}) {
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

function invoiceTotalValue(invoice: any = {}) {
  const explicitTotal = Number(invoice.total);
  if (Number.isFinite(explicitTotal) && explicitTotal > 0) return { value: explicitTotal, includesProcessingFee: true };
  const amount = Number(invoice.amount);
  if (Number.isFinite(amount) && amount > 0) return { value: amount, includesProcessingFee: false };
  return { value: 0, includesProcessingFee: true };
}

function findInvoiceForBooking(state: OpsState, booking: any = {}) {
  const bookingId = Number(booking.id || 0);
  const publicToken = String(booking.publicToken || '').trim();
  const paymentSessionId = String(booking.paymentSessionId || '').trim();
  const paymentIntentId = String(booking.paymentIntentId || '').trim();
  return state.invoices.find((invoice) => (
    (bookingId > 0 && Number(invoice.bookingId || 0) === bookingId) ||
    (bookingId > 0 && String(invoice.rawFields?.bookingId || '').trim() === String(bookingId)) ||
    (publicToken && (
      String(invoice.bookingPublicToken || '').trim() === publicToken ||
      String(invoice.rawFields?.bookingPublicToken || '').trim() === publicToken
    )) ||
    (paymentSessionId && (
      String(invoice.paymentSessionId || '').trim() === paymentSessionId ||
      String(invoice.rawFields?.paymentSessionId || '').trim() === paymentSessionId
    )) ||
    (paymentIntentId && (
      String(invoice.paymentIntentId || '').trim() === paymentIntentId ||
      String(invoice.rawFields?.paymentIntentId || '').trim() === paymentIntentId
    ))
  )) || null;
}

function linkedBookingIdForInvoice(state: OpsState, invoice: any = {}) {
  const directId = Number(invoice.bookingId || invoice.rawFields?.bookingId || 0);
  if (directId > 0) return directId;
  const bookingToken = String(invoice.bookingPublicToken || invoice.rawFields?.bookingPublicToken || '').trim();
  const paymentSessionId = String(invoice.paymentSessionId || invoice.rawFields?.paymentSessionId || '').trim();
  const paymentIntentId = String(invoice.paymentIntentId || invoice.rawFields?.paymentIntentId || '').trim();
  const booking = state.bookings.find((item) => (
    (bookingToken && String(item.publicToken || '').trim() === bookingToken) ||
    (paymentSessionId && String(item.paymentSessionId || '').trim() === paymentSessionId) ||
    (paymentIntentId && String(item.paymentIntentId || '').trim() === paymentIntentId)
  ));
  return Number(booking?.id || 0);
}

function normalizeName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function invoiceMatchesCustomer(customer: any = {}, invoice: any = {}) {
  if (Number(customer.id || 0) > 0 && Number(invoice.customerId || 0) === Number(customer.id || 0)) return true;
  const customerPhone = digits(customer.phone);
  const invoicePhone = digits(invoice.customerPhone);
  if (customerPhone && invoicePhone && customerPhone === invoicePhone) return true;
  const customerEmail = normalizeEmail(customer.email);
  const invoiceEmail = normalizeEmail(invoice.customerEmail);
  if (customerEmail && invoiceEmail && customerEmail === invoiceEmail) return true;
  const customerName = normalizeName(customer.name);
  const invoiceName = normalizeName(invoice.customerName);
  return Boolean(customerName && invoiceName && customerName === invoiceName);
}

function bookingUsesCheckoutDepositFlow(booking: any = {}) {
  const source = String(booking.source || '').trim().toLowerCase();
  const amountDueToday = Number(booking.amountDueToday || 0);
  const rentalTotal = Number(booking.total || 0);
  const processingFee = Number(booking.processingFeeAmount);
  const total = Number((rentalTotal + (Number.isFinite(processingFee) && processingFee >= 0 ? processingFee : 0)).toFixed(2));
  return Boolean(
    String(booking.publicToken || '').trim() ||
    String(booking.paymentSessionId || '').trim() ||
    source.includes('website') ||
    source.includes('stripe') ||
    source.includes('public') ||
    (amountDueToday > 0 && total > 0 && amountDueToday < total)
  );
}

function bookingProcessingFeeAmountValue(booking: any = {}) {
  const explicit = Number(booking.processingFeeAmount);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  return bookingUsesCheckoutDepositFlow(booking) ? 5 : 0;
}

function bookingDepositAmountValue(booking: any = {}) {
  const explicit = Number(booking.depositAmount);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  return bookingUsesCheckoutDepositFlow(booking) ? 50 : 0;
}

function bookingAmountDueTodayValue(booking: any = {}) {
  const explicit = Number(booking.amountDueToday);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  return Number((bookingDepositAmountValue(booking) + bookingProcessingFeeAmountValue(booking)).toFixed(2));
}

function bookingInvoiceTotal(booking: any = {}) {
  return Number((Number(booking.total || 0) + bookingProcessingFeeAmountValue(booking)).toFixed(2));
}

function bookingCollectedAmountForInvoice(booking: any = {}) {
  const paymentStatus = normalizeStatus(booking.paymentStatus);
  const total = bookingInvoiceTotal(booking);
  if (paymentStatus !== 'paid') return 0;
  if (bookingUsesCheckoutDepositFlow(booking)) {
    const dueToday = bookingAmountDueTodayValue(booking);
    if (dueToday > 0) return Number(Math.min(dueToday, total).toFixed(2));
  }
  return total > 0 ? total : 0;
}

function bookingInvoiceHasManualOverride(existingInvoice: any = null, booking: any = {}) {
  if (!existingInvoice) return false;
  const rawFields = existingInvoice.rawFields || {};
  const explicitFlag = String(rawFields.manualBookingInvoiceOverride || '').trim().toLowerCase();
  if (explicitFlag === 'true') return true;
  const manualTotal = Number(rawFields.manualTotalOverride || 0);
  const syncedTotal = bookingInvoiceTotal(booking);
  if (manualTotal > 0 && Math.abs(manualTotal - syncedTotal) > 0.009) return true;
  const savedTotal = Number(existingInvoice.total || 0);
  return savedTotal > 0 && Math.abs(savedTotal - syncedTotal) > 0.009;
}

function effectiveInvoiceTotalForBooking(existingInvoice: any = null, booking: any = {}) {
  if (bookingInvoiceHasManualOverride(existingInvoice, booking)) {
    const manualTotal = Number(existingInvoice?.rawFields?.manualTotalOverride || existingInvoice?.total || 0);
    if (manualTotal > 0) return Number(manualTotal.toFixed(2));
  }
  return bookingInvoiceTotal(booking);
}

function bookingCollectedAmountForInvoiceTotal(booking: any = {}, targetTotal = 0, existingInvoice: any = null) {
  const paymentStatus = normalizeStatus(booking.paymentStatus);
  const total = Number(targetTotal || 0);
  if (paymentStatus !== 'paid') return 0;
  if (bookingUsesCheckoutDepositFlow(booking)) {
    const dueToday = bookingAmountDueTodayValue(booking);
    if (dueToday > 0) return Number(Math.min(dueToday, total).toFixed(2));
  }
  const existingPaidAmount = Number(existingInvoice?.paidAmount || 0);
  if (existingPaidAmount > 0) return Number(Math.min(existingPaidAmount, total || existingPaidAmount).toFixed(2));
  return total > 0 ? total : 0;
}

function bookingCheckoutSessionIsActive(booking: any = {}) {
  const paymentStatus = normalizeStatus(booking.paymentStatus);
  return paymentStatus === 'pending' || (Boolean(String(booking.paymentSessionId || '').trim()) && !['expired', 'failed', 'canceled', 'cancelled', 'void', 'paid'].includes(paymentStatus));
}

function mergedCollectedAmountForBookingInvoice(existingInvoice: any = null, booking: any = {}) {
  const total = effectiveInvoiceTotalForBooking(existingInvoice, booking);
  const bookingCollected = bookingCollectedAmountForInvoiceTotal(booking, total, existingInvoice);
  const invoiceCollected = Math.min(Number(existingInvoice?.paidAmount || 0), total || Number(existingInvoice?.paidAmount || 0));
  return Number(Math.max(bookingCollected, invoiceCollected, 0).toFixed(2));
}

function mergedInvoiceStatusForBooking(existingInvoice: any = null, booking: any = {}) {
  const bookingStatus = normalizeStatus(booking.status);
  if (['cancelled', 'canceled', 'void'].includes(bookingStatus)) return 'cancelled';
  const total = effectiveInvoiceTotalForBooking(existingInvoice, booking);
  const collected = mergedCollectedAmountForBookingInvoice(existingInvoice, booking);
  if (collected >= total && total > 0) return 'paid';
  if (collected > 0) return 'partially paid';
  if (bookingStatus === 'draft') return 'draft';
  if (bookingCheckoutSessionIsActive(booking)) return 'sent';
  return 'open';
}

function ensureWebsiteBookingInvoice(state: OpsState, booking: any = {}, now = new Date().toISOString()) {
  if (!booking || !Number(booking.id || 0) || normalizeStatus(booking.status) === 'draft' || booking.invoiceSuppressed) return null;
  const existingInvoice = findInvoiceForBooking(state, booking);
  const existingIssueDate = String(existingInvoice?.issueDate || '').trim();
  const issueDate = existingIssueDate || bookingInvoiceDate(booking, now);
  const previousBookingDate = String(existingInvoice?.rawFields?.bookingDate || '').trim();
  const existingDueDate = String(existingInvoice?.dueDate || '').trim();
  const nextAutoDueDate = String(booking.date || issueDate).trim() || issueDate;
  const dueDate = existingDueDate && ![previousBookingDate, existingIssueDate].includes(existingDueDate)
    ? existingDueDate
    : nextAutoDueDate;
  const syncedRentalTotal = Number(booking.total || 0);
  const syncedProcessingFee = bookingProcessingFeeAmountValue(booking);
  const syncedTotal = Number((syncedRentalTotal + syncedProcessingFee).toFixed(2));
  const hasManualOverride = bookingInvoiceHasManualOverride(existingInvoice, booking);
  let rentalTotal = hasManualOverride ? Number(existingInvoice?.subTotal || syncedRentalTotal || 0) : syncedRentalTotal;
  let processingFee = hasManualOverride ? Number(existingInvoice?.taxAmount || 0) : syncedProcessingFee;
  let total = hasManualOverride ? effectiveInvoiceTotalForBooking(existingInvoice, booking) : syncedTotal;
  let collected = mergedCollectedAmountForBookingInvoice(existingInvoice, booking);
  const bookingStatusForInvoice = normalizeStatus(booking.status);
  if (!hasManualOverride && (bookingStatusForInvoice === 'noshow' || bookingStatusForInvoice === 'cancelled')) {
    const keptDeposit = booking.depositRefunded ? 0 : bookingDepositAmountValue(booking);
    rentalTotal = keptDeposit;
    processingFee = 0;
    total = keptDeposit;
    collected = Math.min(collected, keptDeposit);
  }
  const defaultInvoiceName = `${booking.craftLabel || booking.craft || 'Rental'} booking`;
  const defaultLineItems = [
    {
      name: `${booking.craftLabel || 'Rental'} • ${invoiceDurationText(booking.duration) || 'Custom duration'}`,
      description: `Booking for ${booking.date || 'TBD'} at ${booking.time || ''}`,
      amount: syncedRentalTotal,
      quantity: 1,
      currency: 'USD'
    },
    ...(syncedProcessingFee > 0 ? [{
      name: 'Processing Fee',
      description: 'Secure checkout and card processing fee',
      amount: syncedProcessingFee,
      quantity: 1,
      currency: 'USD'
    }] : [])
  ];
  const invoice = existingInvoice || {
    id: nextId(state.invoices),
    invoiceNumber: createWebsiteInvoiceNumber(booking, now),
    recurring: false,
    lineItems: [],
    rawFields: {},
    importSource: 'website',
    liveMode: 'Website Booking',
    createdAt: now
  };

  invoice.bookingId = Number(booking.id || 0);
  invoice.bookingPublicToken = String(booking.publicToken || '').trim();
  invoice.paymentSessionId = String(booking.paymentSessionId || '').trim();
  invoice.paymentIntentId = String(booking.paymentIntentId || '').trim();
  invoice.invoiceName = hasManualOverride ? String(existingInvoice?.invoiceName || defaultInvoiceName).trim() || defaultInvoiceName : defaultInvoiceName;
  invoice.customerId = Number(booking.customerId || 0) || invoice.customerId || 0;
  invoice.customerName = String(booking.name || invoice.customerName || '').trim() || 'Walk-up booking';
  invoice.customerPhone = String(booking.phone || invoice.customerPhone || '').trim();
  invoice.customerEmail = String(booking.email || invoice.customerEmail || '').trim();
  invoice.issueDate = issueDate;
  invoice.dueDate = dueDate;
  invoice.subTotal = rentalTotal;
  invoice.discountAmount = 0;
  invoice.taxAmount = processingFee;
  invoice.total = total;
  invoice.paidAmount = Number(collected.toFixed(2));
  invoice.balanceDue = Number(Math.max(total - collected, 0).toFixed(2));
  invoice.status = mergedInvoiceStatusForBooking(existingInvoice, booking);
  invoice.notes = String(booking.notes || invoice.notes || '').trim();
  invoice.craftKey = String(booking.craftKey || booking.craft || '').trim();
  invoice.durationHours = Number(booking.duration || 0);
  invoice.durationLabel = invoiceDurationText(booking.duration);
  invoice.lineItems = hasManualOverride && Array.isArray(existingInvoice?.lineItems) && existingInvoice.lineItems.length
    ? existingInvoice.lineItems
    : defaultLineItems;
  invoice.rawFields = {
    ...(invoice.rawFields || {}),
    source: 'website booking',
    bookingId: String(booking.id || ''),
    bookingPublicToken: String(booking.publicToken || ''),
    paymentSessionId: String(booking.paymentSessionId || ''),
    paymentStatus: String(booking.paymentStatus || ''),
    bookingStatus: String(booking.status || ''),
    rentalPackage: String(booking.craftKey || ''),
    rentalPackageLabel: String(booking.craftLabel || ''),
    rentalDurationHours: String(booking.duration || ''),
    rentalDurationLabel: invoiceDurationText(booking.duration),
    depositAmount: String(bookingDepositAmountValue(booking).toFixed(2)),
    processingFeeAmount: String(bookingProcessingFeeAmountValue(booking).toFixed(2)),
    amountDueToday: String(bookingAmountDueTodayValue(booking).toFixed(2)),
    bookingDate: String(booking.date || ''),
    bookingTime: String(booking.time || ''),
    paymentIntentId: String(booking.paymentIntentId || ''),
    manualBookingInvoiceOverride: hasManualOverride ? 'true' : '',
    manualTotalOverride: hasManualOverride ? String(total.toFixed(2)) : ''
  };

  if (!existingInvoice) state.invoices.push(invoice);
  return invoice;
}

function bookingCountsForCustomer(customer: any, booking: any) {
  const phone = digits(customer.phone);
  const email = normalizeEmail(customer.email);
  return (
    (Number(customer.id || 0) > 0 && Number(booking.customerId || 0) === Number(customer.id || 0)) ||
    (phone && digits(booking.phone) === phone) ||
    (email && normalizeEmail(booking.email) === email)
  );
}

function updateCustomerRollup(state: OpsState, customer: any) {
  const previous = JSON.stringify({
    bookings: customer.bookings,
    totalSpent: customer.totalSpent,
    lastBooking: customer.lastBooking,
    tag: customer.tag
  });
  const relatedBookings = state.bookings.filter((booking) => {
    const status = normalizeStatus(booking.status);
    if (['draft', 'cancelled', 'canceled', 'noshow', 'no-show', 'void', 'expired'].includes(status)) return false;
    return bookingCountsForCustomer(customer, booking);
  });
  const relatedInvoices = state.invoices.filter((invoice) => invoiceMatchesCustomer(customer, invoice));
  const linkedInvoiceCollectedTotals = new Map<number, number>();
  let standaloneInvoiceCollected = 0;

  relatedInvoices.forEach((invoice) => {
    const collected = invoiceCollectedAmount(invoice);
    const linkedBookingId = linkedBookingIdForInvoice(state, invoice);
    if (linkedBookingId > 0) {
      linkedInvoiceCollectedTotals.set(
        linkedBookingId,
        Number(((linkedInvoiceCollectedTotals.get(linkedBookingId) || 0) + collected).toFixed(2))
      );
      return;
    }
    standaloneInvoiceCollected += collected;
  });

  const bookingSpend = relatedBookings.reduce((sum, booking) => {
    const bookingTotal = Number(booking.total || 0);
    const linkedCollected = Number(linkedInvoiceCollectedTotals.get(Number(booking.id || 0)) || 0);
    return sum + Math.max(bookingTotal, linkedCollected);
  }, 0);
  const orphanLinkedInvoiceCollected = Array.from(linkedInvoiceCollectedTotals.entries()).reduce((sum, [bookingId, collected]) => {
    const hasBooking = relatedBookings.some((booking) => Number(booking.id || 0) === Number(bookingId));
    return hasBooking ? sum : sum + collected;
  }, 0);

  customer.bookings = relatedBookings.length;
  customer.totalSpent = Number((bookingSpend + standaloneInvoiceCollected + orphanLinkedInvoiceCollected).toFixed(2));
  customer.lastBooking = relatedBookings.length
    ? relatedBookings.reduce((latest, booking) => latestDateValue(latest, booking.date), '')
    : 'N/A';
  if (customer.bookings > 1 && customer.tag !== 'vip') customer.tag = 'repeat';
  if (customer.bookings <= 1 && customer.tag === 'repeat') customer.tag = '';
  return previous !== JSON.stringify({
    bookings: customer.bookings,
    totalSpent: customer.totalSpent,
    lastBooking: customer.lastBooking,
    tag: customer.tag
  });
}

function findMatchingCustomer(state: OpsState, booking: any) {
  const customerId = Number(booking.customerId || 0);
  if (customerId) {
    const byId = state.customers.find((customer) => Number(customer.id || 0) === customerId);
    if (byId) return byId;
  }
  const phone = digits(booking.phone);
  const email = normalizeEmail(booking.email);
  return state.customers.find((customer) => (
    (phone && digits(customer.phone) === phone) ||
    (email && normalizeEmail(customer.email) === email)
  )) || null;
}

export function syncCustomersFromBookings(state: OpsState, now = new Date().toISOString()) {
  let changed = false;
  state.bookings.forEach((booking) => {
    const hasCustomerInfo = Boolean(
      String(booking.name || '').trim() ||
      String(booking.phone || '').trim() ||
      String(booking.email || '').trim()
    );
    if (!hasCustomerInfo) {
      if (Number(booking.customerId || 0)) {
        booking.customerId = 0;
        changed = true;
      }
      return;
    }

    let customer = findMatchingCustomer(state, booking);
    if (!customer) {
      customer = {
        id: nextId(state.customers),
        bookings: 0,
        totalSpent: 0,
        lastBooking: '',
        source: String(booking.source || 'Ops Booking').trim() || 'Ops Booking',
        tag: '',
        company: '',
        crmTags: '',
        crmNotes: '',
        createdAt: now.split('T')[0],
        importSource: 'ops'
      };
      state.customers.push(customer);
      changed = true;
    }

    const previousCustomerId = Number(booking.customerId || 0);
    customer.name = String(booking.name || customer.name || '').trim();
    customer.phone = String(booking.phone || customer.phone || '').trim();
    customer.email = String(booking.email || customer.email || '').trim();
    customer.source = String(customer.source || booking.source || 'Ops Booking').trim() || 'Ops Booking';
    customer.importSource = customer.importSource || 'ops';
    customer.lastActivity = String(booking.updatedAt || booking.createdAt || now);
    booking.customerId = customer.id;
    if (previousCustomerId !== Number(customer.id || 0)) changed = true;
  });

  state.customers.forEach((customer) => {
    if (updateCustomerRollup(state, customer)) changed = true;
  });
  return changed;
}

export function syncBookingsFromInvoices(state: OpsState, now = new Date().toISOString()) {
  let changed = false;
  state.bookings.forEach((booking) => {
    if (!booking || !Number(booking.id || 0)) return;
    const bookingStatus = normalizeStatus(booking.status);
    if (['cancelled', 'canceled', 'noshow', 'no-show', 'void', 'expired'].includes(bookingStatus)) return;
    const invoice = findInvoiceForBooking(state, booking);
    if (!invoice) return;

    const invoiceStatus = normalizeInvoiceStatus(invoice.status);
    const invoiceTotal = invoiceTotalValue(invoice);
    const collected = Number(invoiceCollectedAmount(invoice) || 0);
    const processingFee = Number(bookingProcessingFeeAmountValue(booking) || 0);
    if (invoiceTotal.value <= 0) return;
    const syncedRentalTotal = Number(Math.max(
      invoiceTotal.includesProcessingFee ? invoiceTotal.value - processingFee : invoiceTotal.value,
      0
    ).toFixed(2));
    if (Math.abs(Number(booking.total || 0) - syncedRentalTotal) > 0.009) {
      booking.total = syncedRentalTotal;
      changed = true;
    }

    const addons = Number(booking.droneAmount || 0) + Number(booking.karaokeAmount || 0) + Number(booking.tubeAmount || 0);
    const nextBaseTotal = Number(Math.max(syncedRentalTotal - addons, 0).toFixed(2));
    if (Math.abs(Number(booking.baseTotal || 0) - nextBaseTotal) > 0.009) {
      booking.baseTotal = nextBaseTotal;
      changed = true;
    }

    const dueToday = bookingAmountDueTodayValue(booking);
    const checkoutDepositSatisfied = bookingUsesCheckoutDepositFlow(booking) && dueToday > 0 && collected >= (dueToday - 0.009);
    const fullyPaid = invoiceStatus === 'paid' || (invoiceTotal.value > 0 && collected >= (invoiceTotal.value - 0.009));
    if (collected <= 0 && !fullyPaid) return;
    const partialPayment = collected > 0 && !fullyPaid && !checkoutDepositSatisfied;
    const nextPaymentStatus = (fullyPaid || checkoutDepositSatisfied) ? 'paid' : (partialPayment ? 'partial' : 'unpaid');
    if (String(booking.paymentStatus || '').trim().toLowerCase() !== nextPaymentStatus) {
      booking.paymentStatus = nextPaymentStatus;
      changed = true;
    }

    const shouldMarkDepositPaid = fullyPaid || checkoutDepositSatisfied;
    if (Boolean(booking.deposit) !== shouldMarkDepositPaid) {
      booking.deposit = shouldMarkDepositPaid;
      changed = true;
    }

    const nextCompletedAt = shouldMarkDepositPaid ? String(booking.paymentCompletedAt || now) : '';
    if (String(booking.paymentCompletedAt || '') !== nextCompletedAt) {
      booking.paymentCompletedAt = nextCompletedAt;
      changed = true;
    }

    if (shouldMarkDepositPaid && ['pending', 'draft'].includes(bookingStatus)) {
      booking.status = 'confirmed';
      changed = true;
    }
  });
  return changed;
}

export function syncWebsiteBookingInvoices(state: OpsState, now = new Date().toISOString()) {
  let changed = false;
  state.bookings.forEach((booking) => {
    if (!booking || normalizeStatus(booking.status) === 'draft') return;
    const existingInvoice = findInvoiceForBooking(state, booking);
    const beforeCount = state.invoices.length;
    const beforeSnapshot = existingInvoice ? JSON.stringify(existingInvoice) : '';
    const invoice = ensureWebsiteBookingInvoice(state, booking, now);
    if (!invoice) return;
    if (!existingInvoice || beforeCount !== state.invoices.length || JSON.stringify(invoice) !== beforeSnapshot) {
      changed = true;
    }
  });
  return changed;
}
