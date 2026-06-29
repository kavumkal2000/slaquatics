import { ARRIVAL_DIRECTIONS, LAUNCH_ADDRESS } from '../../../lib/launch-info';

export function BookingThankYouArrival() {
  return (
    <div className="card">
      <div className="block-label">Arrival Directions</div>
      <h2>Shoreline Aquatics launch</h2>
      <div className="arrival-copy">The launch meeting spot is at <strong style={{ color: 'var(--ink)' }}>{LAUNCH_ADDRESS}</strong>. Use the directions below once you arrive near the park entrance.</div>
      <div className="address-card">
        <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: 6 }}>Address</strong>
        {LAUNCH_ADDRESS}
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
