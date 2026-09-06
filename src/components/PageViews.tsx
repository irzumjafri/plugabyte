'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/track';

/**
 * Records a page view for every page, including client-side navigations — the
 * App Router does not remount the layout between routes, so a mount-only effect
 * would only ever see the first page of a visit.
 */
export default function PageViews() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // React runs effects twice in development. Without this the same view is
    // counted twice and every dev figure is quietly doubled.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    trackEvent('page_view', {
      // Where they came from, on the first page of the visit only.
      referrer: document.referrer || undefined,
      title: document.title || undefined,
    });
  }, [pathname]);

  return null;
}
