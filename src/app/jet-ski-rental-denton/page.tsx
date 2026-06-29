import type { Metadata } from 'next';
import { JetSkiRentalDentonPage } from '../../features/jetSkiRentalDenton/JetSkiRentalDentonPage';

export const metadata: Metadata = {
  title: "Jet Ski Rental near Denton, TX | Shoreline Aquatics",
  description: "Looking for a jet ski rental near Denton? Book Shoreline Aquatics at Point Vista Rd, Hickory Creek, TX 75065 on Lake Lewisville, open daily 10 AM-8 PM.",
  alternates: { canonical: "https://slaquatics.com/jet-ski-rental-denton/" }
};

export default function Page() {
  return <JetSkiRentalDentonPage />;
}
