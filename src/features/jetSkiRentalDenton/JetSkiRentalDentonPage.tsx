import { JetSkiRentalDentonClientBehavior } from './JetSkiRentalDentonClientBehavior';
import { JetSkiRentalDentonStructuredData } from './JetSkiRentalDentonStructuredData';
import { JetSkiRentalDentonStyles } from './JetSkiRentalDentonStyles';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function JetSkiRentalDentonPage() {
  return (
    <>
      <JetSkiRentalDentonStyles />
      <JetSkiRentalDentonStructuredData />
      <div className="shell">
        <SlaquaticsCmsPublicPageSection slug="jet-ski-rental-denton" />
      </div>
      <JetSkiRentalDentonClientBehavior />
    </>
  );
}
