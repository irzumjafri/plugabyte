/**
 * Canonical origin for the deployed site.
 *
 * Search Console, sitemaps, canonical URLs and Open Graph images all need an
 * absolute origin, and relative URLs silently become useless the moment a page
 * is crawled or shared. Set NEXT_PUBLIC_SITE_URL per environment; the fallback
 * keeps local builds working without pretending a preview is production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plugabyte.com'
).replace(/\/$/, '');

export const SITE_NAME = 'Plugabyte';

/** Pages that should be crawled, indexed and listed in the sitemap. */
export const PUBLIC_ROUTES = ['/', '/work', '/rescue', '/about'] as const;

export function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
