import type { Metadata } from 'next';
import { HomePage } from '../features/home/HomePage';

export const metadata: Metadata = {
  title: 'Shoreline Aquatics – Jet Ski & Boat Rentals | Lake Lewisville TX',
  description: 'Jet ski & boat rentals at Point Vista Rd, Hickory Creek, TX 75065, United States on Lake Lewisville. Open daily 10 AM-8 PM; book online or call (469) 693-7164.',
  keywords: 'jet ski rental lake lewisville, boat rental lewisville texas, DFW jet ski rental, lake dallas boat rental, lake lewisville jet ski rental',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://slaquatics.com' },
  openGraph: {
    title: 'Shoreline Aquatics — Jet Ski & Boat Rentals | Lake Lewisville TX',
    description: 'Jet ski & boat rentals at Point Vista Rd, Hickory Creek, TX 75065, United States on Lake Lewisville. Open daily 10 AM-8 PM; book online or call (469) 693-7164.',
    type: 'website',
    url: 'https://slaquatics.com'
  },
  twitter: {
    card: 'summary_large_image'
  }
};

export default function Page() {
  return <HomePage />;
}
