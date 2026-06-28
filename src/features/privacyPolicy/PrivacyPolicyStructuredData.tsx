import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const structuredData = [] as const satisfies readonly JsonLdValue[];

export function PrivacyPolicyStructuredData() {
  return <JsonLdStructuredData idPrefix="privacy-policy-jsonld" items={structuredData} />;
}
