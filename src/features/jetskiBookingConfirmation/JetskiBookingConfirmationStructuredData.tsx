import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const structuredData = [] as const satisfies readonly JsonLdValue[];

export function JetskiBookingConfirmationStructuredData() {
  return <JsonLdStructuredData idPrefix="jetski-booking-confirmation-jsonld" items={structuredData} />;
}
