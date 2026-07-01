import { HomeClientBehavior } from './HomeClientBehavior';
import { HomeStructuredData } from './HomeStructuredData';
import { HomeStyles } from './HomeStyles';
import { HomeMobileBackdrop } from './components/HomeMobileBackdrop';
import { HomeFleetSection } from './components/HomeFleetSection';
import { HomeBookingCalculator } from './components/HomeBookingCalculator';
import { HomeBackToTop } from './components/HomeBackToTop';
import { SlaquaticsCmsPublicPageSection } from '../siteCms/SlaquaticsCmsPublicPageSection';

export function HomePage() {
  return (
    <>
      <HomeStyles />
      <HomeStructuredData />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-topbar']} />
      <HomeMobileBackdrop />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-mobile-nav']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-hero']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-trust']} />
      <HomeFleetSection />
      <HomeBookingCalculator />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-stripe-catalog']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-addons']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-how']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-why']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-location']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-reviews']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-faq']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-instagram']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-final-cta']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-footer']} />
      <SlaquaticsCmsPublicPageSection slug="home" includeIds={['home-mobile-cta']} />
      <HomeBackToTop />
      <HomeClientBehavior />
    </>
  );
}
