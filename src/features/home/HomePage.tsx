import { HomeClientBehavior } from './HomeClientBehavior';
import { HomeStructuredData } from './HomeStructuredData';
import { HomeStyles } from './HomeStyles';
import { HomeNav } from './components/HomeNav';
import { HomeMobileBackdrop } from './components/HomeMobileBackdrop';
import { HomeMobileNav } from './components/HomeMobileNav';
import { HomeHero } from './components/HomeHero';
import { HomeTrustBar } from './components/HomeTrustBar';
import { HomeFleetSection } from './components/HomeFleetSection';
import { HomeBookingCalculator } from './components/HomeBookingCalculator';
import { HomeAddOnsSection } from './components/HomeAddOnsSection';
import { HomeHowSection } from './components/HomeHowSection';
import { HomeWhySection } from './components/HomeWhySection';
import { HomeLocationSection } from './components/HomeLocationSection';
import { HomeFaqSection } from './components/HomeFaqSection';
import { HomeReviewsSection } from './components/HomeReviewsSection';
import { HomeInstagramSection } from './components/HomeInstagramSection';
import { HomeNotifySection } from './components/HomeNotifySection';
import { HomeCtaBand } from './components/HomeCtaBand';
import { HomeFooter } from './components/HomeFooter';
import { HomeMobileCtaBar } from './components/HomeMobileCtaBar';
import { HomeBackToTop } from './components/HomeBackToTop';

export function HomePage() {
  return (
    <>
      <HomeStyles />
      <HomeStructuredData />
      <HomeNav />
      <HomeMobileBackdrop />
      <HomeMobileNav />
      <HomeHero />
      <HomeTrustBar />
      <HomeFleetSection />
      <HomeBookingCalculator />
      <HomeAddOnsSection />
      <HomeHowSection />
      <HomeWhySection />
      <HomeLocationSection />
      <HomeReviewsSection />
      <HomeFaqSection />
      <HomeInstagramSection />
      <HomeNotifySection />
      <HomeCtaBand />
      <HomeFooter />
      <HomeMobileCtaBar />
      <HomeBackToTop />
      <HomeClientBehavior />
    </>
  );
}
