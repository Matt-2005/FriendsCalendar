import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Un onglet déjà visité se rouvre instantanément pendant 30 s (puis se met à jour)
    staleTimes: { dynamic: 30, static: 180 },
  },
  async redirects() {
    return [{ source: "/my-events", destination: "/events?f=mine", permanent: false }];
  },
  async headers() {
    return [
      {
        // Le service worker doit toujours être à jour
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
