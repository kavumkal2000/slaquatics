import type { Metadata } from 'next';
import { JetSkiRentalDentonPage } from '../../features/jetSkiRentalDenton/JetSkiRentalDentonPage';

export const metadata: Metadata = {
  title: "Jet Ski Rental near Denton, TX | Shoreline Aquatics",
  description: "Looking for a jet ski rental near Denton? Book with Shoreline Aquatics on Lake Lewisville with live availability, easy deposits, life jackets, and a full safety orientation.",
  alternates: { canonical: "https://slaquatics.com/jet-ski-rental-denton/" }
};

export default function Page() {
  return <JetSkiRentalDentonPage />;
}
