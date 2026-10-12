import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTES, absolute } from '@/lib/site';

/** Served at /sitemap.xml — this is what you hand Search Console. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map(route => ({
    url: absolute(route),
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    // The homepage is the entry point; the rest are equal to each other.
    priority: route === '/' ? 1 : 0.8,
  }));
}
