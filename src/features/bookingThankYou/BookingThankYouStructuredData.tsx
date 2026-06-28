import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const structuredData = [] as const satisfies readonly JsonLdValue[];

export function BookingThankYouStructuredData() {
  return <JsonLdStructuredData idPrefix="booking-thank-you-jsonld" items={structuredData} />;
}
