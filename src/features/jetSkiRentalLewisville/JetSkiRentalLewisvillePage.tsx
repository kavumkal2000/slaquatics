import { JetSkiRentalLewisvilleClientBehavior } from './JetSkiRentalLewisvilleClientBehavior';
import { JetSkiRentalLewisvilleStructuredData } from './JetSkiRentalLewisvilleStructuredData';
import { JetSkiRentalLewisvilleStyles } from './JetSkiRentalLewisvilleStyles';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function JetSkiRentalLewisvillePage() {
  return (
    <>
      <JetSkiRentalLewisvilleStyles />
      <JetSkiRentalLewisvilleStructuredData />
      <div className="shell">
        <SlaquaticsCmsPublicPageSection slug="jet-ski-rental-lewisville" />
      </div>
      <JetSkiRentalLewisvilleClientBehavior />
    </>
  );
}
