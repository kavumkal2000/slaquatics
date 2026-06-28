import { OpsLoginClientBehavior } from './OpsLoginClientBehavior';
import { OpsLoginStructuredData } from './OpsLoginStructuredData';
import { OpsLoginStyles } from './OpsLoginStyles';
import { OpsLoginHero } from './components/OpsLoginHero';
import { OpsLoginInstallBanner } from './components/OpsLoginInstallBanner';
import { OpsLoginPanel } from './components/OpsLoginPanel';
import { OpsLoginShell } from './components/OpsLoginShell';

export function OpsLoginPage() {
  return (
    <>
      <OpsLoginStyles />
      <OpsLoginStructuredData />
      <OpsLoginInstallBanner />
      <OpsLoginShell>
        <OpsLoginHero />
        <OpsLoginPanel />
      </OpsLoginShell>
      <OpsLoginClientBehavior />
    </>
  );
}
