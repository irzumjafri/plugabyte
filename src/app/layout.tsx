import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import PageViews from '@/components/PageViews';
import Analytics from '@/components/Analytics';
import CookieConsent from '@/components/CookieConsent';
import { Nunito, Space_Grotesk, JetBrains_Mono, Caveat } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['700', '800', '900'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Not in the brand book. The direction comps annotate the artwork in a marker
// hand ("Big ideas. Working parts."), and that aside-in-the-margin voice has no
// equivalent in the three specified faces. Used only for those annotations.
const caveat = Caveat({
  variable: '--font-hand',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const DESCRIPTION =
  "Plugabyte builds the part that stays up. Tell us what you're trying to ship — build type, integration, or a prototype that needs to become production-ready.";

export const metadata: Metadata = {
  // Without metadataBase every canonical and Open Graph URL resolves relative,
  // which means a crawler or a shared link gets a path with no origin.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Plugabyte — the demo was the easy part',
    // Page titles read "Work | Plugabyte" without each page repeating the brand.
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: '/',
    title: 'Plugabyte — the demo was the easy part',
    description: DESCRIPTION,
    images: [{ url: '/scenes/workshop-night.jpg', width: 1672, height: 940, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plugabyte — the demo was the easy part',
    description: DESCRIPTION,
    images: ['/scenes/workshop-night.jpg'],
  },
  robots: { index: true, follow: true },
  // Only emitted when the env var is set, so an unverified environment does not
  // ship an empty verification tag.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

/**
 * Structured data, so search engines can read what this company is and does
 * rather than inferring it from the copy.
 */
const ORGANISATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: SITE_NAME,
  url: SITE_URL,
  email: 'hello@plugabyte.com',
  description: DESCRIPTION,
  serviceType: [
    'Software development',
    'AI systems engineering',
    'Systems integration',
    'Prototype rescue',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${caveat.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // Serialised structured data, not markup: the content is our own
          // constant object, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION_JSONLD) }}
        />
        <PageViews />
        <Analytics />
        <CookieConsent />
        {children}
      </body>
    </html>
  );
}
