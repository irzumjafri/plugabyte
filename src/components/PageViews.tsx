'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/track';
import { getAttribution } from '@/lib/attribution';

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

    const attribution = getAttribution();

    trackEvent('page_view', {
      referrer: document.referrer || undefined,
      title: document.title || undefined,
      // Carried on every view, not just the first, so any page can be traced
      // back to the search or campaign that started the visit.
      channel: attribution?.channel,
      source: attribution?.source,
      campaign: attribution?.campaign,
      landing: attribution?.landing,
    });
  }, [pathname]);

  return null;
}
