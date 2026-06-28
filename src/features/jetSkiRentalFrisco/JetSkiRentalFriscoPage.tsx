import { CityRentalPage, cityRentalPages } from '../cityRental/cityRentalContent';
import { JetSkiRentalFriscoClientBehavior } from './JetSkiRentalFriscoClientBehavior';
import { JetSkiRentalFriscoStructuredData } from './JetSkiRentalFriscoStructuredData';
import { JetSkiRentalFriscoStyles } from './JetSkiRentalFriscoStyles';

export function JetSkiRentalFriscoPage() {
  return (
    <>
      <JetSkiRentalFriscoStyles />
      <JetSkiRentalFriscoStructuredData />
      <CityRentalPage content={cityRentalPages.frisco} />
      <JetSkiRentalFriscoClientBehavior />
    </>
  );
}
