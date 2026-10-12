import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP as the fallback. The scene plates are photographic and
    // sit behind scrims, which is exactly where AVIF's advantage is largest and
    // its artefacts least visible. PageSpeed flagged ~58 KiB of image savings.
    formats: ["image/avif", "image/webp"],
    // The plates top out at 1808px wide, so the default 2048 and 3840 buckets
    // can never return more detail — they only add cache entries to generate.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
  },
};

export default nextConfig;
