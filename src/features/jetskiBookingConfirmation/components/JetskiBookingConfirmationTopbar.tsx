import { media } from '../../../lib/media';

export function JetskiBookingConfirmationTopbar() {
  return (
    <div className="topbar">
      <a className="brand" href="../">
        <div className="brand-logo">
          <img src={media.logo} alt="Shoreline Aquatics" />
        </div>
      </a>
      <div className="top-actions">
        <a className="btn btn-ghost" id="back-to-calendar-link" href="../jetski-booking/">Back To Calendar</a>
        <a className="btn btn-primary" href="tel:4696937164">Call (469) 693-7164</a>
      </div>
    </div>
  );
}
