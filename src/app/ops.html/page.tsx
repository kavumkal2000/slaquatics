import type { Metadata } from 'next';
import { OpsPage } from '../../features/ops/OpsPage';

export const metadata: Metadata = {
  title: "Shoreline Aquatics — Operations",
  description: "Shoreline Aquatics Operations — Bookings, CRM, Expenses, Maintenance, Trackers",
  robots: "noindex, nofollow"
};

export default function Page() {
  return <OpsPage />;
}
