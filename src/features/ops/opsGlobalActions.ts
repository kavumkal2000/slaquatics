'use client';

type OpsGlobalActions = {
  applyMassEmailQuickSelect?: (mode: string) => void;
  calcBookingPrice?: () => void;
  cancelOpsConfirm?: () => void;
  cleanupEmptyCustomers?: () => void;
  closeModal?: (id: string) => void;
  closeTrackerModal?: () => void;
  deleteTracker?: () => void;
  exportReportsCsv?: () => void;
  filterByStatus?: (status: string, tab?: Element | null) => void;
  filterCRM?: (input: HTMLInputElement) => void;
  filterInvoices?: (input: HTMLInputElement) => void;
  filterMassEmailRecipients?: (input: HTMLInputElement) => void;
  filterTable?: (input: HTMLInputElement, tableId: string) => void;
  filterWaivers?: (input: HTMLInputElement) => void;
  handleBookingAmountInput?: () => void;
  handleCRMImport?: (event: Event) => void;
  handleInvoiceImport?: (event: Event) => void;
  handleInvoiceAmountInput?: () => void;
  handleInvoiceDurationChange?: () => void;
  handleInvoicePackageChange?: () => void;
  logCommunication?: () => void;
  logout?: () => void;
  maybeAutofillCustomer?: (field: 'name' | 'phone') => void;
  openBookingModal?: () => void;
  openCustomerModal?: () => void;
  openExpenseModal?: () => void;
  openInvoiceModal?: () => void;
  openMaintModal?: () => void;
  openModal?: (id: string) => void;
  openTrackerModal?: () => void;
  exportInvoicesCsv?: () => void;
  recalcAllInvoices?: () => void;
  renderCommsPanel?: () => void;
  renderMassEmailDraft?: () => void;
  saveBooking?: () => void;
  saveCustomer?: () => void;
  saveExpense?: () => void;
  saveFuel?: () => void;
  saveInvoice?: () => void;
  saveMaint?: () => void;
  saveReviewSettings?: () => void;
  saveSocialDraft?: () => void;
  saveTracker?: () => void;
  sendDirectMessage?: (channel: 'sms' | 'email') => void;
  sendMassEmail?: () => void;
  sendReviewBlast?: () => void;
  setCRMFilter?: (filter: string, chip?: Element | null) => void;
  setCRMSort?: (sort: string) => void;
  setMassEmailAudienceMode?: (mode: string) => void;
  toggleInvoicePaymentMethodCustom?: () => void;
  toggleExpenseSeasonFields?: () => void;
  updateBookingFilters?: () => void;
  updateInvoiceFilters?: () => void;
  updateInvoicePaymentHelper?: () => void;
  triggerCRMImport?: () => void;
  triggerInvoiceImport?: () => void;
  showPage?: (page: string, navItem?: Element | null) => void;
  shiftCalendarMonth?: (delta: number) => void;
  copySocialCaption?: () => void;
  publishSocialNow?: () => void;
  switchReminderTab?: (tab: string, button?: Element | null) => void;
  toggleMobileNav?: () => void;
  resolveOpsConfirm?: () => void;
};

function opsActions() {
  return window as Window & OpsGlobalActions;
}

export function applyMassEmailQuickSelect(mode: string) {
  opsActions().applyMassEmailQuickSelect?.(mode);
}

export function closeOpsModal(id: string) {
  opsActions().closeModal?.(id);
}

export function cancelOpsConfirm() {
  opsActions().cancelOpsConfirm?.();
}

export function calculateBookingPrice() {
  opsActions().calcBookingPrice?.();
}

export function cleanupEmptyCustomers() {
  opsActions().cleanupEmptyCustomers?.();
}

export function closeTrackerModal() {
  opsActions().closeTrackerModal?.();
}

export function deleteTracker() {
  opsActions().deleteTracker?.();
}

export function exportReportsCsv() {
  opsActions().exportReportsCsv?.();
}

export function resolveOpsConfirm() {
  opsActions().resolveOpsConfirm?.();
}

export function exportInvoicesCsv() {
  opsActions().exportInvoicesCsv?.();
}

export function filterBookingTable(input: HTMLInputElement) {
  opsActions().filterTable?.(input, 'bookings-table');
}

export function filterBookingsByStatus(status: string, tab?: Element | null) {
  opsActions().filterByStatus?.(status, tab);
}

export function filterCRM(input: HTMLInputElement) {
  opsActions().filterCRM?.(input);
}

export function filterInvoices(input: HTMLInputElement) {
  opsActions().filterInvoices?.(input);
}

export function filterMassEmailRecipients(input: HTMLInputElement) {
  opsActions().filterMassEmailRecipients?.(input);
}

export function filterWaivers(input: HTMLInputElement) {
  opsActions().filterWaivers?.(input);
}

export function handleBookingAmountInput() {
  opsActions().handleBookingAmountInput?.();
}

export function handleCRMImport(event: Event) {
  opsActions().handleCRMImport?.(event);
}

export function handleInvoiceImport(event: Event) {
  opsActions().handleInvoiceImport?.(event);
}

export function handleInvoiceAmountInput() {
  opsActions().handleInvoiceAmountInput?.();
}

export function handleInvoiceDurationChange() {
  opsActions().handleInvoiceDurationChange?.();
}

export function handleInvoicePackageChange() {
  opsActions().handleInvoicePackageChange?.();
}

export function logCommunication() {
  opsActions().logCommunication?.();
}

export function logoutOps() {
  opsActions().logout?.();
}

export function maybeAutofillCustomer(field: 'name' | 'phone') {
  opsActions().maybeAutofillCustomer?.(field);
}

export function openBookingModal() {
  opsActions().openBookingModal?.();
}

export function openCustomerModal() {
  opsActions().openCustomerModal?.();
}

export function openExpenseModal() {
  opsActions().openExpenseModal?.();
}

export function openInvoiceModal() {
  opsActions().openInvoiceModal?.();
}

export function openMaintModal() {
  opsActions().openMaintModal?.();
}

export function openOpsModal(id: string) {
  opsActions().openModal?.(id);
}

export function openTrackerModal() {
  opsActions().openTrackerModal?.();
}

export function recalcAllInvoices() {
  opsActions().recalcAllInvoices?.();
}

export function renderCommsPanel() {
  opsActions().renderCommsPanel?.();
}

export function renderMassEmailDraft() {
  opsActions().renderMassEmailDraft?.();
}

export function saveBooking() {
  opsActions().saveBooking?.();
}

export function saveCustomer() {
  opsActions().saveCustomer?.();
}

export function saveExpense() {
  opsActions().saveExpense?.();
}

export function saveFuel() {
  opsActions().saveFuel?.();
}

export function saveInvoice() {
  opsActions().saveInvoice?.();
}

export function saveMaint() {
  opsActions().saveMaint?.();
}

export function saveReviewSettings() {
  opsActions().saveReviewSettings?.();
}

export function saveSocialDraft() {
  opsActions().saveSocialDraft?.();
}

export function saveTracker() {
  opsActions().saveTracker?.();
}

export function sendDirectMessage(channel: 'sms' | 'email') {
  opsActions().sendDirectMessage?.(channel);
}

export function sendMassEmail() {
  opsActions().sendMassEmail?.();
}

export function sendReviewBlast() {
  opsActions().sendReviewBlast?.();
}

export function setCRMFilter(filter: string, chip?: Element | null) {
  opsActions().setCRMFilter?.(filter, chip);
}

export function setCRMSort(sort: string) {
  opsActions().setCRMSort?.(sort);
}

export function setMassEmailAudienceMode(mode: string) {
  opsActions().setMassEmailAudienceMode?.(mode);
}

export function showOpsPage(page: string, navItem?: Element | null) {
  opsActions().showPage?.(page, navItem);
}

export function shiftCalendarMonth(delta: number) {
  opsActions().shiftCalendarMonth?.(delta);
}

export function copySocialCaption() {
  opsActions().copySocialCaption?.();
}

export function publishSocialNow() {
  opsActions().publishSocialNow?.();
}

export function switchReminderTab(tab: string, button?: Element | null) {
  opsActions().switchReminderTab?.(tab, button);
}

export function toggleMobileNav() {
  opsActions().toggleMobileNav?.();
}

export function toggleInvoicePaymentMethodCustom() {
  opsActions().toggleInvoicePaymentMethodCustom?.();
}

export function toggleExpenseSeasonFields() {
  opsActions().toggleExpenseSeasonFields?.();
}

export function updateBookingFilters() {
  opsActions().updateBookingFilters?.();
}

export function updateInvoiceFilters() {
  opsActions().updateInvoiceFilters?.();
}

export function updateInvoicePaymentHelper() {
  opsActions().updateInvoicePaymentHelper?.();
}

export function triggerCRMImport() {
  opsActions().triggerCRMImport?.();
}

export function triggerInvoiceImport() {
  opsActions().triggerInvoiceImport?.();
}
