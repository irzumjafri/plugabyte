import type { Metadata } from 'next';
import PageViews from '@/components/PageViews';
import { Nunito, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
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

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Plugabyte — the demo was the easy part',
  description: 'Plugabyte builds the part that stays up. Tell us what you\'re trying to ship — build type, integration, or a prototype that needs to become production-ready.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <PageViews />
        {children}
      </body>
    </html>
  );
}
