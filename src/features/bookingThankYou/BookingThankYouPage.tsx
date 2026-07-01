import { BookingThankYouClientBehavior } from './BookingThankYouClientBehavior';
import { BookingThankYouStructuredData } from './BookingThankYouStructuredData';
import { BookingThankYouStyles } from './BookingThankYouStyles';
import { BookingThankYouEmptyState } from './components/BookingThankYouEmptyState';
import { BookingThankYouShell } from './components/BookingThankYouShell';
import { BookingThankYouSummary } from './components/BookingThankYouSummary';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function BookingThankYouPage() {
  return (
    <>
      <BookingThankYouStyles />
      <BookingThankYouStructuredData />
      <BookingThankYouShell>
        <SlaquaticsCmsPublicPageSection slug="booking-thank-you" includeTypes={['topbar']} />
        <BookingThankYouEmptyState />
        <div id="thankyou-wrap" hidden>
          <SlaquaticsCmsPublicPageSection slug="booking-thank-you" includeTypes={['hero']} />
          <div className="content-grid">
            <SlaquaticsCmsPublicPageSection slug="booking-thank-you" includeIds={['booking-thank-you-confirmation-copy']} />
            <BookingThankYouSummary />
          </div>
          <div className="content-grid" style={{ marginTop: 24 }}>
            <SlaquaticsCmsPublicPageSection slug="booking-thank-you" includeIds={['booking-thank-you-arrival']} />
            <SlaquaticsCmsPublicPageSection slug="booking-thank-you" includeIds={['booking-thank-you-launch-photo']} />
          </div>
        </div>
        <SlaquaticsCmsPublicPageSection slug="booking-thank-you" excludeTypes={['topbar', 'hero']} excludeIds={['booking-thank-you-confirmation-copy', 'booking-thank-you-arrival', 'booking-thank-you-launch-photo']} />
      </BookingThankYouShell>
      <BookingThankYouClientBehavior />
    </>
  );
}
