import type { NextConfig } from "next";

const emptyShim = "./src/shims/empty.ts";

const nextConfig: NextConfig = {
  // Enable standalone output for production
  output: "standalone",
  // Compress responses
  compress: true,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  webpack: (config: { resolve: { alias: Record<string, false | string> } }) => {
    config.resolve.alias.canvas = emptyShim;
    config.resolve.alias.encoding = emptyShim;
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: emptyShim,
      encoding: emptyShim,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.railway.app",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
