import { CityRentalPage, cityRentalPages } from '../cityRental/cityRentalContent';
import { JetSkiRentalDentonClientBehavior } from './JetSkiRentalDentonClientBehavior';
import { JetSkiRentalDentonStructuredData } from './JetSkiRentalDentonStructuredData';
import { JetSkiRentalDentonStyles } from './JetSkiRentalDentonStyles';

export function JetSkiRentalDentonPage() {
  return (
    <>
      <JetSkiRentalDentonStyles />
      <JetSkiRentalDentonStructuredData />
      <CityRentalPage content={cityRentalPages.denton} />
      <JetSkiRentalDentonClientBehavior />
    </>
  );
}
