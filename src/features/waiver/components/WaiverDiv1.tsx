export function WaiverDiv1() {
  return (
    <div className="shell">
  <div className="topbar">
    <a className="brand" href="../">
      <div className="brand-logo">
        <img src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/681d97126b471ca2569a5463.png" alt="Shoreline Aquatics" />
      </div>
    </a>
    <div className="top-actions">
      <a className="btn btn-ghost" href="../jetski-booking/">Booking</a>
      <a className="btn btn-primary" href="tel:4696937164">Call (469) 693-7164</a>
    </div>
  </div>
  <div className="hero">
    <div className="hero-card">
      <div className="eyebrow">Waiver Terms</div>
      <h1>Complete The Shoreline <span className="accent">Waiver</span></h1>
      <div className="hero-copy">
        Review the waiver terms, sign online, and save your rider details before your rental day.
      </div>
    </div>
  </div>
  <div className="content-grid">
    <div className="form-column">
      <div className="form-card">
        <div className="block-label">Waiver</div>
        <h2>Complete the rider waiver</h2>
        <div className="section-copy">
          Fill this out once so check-in is faster when you arrive at the Shoreline launch.
        </div>
        <form id="waiver-form">
          <div className="form-stack">
            <div className="field-block">
              <div className="block-label">Contact Details</div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="first-name">First name</label>
                  <input id="first-name" name="firstName" type="text" required />
                </div>
                <div className="field">
                  <label htmlFor="last-name">Last name</label>
                  <input id="last-name" name="lastName" type="text" required />
                </div>
                <div className="field">
                  <label htmlFor="phone">Cell phone</label>
                  <input id="phone" name="phone" type="tel" placeholder="Best phone number" required />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" required />
                </div>
                <div className="field full">
                  <label htmlFor="date-of-birth">Date of birth</label>
                  <input id="date-of-birth" name="dateOfBirth" type="date" required />
                </div>
              </div>
            </div>
            <div className="waiver-card">
              <div className="block-label">Signature</div>
              <h3>Review the waiver and sign online</h3>
              <div className="section-copy">
                Use your initials and full legal name exactly as you want them saved on your Shoreline waiver.
              </div>
              <div className="field-grid" style={{marginTop: 18}}>
                <div className="field">
                  <label htmlFor="signature-date">Waiver date</label>
                  <input id="signature-date" name="signatureDate" type="date" required />
                </div>
                <div className="field">
                  <label htmlFor="initials">Participant initials</label>
                  <input id="initials" name="initials" type="text" maxLength={6} required />
                </div>
                <div className="field full">
                  <label htmlFor="signature">Responsible party signature</label>
                  <input id="signature" name="signature" type="text" placeholder="Type full legal name" required />
                </div>
              </div>
              <div className="check-list">
                <div className="check-row">
                  <input id="accepted-agreement" name="acceptedAgreement" type="checkbox" required />
                  <label htmlFor="accepted-agreement">I have read this assumption and acknowledgement of risks and release of liability agreement and I agree with the terms and conditions above.</label>
                </div>
                <div className="check-row">
                  <input id="verified" name="verified" type="checkbox" required />
                  <label htmlFor="verified">I, the responsible party, verify I completed the above information accurately and agree to all Shoreline waiver terms and conditions.</label>
                </div>
              </div>
            </div>
          </div>
          <div className="status" id="waiver-status" />
          <button className="btn btn-primary" type="submit">Save Waiver</button>
          <div className="footer-note">
            Once this waiver is submitted, Shoreline can recognize it during booking and check-in.
          </div>
        </form>
      </div>
      <div className="success-card" id="success-card">
        <div className="block-label">Saved</div>
        <h2>You are all set.</h2>
        <div className="success-copy">
          Your waiver has been submitted successfully. If you still need to reserve a rental date, continue to booking below.
        </div>
        <div className="top-actions" style={{marginTop: 16}}>
          <a className="btn btn-primary" href="../jetski-booking/">Continue to booking</a>
          <a className="btn btn-ghost" href="../">Back to homepage</a>
        </div>
      </div>
    </div>
    <div className="legal-card legal-column" id="terms">
      <div className="block-label">Waiver Terms</div>
      <h2>Assumption And Acknowledgement Of Risks And Release Of Liability</h2>
      <div className="legal-copy">
        <p>I HAVE READ THIS ASSUMPTION AND ACKNOWLEDGEMENT OF RISKS AND RELEASE OF LIABILITY AGREEMENT on the front and back of this contract. I UNDERSTAND THAT BY SIGNING THIS RENTAL CONTRACT, AND IN CONSIDERATION OF MY BEING ABLE TO PARTICIPATE IN, AND USE, THE JET SKIS RENTED BY Shoreline Rentals, I HEREBY RELEASE, WAIVE, AND DISCHARGE Shoreline Rentals LLC, OF ALL VALUABLE LEGAL RIGHTS I MAY HAVE AGAINST ITS OWNER AND GUIDES AND OPERATORS, OR THEIR EMPLOYEES AGENTS, SERVANTS, OR ASSIGNS.</p>
        <p>In consideration, for being allowed by Shoreline Aquatics LLC, to participate in watersport events and activities, and/or being provided with watersport recreational property, equipment or services, for myself and any minor children for whom I am parent, legal guardian or otherwise responsible, and for my/our heirs, personal representatives or assigns, I acknowledge that I have read, understood and agreed with any and all provisions listed throughout this document, as evidenced by my signature and initials below.</p>
      </div>
      <div className="legal-section">
        <div className="mini-kicker">Agreement Summary</div>
        <h3>What you are agreeing to</h3>
        <div className="legal-list">
          <div className="legal-item">
            <div className="legal-index">1</div>
            <div>All watercraft are used at the renter’s and renter’s guests and/or passengers risk.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">2</div>
            <div>
              Acknowledgement of risks. I acknowledge that some, but not all, of the risks of participation on the watersport activity include:
              <ul className="sub-risk-list">
                <li>Changing water flow, tides, currents, wave action, and ships’ wakes.</li>
                <li>Collision with participants, the watercraft, other watercraft, or man-made or natural objects.</li>
                <li>Wind shear, inclement weather, lightning, and extremes of weather or temperature.</li>
                <li>Ability to operate equipment, swim, follow directions, and maintain physical coordination.</li>
                <li>Collision, capsizing, sinking, exposure to the elements, hypothermia, and/or drowning.</li>
                <li>The presence of insects and marine life forms, some of which are poisonous.</li>
                <li>Equipment failure or operator error.</li>
                <li>Sun-related injuries or illness, including sunburn, sunstroke, and dehydration.</li>
                <li>Fatigue, chill, or dizziness that may diminish reaction time and increase the risk of an accident.</li>
              </ul>
            </div>
          </div>
          <div className="legal-item">
            <div className="legal-index">3</div>
            <div>Express assumption of risk and responsibility. I agree to assume responsibility for all risks of the activity, whether identified above or not, even those risks arising out of the negligence of the company named above.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">4</div>
            <div>Release. I release the company, its principals, directors, officers, agents, employees and volunteers, their insurers, and each land owner, municipal agency, or governmental agency upon whose property any activity is conducted, and their insurers, from any and all claims, actions, suits, proceedings, costs, expenses, damages, and liabilities, including attorney’s fees.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">5</div>
            <div>Responsibility. I agree to assume full responsibility for physical damages to the vessel during my time of possession of the vehicle, including cartage expenses, repairs, and downtime where applicable.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">6</div>
            <div>Adherence to rules. I agree to follow all instructions and commands of the company. Failure to comply may result in immediate termination of the rental and forfeiture of monies paid or due. Payments of all fees are due no later than the end of the rental.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">7</div>
            <div><strong>Indemnification.</strong> Renter agrees to indemnify, defend, and hold harmless Shoreline Aquatics LLC, its owners, employees, agents, and affiliates from any claims, lawsuits, damages, losses, expenses, attorney's fees, or liabilities arising from the renter's use of the watercraft, including claims brought by passengers, guests, or third parties.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">8</div>
            <div><strong>Passenger liability.</strong> The renter assumes responsibility for the conduct, safety, and actions of all passengers, guests, and authorized operators and agrees that this waiver applies to all such persons.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">9</div>
            <div><strong>Property damage / card-on-file authorization.</strong> Renter authorizes Shoreline Aquatics LLC to charge the credit card on file for damages, towing, recovery costs, cleaning fees, fuel charges, administrative expenses, and lost rental income resulting from damage.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">10</div>
            <div><strong>Lost revenue / downtime.</strong> Renter shall be liable for loss of rental income during the period the watercraft is unavailable due to damages caused during the rental period.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">11</div>
            <div><strong>Medical treatment authorization.</strong> Shoreline Aquatics LLC may obtain emergency medical treatment for the participant if deemed necessary, and the participant agrees to be responsible for all associated costs.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">12</div>
            <div><strong>No alcohol or drugs.</strong> Operation of any watercraft while under the influence of alcohol, illegal drugs, marijuana, or impairing medications is strictly prohibited and may result in immediate termination without refund.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">13</div>
            <div><strong>Age and swimming ability.</strong> Renter certifies that all operators meet the minimum age requirements and possess adequate swimming ability and physical fitness to safely participate.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">14</div>
            <div><strong>Photo and video release.</strong> Participant grants Shoreline Aquatics LLC permission to use photographs and videos taken during rental activities for promotional and marketing purposes.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">15</div>
            <div><strong>Governing law and venue.</strong> This agreement shall be governed by the laws of the State of Texas. Any dispute shall be brought exclusively in Denton County, Texas.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">16</div>
            <div><strong>Binding arbitration.</strong> Any dispute arising from this agreement shall be resolved through binding arbitration in Denton County, Texas, and the parties waive their right to a jury trial.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">17</div>
            <div><strong>Electronic signature consent.</strong> Electronic signatures shall have the same force and effect as original signatures.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">18</div>
            <div><strong>Acknowledgment of safety briefing.</strong> Renter acknowledges receiving and understanding all safety instructions, operating procedures, emergency procedures, navigation boundaries, and Texas boating laws prior to operation.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">19</div>
            <div><strong>Safety equipment / life-jacket compliance.</strong> Renter acknowledges receipt of all required safety equipment and agrees to wear and properly use such equipment as instructed.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">20</div>
            <div><strong>Recovery and towing costs.</strong> Renter shall be responsible for all towing, retrieval, salvage, recovery, storage, and transportation expenses resulting from operator error, negligence, grounding, collision, or mechanical damage caused during the rental period.</div>
          </div>
          <div className="legal-item">
            <div className="legal-index">21</div>
            <div><strong>Third-party injury protection.</strong> Renter accepts responsibility for injuries, death, or property damage caused to any passenger, guest, swimmer, boater, or third party resulting from renter's operation of the watercraft.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
