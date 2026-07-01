import { JetskiBookingClientBehavior } from './JetskiBookingClientBehavior';
import { JetskiBookingStructuredData } from './JetskiBookingStructuredData';
import { JetskiBookingStyles } from './JetskiBookingStyles';
import { JetskiBookingFirstTimer } from './components/JetskiBookingFirstTimer';
import { JetskiBookingFormCard } from './components/JetskiBookingFormCard';
import { JetskiBookingShell } from './components/JetskiBookingShell';
import { JetskiBookingStickyMobileBar } from './components/JetskiBookingStickyMobileBar';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';
import type { BookingFlowPanelContent } from '../../lib/site-cms/booking-panels';

type JetskiBookingPageProps = {
  bookingPanel?: BookingFlowPanelContent;
};

export function JetskiBookingPage({ bookingPanel }: JetskiBookingPageProps = {}) {
  return (
    <>
      <JetskiBookingStyles />
      <JetskiBookingStructuredData />
      <JetskiBookingShell>
        <SlaquaticsCmsPublicPageSection slug="jetski-booking" includeTypes={['topbar', 'hero']} />
        <JetskiBookingFirstTimer />
        <div className="content-grid">
          <JetskiBookingFormCard content={bookingPanel} />
        </div>
        <SlaquaticsCmsPublicPageSection slug="jetski-booking" excludeTypes={['topbar', 'hero']} />
      </JetskiBookingShell>
      <JetskiBookingStickyMobileBar />
      <JetskiBookingClientBehavior />
    </>
  );
}
