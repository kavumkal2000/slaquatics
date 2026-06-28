import { PrivacyPolicyClientBehavior } from './PrivacyPolicyClientBehavior';
import { PrivacyPolicyStructuredData } from './PrivacyPolicyStructuredData';
import { PrivacyPolicyStyles } from './PrivacyPolicyStyles';
import { PrivacyPolicyBrandLink } from './components/PrivacyPolicyBrandLink';
import { PrivacyPolicyContent } from './components/PrivacyPolicyContent';
import { PrivacyPolicyShell } from './components/PrivacyPolicyShell';

export function PrivacyPolicyPage() {
  return (
    <>
      <PrivacyPolicyStyles />
      <PrivacyPolicyStructuredData />
      <PrivacyPolicyShell>
        <PrivacyPolicyBrandLink />
        <PrivacyPolicyContent />
      </PrivacyPolicyShell>
      <PrivacyPolicyClientBehavior />
    </>
  );
}
