export type OpsState = {
  bookings: any[];
  customers: any[];
  expenses: any[];
  fuelLog: any[];
  maintLog: any[];
  trackers: any[];
  invoices: any[];
  communicationsLog: any[];
  reviewRequests: any[];
  reviews: any[];
  reviewSettings: Record<string, any>;
  socialPosts: any[];
  ownerWeeklyDigest: Record<string, any>;
  importMeta: Record<string, any>;
  invoiceImportMeta: Record<string, any>;
};

export const DEFAULT_STATE: OpsState = {
  bookings: [],
  customers: [],
  expenses: [],
  fuelLog: [],
  maintLog: [],
  trackers: [],
  invoices: [],
  communicationsLog: [],
  reviewRequests: [],
  reviews: [],
  reviewSettings: { googleUrl: '', facebookUrl: '', autoSend: false, channel: 'sms' },
  socialPosts: [],
  ownerWeeklyDigest: { lastSentAt: '', lastMessageId: '', lastWeekKey: '' },
  importMeta: { lastType: '', fileName: '', importedAt: '', added: 0, updated: 0, recordCount: 0, replacedSeed: false },
  invoiceImportMeta: { lastType: '', fileName: '', importedAt: '', added: 0, updated: 0, recordCount: 0, replacedSeed: false }
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function sanitizeState(value: Partial<OpsState> = {}): OpsState {
  return {
    bookings: Array.isArray(value.bookings) ? clone(value.bookings) : [],
    customers: Array.isArray(value.customers) ? clone(value.customers) : [],
    expenses: Array.isArray(value.expenses) ? clone(value.expenses) : [],
    fuelLog: Array.isArray(value.fuelLog) ? clone(value.fuelLog) : [],
    maintLog: Array.isArray(value.maintLog) ? clone(value.maintLog) : [],
    trackers: Array.isArray(value.trackers) ? clone(value.trackers) : [],
    invoices: Array.isArray(value.invoices) ? clone(value.invoices) : [],
    communicationsLog: Array.isArray(value.communicationsLog) ? clone(value.communicationsLog) : [],
    reviewRequests: Array.isArray(value.reviewRequests) ? clone(value.reviewRequests) : [],
    reviews: Array.isArray(value.reviews) ? clone(value.reviews) : [],
    reviewSettings: value.reviewSettings && typeof value.reviewSettings === 'object' ? clone(value.reviewSettings) : clone(DEFAULT_STATE.reviewSettings),
    socialPosts: Array.isArray(value.socialPosts) ? clone(value.socialPosts) : [],
    ownerWeeklyDigest: value.ownerWeeklyDigest && typeof value.ownerWeeklyDigest === 'object' ? clone(value.ownerWeeklyDigest) : clone(DEFAULT_STATE.ownerWeeklyDigest),
    importMeta: value.importMeta && typeof value.importMeta === 'object' ? clone(value.importMeta) : clone(DEFAULT_STATE.importMeta),
    invoiceImportMeta: value.invoiceImportMeta && typeof value.invoiceImportMeta === 'object' ? clone(value.invoiceImportMeta) : clone(DEFAULT_STATE.invoiceImportMeta)
  };
}
