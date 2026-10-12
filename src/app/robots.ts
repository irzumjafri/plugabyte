import type { MetadataRoute } from 'next';
import { absolute } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /shot-rig is the internal render harness and /api answers machines —
      // both would otherwise be crawled and indexed as if they were pages.
      disallow: ['/api/', '/shot-rig'],
    },
    sitemap: absolute('/sitemap.xml'),
    host: absolute(''),
  };
}
