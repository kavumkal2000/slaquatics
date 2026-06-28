import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const structuredData = [] as const satisfies readonly JsonLdValue[];

export function WaiverStructuredData() {
  return <JsonLdStructuredData idPrefix="waiver-jsonld" items={structuredData} />;
}
