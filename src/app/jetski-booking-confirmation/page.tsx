import type { Metadata } from 'next';
import { JetskiBookingConfirmationPage } from '../../features/jetskiBookingConfirmation/JetskiBookingConfirmationPage';
import { waiverPaymentSummaryFromCms } from '../../lib/site-cms/booking-panels';
import { loadSlaquaticsCmsContent } from '../../lib/site-cms/slaquatics';

export const metadata: Metadata = {
  title: "Contact, Waiver & Deposit | Shoreline Aquatics",
  description: "Complete the Shoreline Aquatics waiver, review your rental details, and pay $55 today. That includes a $50 booking deposit and a $5 processing fee.",
  robots: "index, follow",
  alternates: { canonical: "https://slaquatics.com/jetski-booking-confirmation/" }
};

export default async function Page() {
  const cmsContent = await loadSlaquaticsCmsContent('jetski-booking-confirmation');
  return <JetskiBookingConfirmationPage waiverPaymentSummary={waiverPaymentSummaryFromCms(cmsContent)} />;
}
