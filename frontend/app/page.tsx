import { Cormorant } from 'next/font/google';
import { LandingHeader } from './_components/landing-header';
import { LandingHero } from './_components/landing-hero';
import { LandingAbout } from './_components/landing-about';
import { LandingServices } from './_components/landing-services';
import { LandingHowItWorks } from './_components/landing-how-it-works';
import { LandingContact } from './_components/landing-contact';
import { LandingFooter } from './_components/landing-footer';

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
});

export default function LandingPage() {
  return (
    <div className={`${cormorant.variable} overflow-x-hidden`}>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingAbout />
        <LandingServices />
        <LandingHowItWorks />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}
