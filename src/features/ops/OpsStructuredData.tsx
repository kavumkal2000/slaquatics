import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const structuredData = [] as const satisfies readonly JsonLdValue[];

export function OpsStructuredData() {
  return <JsonLdStructuredData idPrefix="ops-jsonld" items={structuredData} />;
}
