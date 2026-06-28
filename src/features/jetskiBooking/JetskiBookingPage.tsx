import { JetskiBookingClientBehavior } from './JetskiBookingClientBehavior';
import { JetskiBookingStructuredData } from './JetskiBookingStructuredData';
import { JetskiBookingStyles } from './JetskiBookingStyles';
import { JetskiBookingAvailabilitySpotlight } from './components/JetskiBookingAvailabilitySpotlight';
import { JetskiBookingFirstTimer } from './components/JetskiBookingFirstTimer';
import { JetskiBookingFormCard } from './components/JetskiBookingFormCard';
import { JetskiBookingHero } from './components/JetskiBookingHero';
import { JetskiBookingShell } from './components/JetskiBookingShell';
import { JetskiBookingStickyMobileBar } from './components/JetskiBookingStickyMobileBar';
import { JetskiBookingTopbar } from './components/JetskiBookingTopbar';

export function JetskiBookingPage() {
  return (
    <>
      <JetskiBookingStyles />
      <JetskiBookingStructuredData />
      <JetskiBookingShell>
        <JetskiBookingTopbar />
        <JetskiBookingHero />
        <JetskiBookingAvailabilitySpotlight />
        <JetskiBookingFirstTimer />
        <div className="content-grid">
          <JetskiBookingFormCard />
        </div>
      </JetskiBookingShell>
      <JetskiBookingStickyMobileBar />
      <JetskiBookingClientBehavior />
    </>
  );
}
