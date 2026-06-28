import type { Metadata } from 'next';
import { WaiverPage } from '../../features/waiver/WaiverPage';

export const metadata: Metadata = {
  title: "Waiver Terms | Shoreline Aquatics",
  description: "Review and complete the Shoreline Aquatics waiver online before your rental day.",
  robots: "index, follow",
  alternates: { canonical: "https://slaquatics.com/waiver/" }
};

export default function Page() {
  return <WaiverPage />;
}
