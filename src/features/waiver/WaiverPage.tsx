import { WaiverClientBehavior } from './WaiverClientBehavior';
import { WaiverStructuredData } from './WaiverStructuredData';
import { WaiverStyles } from './WaiverStyles';
import { WaiverFormSection } from './components/WaiverFormSection';
import { WaiverHero } from './components/WaiverHero';
import { WaiverShell } from './components/WaiverShell';
import { WaiverSuccessCard } from './components/WaiverSuccessCard';
import { WaiverTerms } from './components/WaiverTerms';
import { WaiverTopbar } from './components/WaiverTopbar';

export function WaiverPage() {
  return (
    <>
      <WaiverStyles />
      <WaiverStructuredData />
      <WaiverShell>
        <WaiverTopbar />
        <WaiverHero />
        <div className="content-grid">
          <div className="form-column">
            <WaiverFormSection />
            <WaiverSuccessCard />
          </div>
          <WaiverTerms />
        </div>
      </WaiverShell>
      <WaiverClientBehavior />
    </>
  );
}
