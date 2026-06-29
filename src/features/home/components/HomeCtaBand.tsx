'use client';

import { LAUNCH_ADDRESS, LAUNCH_HOURS } from '../../../lib/launch-info';

export function HomeCtaBand() {
  return (
    <div className="cta-band">
  <h2>Ready to Hit the Water?</h2>
  <p>Book online in seconds or give us a call. We'll take care of everything else.</p>
  <div className="cta-actions">
    <a href="#booking" className="btn-primary">Book Now</a>
    <a href="tel:4696937164" className="btn-ghost">Call (469) 693-7164</a>
  </div>
  <div className="cta-note">{LAUNCH_HOURS} · <a href="tel:4696937164">(469) 693-7164</a> · {LAUNCH_ADDRESS}</div>
</div>
  );
}
