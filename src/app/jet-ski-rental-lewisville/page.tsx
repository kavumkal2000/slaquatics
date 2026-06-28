import type { Metadata } from 'next';
import { JetSkiRentalLewisvillePage } from '../../features/jetSkiRentalLewisville/JetSkiRentalLewisvillePage';

export const metadata: Metadata = {
  title: "Jet Ski Rental near Lewisville, TX | Shoreline Aquatics",
  description: "Need a jet ski rental near Lewisville? Shoreline Aquatics offers live Lake Lewisville availability, a quick booking flow, and a first-timer-friendly launch experience.",
  alternates: { canonical: "https://slaquatics.com/jet-ski-rental-lewisville/" }
};

export default function Page() {
  return <JetSkiRentalLewisvillePage />;
}
