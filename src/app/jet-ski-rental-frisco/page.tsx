import type { Metadata } from 'next';
import { JetSkiRentalFriscoPage } from '../../features/jetSkiRentalFrisco/JetSkiRentalFriscoPage';

export const metadata: Metadata = {
  title: "Jet Ski Rental near Frisco, TX | Shoreline Aquatics",
  description: "Searching for a jet ski rental near Frisco? Shoreline Aquatics on Lake Lewisville shows live availability, first-timer reassurance, and an easy mobile booking flow.",
  alternates: { canonical: "https://slaquatics.com/jet-ski-rental-frisco/" }
};

export default function Page() {
  return <JetSkiRentalFriscoPage />;
}
