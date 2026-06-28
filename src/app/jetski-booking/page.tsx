import type { Metadata } from 'next';
import { JetskiBookingPage } from '../../features/jetskiBooking/JetskiBookingPage';

export const metadata: Metadata = {
  title: "Book a Rental | Shoreline Aquatics",
  description: "See live Shoreline Aquatics availability, choose an open Lake Lewisville rental time, and continue to the contact, waiver, and $55 checkout step.",
  robots: "index, follow",
  alternates: { canonical: "https://slaquatics.com/jetski-booking/" }
};

export default function Page() {
  return <JetskiBookingPage />;
}
