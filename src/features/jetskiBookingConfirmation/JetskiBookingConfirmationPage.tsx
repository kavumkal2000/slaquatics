import { JetskiBookingConfirmationClientBehavior } from './JetskiBookingConfirmationClientBehavior';
import { JetskiBookingConfirmationStructuredData } from './JetskiBookingConfirmationStructuredData';
import { JetskiBookingConfirmationStyles } from './JetskiBookingConfirmationStyles';
import { JetskiBookingConfirmationEmptyState } from './components/JetskiBookingConfirmationEmptyState';
import { JetskiBookingConfirmationForm } from './components/JetskiBookingConfirmationForm';
import { JetskiBookingConfirmationShell } from './components/JetskiBookingConfirmationShell';
import { JetskiBookingConfirmationSummary } from './components/JetskiBookingConfirmationSummary';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';
import type { WaiverPaymentSummaryContent } from '../../lib/site-cms/booking-panels';

type JetskiBookingConfirmationPageProps = {
  waiverPaymentSummary?: WaiverPaymentSummaryContent;
};

export function JetskiBookingConfirmationPage({ waiverPaymentSummary }: JetskiBookingConfirmationPageProps = {}) {
  return (
    <>
      <JetskiBookingConfirmationStyles />
      <JetskiBookingConfirmationStructuredData />
      <JetskiBookingConfirmationShell>
        <SlaquaticsCmsPublicPageSection slug="jetski-booking-confirmation" includeTypes={['topbar', 'hero']} />
        <JetskiBookingConfirmationEmptyState />
        <div className="content-grid" id="request-wrap" hidden>
          <JetskiBookingConfirmationForm content={waiverPaymentSummary} />
          <JetskiBookingConfirmationSummary />
        </div>
        <SlaquaticsCmsPublicPageSection slug="jetski-booking-confirmation" excludeTypes={['topbar', 'hero']} />
      </JetskiBookingConfirmationShell>
      <JetskiBookingConfirmationClientBehavior />
    </>
  );
}
