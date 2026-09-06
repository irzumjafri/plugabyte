import { ConvexHttpClient } from 'convex/browser';

let client: ConvexHttpClient | null = null;

/**
 * Server-side Convex client. Lazily created so `next build` does not need a
 * running backend just to collect page data.
 */
export function getConvex(): ConvexHttpClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('Convex is not configured — set NEXT_PUBLIC_CONVEX_URL');
  client = new ConvexHttpClient(url);
  return client;
}
