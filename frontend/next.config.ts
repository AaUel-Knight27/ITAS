import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.railway.app",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
