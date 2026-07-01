import { JetSkiRentalFriscoClientBehavior } from './JetSkiRentalFriscoClientBehavior';
import { JetSkiRentalFriscoStructuredData } from './JetSkiRentalFriscoStructuredData';
import { JetSkiRentalFriscoStyles } from './JetSkiRentalFriscoStyles';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function JetSkiRentalFriscoPage() {
  return (
    <>
      <JetSkiRentalFriscoStyles />
      <JetSkiRentalFriscoStructuredData />
      <div className="shell">
        <SlaquaticsCmsPublicPageSection slug="jet-ski-rental-frisco" />
      </div>
      <JetSkiRentalFriscoClientBehavior />
    </>
  );
}
