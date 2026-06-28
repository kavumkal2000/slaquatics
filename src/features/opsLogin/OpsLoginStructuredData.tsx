import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const structuredData = [] as const satisfies readonly JsonLdValue[];

export function OpsLoginStructuredData() {
  return <JsonLdStructuredData idPrefix="ops-login-jsonld" items={structuredData} />;
}
