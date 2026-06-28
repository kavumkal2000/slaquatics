import type { Metadata } from 'next';
import { BookingThankYouPage } from '../../features/bookingThankYou/BookingThankYouPage';

export const metadata: Metadata = {
  title: "Thanks For Booking | Shoreline Aquatics",
  description: "Thanks for booking with Shoreline Aquatics. Review your arrival instructions and next steps here.",
  robots: "index, follow",
  alternates: { canonical: "https://slaquatics.com/booking-thank-you/" }
};

export default function Page() {
  return <BookingThankYouPage />;
}
