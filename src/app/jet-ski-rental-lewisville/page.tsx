import type { Metadata } from 'next';
import { JetSkiRentalLewisvillePage } from '../../features/jetSkiRentalLewisville/JetSkiRentalLewisvillePage';

export const metadata: Metadata = {
  title: "Jet Ski Rental near Lewisville, TX | Shoreline Aquatics",
  description: "Need a jet ski rental near Lewisville? Book Shoreline Aquatics at Point Vista Rd, Hickory Creek, TX 75065, United States on Lake Lewisville, open daily 10 AM-8 PM.",
  alternates: { canonical: "https://slaquatics.com/jet-ski-rental-lewisville/" }
};

export default function Page() {
  return <JetSkiRentalLewisvillePage />;
}
