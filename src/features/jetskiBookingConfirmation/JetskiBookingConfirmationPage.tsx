import { JetskiBookingConfirmationClientBehavior } from './JetskiBookingConfirmationClientBehavior';
import { JetskiBookingConfirmationStructuredData } from './JetskiBookingConfirmationStructuredData';
import { JetskiBookingConfirmationStyles } from './JetskiBookingConfirmationStyles';
import { JetskiBookingConfirmationEmptyState } from './components/JetskiBookingConfirmationEmptyState';
import { JetskiBookingConfirmationForm } from './components/JetskiBookingConfirmationForm';
import { JetskiBookingConfirmationHero } from './components/JetskiBookingConfirmationHero';
import { JetskiBookingConfirmationShell } from './components/JetskiBookingConfirmationShell';
import { JetskiBookingConfirmationSummary } from './components/JetskiBookingConfirmationSummary';
import { JetskiBookingConfirmationTopbar } from './components/JetskiBookingConfirmationTopbar';

export function JetskiBookingConfirmationPage() {
  return (
    <>
      <JetskiBookingConfirmationStyles />
      <JetskiBookingConfirmationStructuredData />
      <JetskiBookingConfirmationShell>
        <JetskiBookingConfirmationTopbar />
        <JetskiBookingConfirmationHero />
        <JetskiBookingConfirmationEmptyState />
        <div className="content-grid" id="request-wrap" hidden>
          <JetskiBookingConfirmationForm />
          <JetskiBookingConfirmationSummary />
        </div>
      </JetskiBookingConfirmationShell>
      <JetskiBookingConfirmationClientBehavior />
    </>
  );
}
