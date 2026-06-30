import type { Metadata } from 'next';
import { JetSkiRentalFriscoPage } from '../../features/jetSkiRentalFrisco/JetSkiRentalFriscoPage';

export const metadata: Metadata = {
  title: "Jet Ski Rental near Frisco, TX | Shoreline Aquatics",
  description: "Searching for a jet ski rental near Frisco? Book Shoreline Aquatics at Point Vista Rd, Hickory Creek, TX 75065, United States on Lake Lewisville, open daily 10 AM-8 PM.",
  alternates: { canonical: "https://slaquatics.com/jet-ski-rental-frisco/" }
};

export default function Page() {
  return <JetSkiRentalFriscoPage />;
}
