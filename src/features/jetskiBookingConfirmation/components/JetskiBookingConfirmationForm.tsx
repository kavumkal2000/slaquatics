import { defaultWaiverPaymentSummaryContent, type WaiverPaymentSummaryContent } from '../../../lib/site-cms/booking-panels';
import { safeCmsUrl } from '../../../lib/cms/validation';

type JetskiBookingConfirmationFormProps = {
  content?: WaiverPaymentSummaryContent;
};

export function JetskiBookingConfirmationForm({ content = defaultWaiverPaymentSummaryContent }: JetskiBookingConfirmationFormProps) {
  return (
    <div className="form-card">
      <div className="block-label">{content.kicker}</div>
      <h2>{content.heading}</h2>
      <div className="section-copy">
        {content.copy}
      </div>
      <div className="match-card" id="match-card">
        <div className="mini-kicker">{content.returningKicker}</div>
        <h2 id="match-title">{content.returningTitle}</h2>
        <div className="match-copy" id="match-copy">{content.returningCopy}</div>
        <div className="match-chip-row" id="match-chips" />
      </div>
      <form id="waiver-payment-form">
        <div className="form-stack">
          <div className="field-block">
            <div className="block-label">{content.contactLabel}</div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="name">Customer name</label>
                <input id="name" name="name" type="text" placeholder="First and last name" required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" placeholder="Best phone number" required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="name@example.com" />
              </div>
              <div className="field">
                <label htmlFor="date-of-birth">Date of birth</label>
                <input id="date-of-birth" name="dateOfBirth" type="date" required />
              </div>
              <div className="field">
                <label htmlFor="party-size">Party size</label>
                <input id="party-size" name="partySize" type="number" min={1} max={20} defaultValue={2} />
              </div>
              <div className="field full">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" placeholder="Anything Shoreline should know about timing, riders, or special requests?" defaultValue={""} />
              </div>
            </div>
          </div>
          <div className="waiver-card">
            <div className="block-label">{content.waiverLabel}</div>
            <h3>{content.waiverHeading}</h3>
            <div className="section-copy">
              {content.waiverCopy}
            </div>
            <a className="waiver-link" href={safeCmsUrl(content.waiverTermsHref) || '../waiver/?view=terms#terms'} target="_blank" rel="noreferrer">{content.waiverTermsLabel}</a>
            <div className="legal-box">
              <div className="mini-kicker">{content.agreementKicker}</div>
              <div className="legal-list">
                {content.legalItems.map((item, index) => (
                  <div className="legal-item" key={item}><div className="legal-dot">{index + 1}</div><div>{item}</div></div>
                ))}
              </div>
            </div>
            <div className="check-list">
              <div className="check-row">
                <input id="waiver-risk" name="waiverRisk" type="checkbox" required />
                <label htmlFor="waiver-risk">I understand the risks of boating and personal watercraft activity and agree to follow Shoreline’s operating and safety instructions.</label>
              </div>
              <div className="check-row">
                <input id="waiver-damage" name="waiverDamage" type="checkbox" required />
                <label htmlFor="waiver-damage">I understand Shoreline may document equipment condition before and after the rental.</label>
              </div>
              <div className="check-row">
                <input id="waiver-verify" name="waiverVerify" type="checkbox" required />
                <label htmlFor="waiver-verify">I verify I completed the above information accurately and agree to all Shoreline waiver terms and conditions.</label>
              </div>
            </div>
            <div className="field-grid" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="waiver-initials">Participant initials</label>
                <input id="waiver-initials" name="waiverInitials" type="text" maxLength={6} placeholder="Initial here" required />
              </div>
              <div className="field">
                <label htmlFor="signature">Digital signature</label>
                <input id="signature" name="signature" type="text" placeholder="Type full legal name" required />
              </div>
              <div className="field">
                <label htmlFor="signature-date">Waiver date</label>
                <input id="signature-date" name="signatureDate" type="date" required />
              </div>
            </div>
          </div>
        </div>
        <div className="payment-note">
          <strong>{content.paymentStrong}</strong> {content.paymentCopy}
        </div>
        <div className="status" id="copy-status">{content.statusCopy}</div>
        <div className="actions">
          <button className="btn btn-primary" id="stripe-link" type="submit">{content.submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
