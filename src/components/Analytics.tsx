'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useConsent } from '@/lib/consent';

/**
 * Google Analytics 4.
 *
 * Loads only when NEXT_PUBLIC_GA_ID is set *and* the visitor has agreed, so
 * local builds send nothing and no analytics cookie is set before consent.
 * Written by hand rather than pulling in @next/third-parties: this is about
 * fifteen lines and the package would be a dependency for one component.
 *
 * GA4 does not see page changes on its own in the App Router — the layout never
 * remounts between routes, so without the effect below every client-side
 * navigation would be missing and all traffic would appear to land on one page.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const consent = useConsent();
  const firstView = useRef(true);
  const allowed = Boolean(GA_ID) && consent === 'granted';

  useEffect(() => {
    if (!allowed || typeof window.gtag !== 'function') return;
    // The config call below already counts the first page; sending it again
    // here would double every entry view.
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
    });
  }, [pathname, allowed]);

  // Nothing is injected — and so no cookie is set — until both are true.
  if (!allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
