import { BookingThankYouClientBehavior } from './BookingThankYouClientBehavior';
import { BookingThankYouStructuredData } from './BookingThankYouStructuredData';
import { BookingThankYouStyles } from './BookingThankYouStyles';
import { BookingThankYouArrival } from './components/BookingThankYouArrival';
import { BookingThankYouConfirmation } from './components/BookingThankYouConfirmation';
import { BookingThankYouEmptyState } from './components/BookingThankYouEmptyState';
import { BookingThankYouHero } from './components/BookingThankYouHero';
import { BookingThankYouLaunchPhoto } from './components/BookingThankYouLaunchPhoto';
import { BookingThankYouShell } from './components/BookingThankYouShell';
import { BookingThankYouSummary } from './components/BookingThankYouSummary';
import { BookingThankYouTopbar } from './components/BookingThankYouTopbar';

export function BookingThankYouPage() {
  return (
    <>
      <BookingThankYouStyles />
      <BookingThankYouStructuredData />
      <BookingThankYouShell>
        <BookingThankYouTopbar />
        <BookingThankYouEmptyState />
        <div id="thankyou-wrap" hidden>
          <BookingThankYouHero />
          <div className="content-grid">
            <BookingThankYouConfirmation />
            <BookingThankYouSummary />
          </div>
          <div className="content-grid" style={{ marginTop: 24 }}>
            <BookingThankYouArrival />
            <BookingThankYouLaunchPhoto />
          </div>
        </div>
      </BookingThankYouShell>
      <BookingThankYouClientBehavior />
    </>
  );
}
