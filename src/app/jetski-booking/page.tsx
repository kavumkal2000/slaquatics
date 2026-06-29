import type { Metadata } from 'next';
import { JetskiBookingPage } from '../../features/jetskiBooking/JetskiBookingPage';

export const metadata: Metadata = {
  title: "Book a Rental | Shoreline Aquatics",
  description: "See live Shoreline Aquatics availability at Point Vista Rd, Hickory Creek, TX 75065. Choose a 10 AM-8 PM Lake Lewisville rental time and continue to contact, waiver, and checkout.",
  robots: "index, follow",
  alternates: { canonical: "https://slaquatics.com/jetski-booking/" }
};

export default function Page() {
  return <JetskiBookingPage />;
}
