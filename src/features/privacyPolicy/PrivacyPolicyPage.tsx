import { PrivacyPolicyClientBehavior } from './PrivacyPolicyClientBehavior';
import { PrivacyPolicyStructuredData } from './PrivacyPolicyStructuredData';
import { PrivacyPolicyStyles } from './PrivacyPolicyStyles';
import { PrivacyPolicyShell } from './components/PrivacyPolicyShell';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function PrivacyPolicyPage() {
  return (
    <>
      <PrivacyPolicyStyles />
      <PrivacyPolicyStructuredData />
      <PrivacyPolicyShell>
        <SlaquaticsCmsPublicPageSection slug="privacy-policy" />
      </PrivacyPolicyShell>
      <PrivacyPolicyClientBehavior />
    </>
  );
}
