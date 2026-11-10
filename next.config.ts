import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Auth + Supabase need request-time rendering */
  cacheComponents: false,
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
