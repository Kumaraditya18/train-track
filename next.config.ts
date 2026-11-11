import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Auth + Supabase need request-time rendering */
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  cacheComponents: false,
  poweredByHeader: false,
  compress: true,
  async headers() {
    /* Aggressive static caching breaks Turbopack HMR and shows “old CSS” in dev. */
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/_next/:path*",
          headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
        },
      ];
    }
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/icon.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
