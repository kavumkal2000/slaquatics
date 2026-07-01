import type { Metadata } from 'next';
import { JetskiBookingPage } from '../../features/jetskiBooking/JetskiBookingPage';
import { bookingFlowPanelFromCms } from '../../lib/site-cms/booking-panels';
import { loadSlaquaticsCmsContent } from '../../lib/site-cms/slaquatics';

export const metadata: Metadata = {
  title: "Book a Rental | Shoreline Aquatics",
  description: "See live Shoreline Aquatics availability at Point Vista Rd, Hickory Creek, TX 75065, United States. Choose a 10 AM-8 PM Lake Lewisville rental time and continue to contact, waiver, and checkout.",
  robots: "index, follow",
  alternates: { canonical: "https://slaquatics.com/jetski-booking/" }
};

export default async function Page() {
  const cmsContent = await loadSlaquaticsCmsContent('jetski-booking');
  return <JetskiBookingPage bookingPanel={bookingFlowPanelFromCms(cmsContent)} />;
}
