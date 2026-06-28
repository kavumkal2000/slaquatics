import type { ReactNode } from 'react';

type LegalItem = {
  label?: ReactNode;
  body: ReactNode;
};

const riskItems = [
  'Changing water flow, tides, currents, wave action, and ships’ wakes.',
  'Collision with participants, the watercraft, other watercraft, or man-made or natural objects.',
  'Wind shear, inclement weather, lightning, and extremes of weather or temperature.',
  'Ability to operate equipment, swim, follow directions, and maintain physical coordination.',
  'Collision, capsizing, sinking, exposure to the elements, hypothermia, and/or drowning.',
  'The presence of insects and marine life forms, some of which are poisonous.',
  'Equipment failure or operator error.',
  'Sun-related injuries or illness, including sunburn, sunstroke, and dehydration.',
  'Fatigue, chill, or dizziness that may diminish reaction time and increase the risk of an accident.'
];

const legalItems: LegalItem[] = [
  {
    body: 'All watercraft are used at the renter’s and renter’s guests and/or passengers risk.'
  },
  {
    body: (
      <>
        Acknowledgement of risks. I acknowledge that some, but not all, of the risks of participation on the watersport activity include:
        <ul className="sub-risk-list">
          {riskItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </>
    )
  },
  {
    body: 'Express assumption of risk and responsibility. I agree to assume responsibility for all risks of the activity, whether identified above or not, even those risks arising out of the negligence of the company named above.'
  },
  {
    body: 'Release. I release the company, its principals, directors, officers, agents, employees and volunteers, their insurers, and each land owner, municipal agency, or governmental agency upon whose property any activity is conducted, and their insurers, from any and all claims, actions, suits, proceedings, costs, expenses, damages, and liabilities, including attorney’s fees.'
  },
  {
    body: 'Responsibility. I agree to assume full responsibility for physical damages to the vessel during my time of possession of the vehicle, including cartage expenses, repairs, and downtime where applicable.'
  },
  {
    body: 'Adherence to rules. I agree to follow all instructions and commands of the company. Failure to comply may result in immediate termination of the rental and forfeiture of monies paid or due. Payments of all fees are due no later than the end of the rental.'
  },
  {
    label: 'Indemnification.',
    body: "Renter agrees to indemnify, defend, and hold harmless Shoreline Aquatics LLC, its owners, employees, agents, and affiliates from any claims, lawsuits, damages, losses, expenses, attorney's fees, or liabilities arising from the renter's use of the watercraft, including claims brought by passengers, guests, or third parties."
  },
  {
    label: 'Passenger liability.',
    body: 'The renter assumes responsibility for the conduct, safety, and actions of all passengers, guests, and authorized operators and agrees that this waiver applies to all such persons.'
  },
  {
    label: 'Property damage / card-on-file authorization.',
    body: 'Renter authorizes Shoreline Aquatics LLC to charge the credit card on file for damages, towing, recovery costs, cleaning fees, fuel charges, administrative expenses, and lost rental income resulting from damage.'
  },
  {
    label: 'Lost revenue / downtime.',
    body: 'Renter shall be liable for loss of rental income during the period the watercraft is unavailable due to damages caused during the rental period.'
  },
  {
    label: 'Medical treatment authorization.',
    body: 'Shoreline Aquatics LLC may obtain emergency medical treatment for the participant if deemed necessary, and the participant agrees to be responsible for all associated costs.'
  },
  {
    label: 'No alcohol or drugs.',
    body: 'Operation of any watercraft while under the influence of alcohol, illegal drugs, marijuana, or impairing medications is strictly prohibited and may result in immediate termination without refund.'
  },
  {
    label: 'Age and swimming ability.',
    body: 'Renter certifies that all operators meet the minimum age requirements and possess adequate swimming ability and physical fitness to safely participate.'
  },
  {
    label: 'Photo and video release.',
    body: 'Participant grants Shoreline Aquatics LLC permission to use photographs and videos taken during rental activities for promotional and marketing purposes.'
  },
  {
    label: 'Governing law and venue.',
    body: 'This agreement shall be governed by the laws of the State of Texas. Any dispute shall be brought exclusively in Denton County, Texas.'
  },
  {
    label: 'Binding arbitration.',
    body: 'Any dispute arising from this agreement shall be resolved through binding arbitration in Denton County, Texas, and the parties waive their right to a jury trial.'
  },
  {
    label: 'Electronic signature consent.',
    body: 'Electronic signatures shall have the same force and effect as original signatures.'
  },
  {
    label: 'Acknowledgment of safety briefing.',
    body: 'Renter acknowledges receiving and understanding all safety instructions, operating procedures, emergency procedures, navigation boundaries, and Texas boating laws prior to operation.'
  },
  {
    label: 'Safety equipment / life-jacket compliance.',
    body: 'Renter acknowledges receipt of all required safety equipment and agrees to wear and properly use such equipment as instructed.'
  },
  {
    label: 'Recovery and towing costs.',
    body: 'Renter shall be responsible for all towing, retrieval, salvage, recovery, storage, and transportation expenses resulting from operator error, negligence, grounding, collision, or mechanical damage caused during the rental period.'
  },
  {
    label: 'Third-party injury protection.',
    body: "Renter accepts responsibility for injuries, death, or property damage caused to any passenger, guest, swimmer, boater, or third party resulting from renter's operation of the watercraft."
  }
];

export function WaiverTerms() {
  return (
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
          {legalItems.map((item, index) => (
            <div className="legal-item" key={index + 1}>
              <div className="legal-index">{index + 1}</div>
              <div>{item.label ? <><strong>{item.label}</strong> {item.body}</> : item.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
