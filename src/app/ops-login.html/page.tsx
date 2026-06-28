import type { Metadata } from 'next';
import { OpsLoginPage } from '../../features/opsLogin/OpsLoginPage';

export const metadata: Metadata = {
  title: "Shoreline Ops Login",
  robots: "noindex, nofollow"
};

export default function Page() {
  return <OpsLoginPage />;
}
