import { ARRIVAL_DIRECTIONS, LAUNCH_ADDRESS, LAUNCH_ADDRESS_LINES } from '../../../lib/launch-info';

export function BookingThankYouArrival() {
  return (
    <div className="card">
      <div className="block-label">Point Vista Park Directions</div>
      <h2>Shoreline Aquatics launch</h2>
      <div className="arrival-copy">The launch meeting spot is at <strong style={{ color: 'var(--ink)' }}>{LAUNCH_ADDRESS}</strong>. Use the directions below once you arrive near the park entrance.</div>
      <div className="address-card">
        <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: 6 }}>Use this address</strong>
        {LAUNCH_ADDRESS_LINES.map((line) => <span style={{ display: 'block' }} key={line}>{line}</span>)}
      </div>
      <div className="arrival-list">
        {ARRIVAL_DIRECTIONS.map((step, index) => <div className="arrival-item" key={step}>{index + 1}. {step}</div>)}
      </div>
      <div className="top-actions" style={{ marginTop: 18 }}>
        <a className="btn btn-primary" href="tel:4696937164">Call Shoreline</a>
        <a className="btn btn-ghost" id="sms-link" href="#">Text Shoreline</a>
      </div>
    </div>
  );
}
