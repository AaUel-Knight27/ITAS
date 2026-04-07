import type { NextConfig } from "next";

const emptyShim = "./src/shims/empty.ts";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
