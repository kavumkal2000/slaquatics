import { CityRentalPage, cityRentalPages } from '../cityRental/cityRentalContent';
import { JetSkiRentalLewisvilleClientBehavior } from './JetSkiRentalLewisvilleClientBehavior';
import { JetSkiRentalLewisvilleStructuredData } from './JetSkiRentalLewisvilleStructuredData';
import { JetSkiRentalLewisvilleStyles } from './JetSkiRentalLewisvilleStyles';

export function JetSkiRentalLewisvillePage() {
  return (
    <>
      <JetSkiRentalLewisvilleStyles />
      <JetSkiRentalLewisvilleStructuredData />
      <CityRentalPage content={cityRentalPages.lewisville} />
      <JetSkiRentalLewisvilleClientBehavior />
    </>
  );
}
