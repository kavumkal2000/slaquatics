import type { Metadata } from 'next';
import { PrivacyPolicyPage } from '../../features/privacyPolicy/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: "Privacy Policy | Shoreline Aquatics",
  description: "Privacy Policy for Shoreline Aquatics. Learn what information we collect, how we use it, and how to contact us about your data.",
  robots: "index, follow",
  alternates: { canonical: "https://slaquatics.com/privacy-policy/" }
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
