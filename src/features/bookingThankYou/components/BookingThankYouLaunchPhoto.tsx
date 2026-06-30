import { mediaUrl } from '../../../lib/media';

export function BookingThankYouLaunchPhoto() {
  return (
    <div className="card media-card">
      <div className="hero-photo" style={{ minHeight: 260 }}>
        <img src={mediaUrl('site/images/shoreline-jetski-shoreline-guests.webp')} alt="Shoreline Aquatics customer moments" />
      </div>
      <p>Shoreline will meet you at the launch, walk you through the basics, and get your group on the water fast.</p>
    </div>
  );
}
