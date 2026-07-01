import { OpsLoginClientBehavior } from './OpsLoginClientBehavior';
import { OpsLoginStructuredData } from './OpsLoginStructuredData';
import { OpsLoginStyles } from './OpsLoginStyles';
import { OpsLoginPanel } from './components/OpsLoginPanel';
import { OpsLoginShell } from './components/OpsLoginShell';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function OpsLoginPage() {
  return (
    <>
      <OpsLoginStyles />
      <OpsLoginStructuredData />
      <SlaquaticsCmsPublicPageSection slug="ops-login" includeIds={['ops-login-install-banner']} />
      <OpsLoginShell>
        <SlaquaticsCmsPublicPageSection slug="ops-login" includeTypes={['hero']} />
        <OpsLoginPanel />
        <SlaquaticsCmsPublicPageSection slug="ops-login" excludeTypes={['topbar', 'hero']} excludeIds={['ops-login-install-banner']} />
      </OpsLoginShell>
      <OpsLoginClientBehavior />
    </>
  );
}
