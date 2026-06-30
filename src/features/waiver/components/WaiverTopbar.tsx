import { media } from '../../../lib/media';

export function WaiverTopbar() {
  return (
    <div className="topbar">
      <a className="brand" href="../">
        <div className="brand-logo">
          <img src={media.logo} alt="Shoreline Aquatics" />
        </div>
      </a>
      <div className="top-actions">
        <a className="btn btn-ghost" href="../jetski-booking/">Booking</a>
        <a className="btn btn-primary" href="tel:4696937164">Call (469) 693-7164</a>
      </div>
    </div>
  );
}
