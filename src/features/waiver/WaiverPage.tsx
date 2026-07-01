import { WaiverClientBehavior } from './WaiverClientBehavior';
import { WaiverStructuredData } from './WaiverStructuredData';
import { WaiverStyles } from './WaiverStyles';
import { WaiverFormSection } from './components/WaiverFormSection';
import { WaiverShell } from './components/WaiverShell';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function WaiverPage() {
  return (
    <>
      <WaiverStyles />
      <WaiverStructuredData />
      <WaiverShell>
        <SlaquaticsCmsPublicPageSection slug="waiver" includeTypes={['topbar', 'hero']} />
        <div className="content-grid">
          <div className="form-column">
            <WaiverFormSection />
            <SlaquaticsCmsPublicPageSection slug="waiver" includeIds={['waiver-success-copy']} />
          </div>
          <SlaquaticsCmsPublicPageSection slug="waiver" includeIds={['waiver-terms']} />
        </div>
        <SlaquaticsCmsPublicPageSection slug="waiver" excludeTypes={['topbar', 'hero']} excludeIds={['waiver-success-copy', 'waiver-terms']} />
      </WaiverShell>
      <WaiverClientBehavior />
    </>
  );
}
