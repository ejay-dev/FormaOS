import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => null,
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // Mobile-specific optimizations
  experimental: {
    optimizeCss: true,
  },
  // Ensure compatibility with Capacitor
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;