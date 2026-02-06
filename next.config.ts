import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => null,
  outputFileTracingIncludes: {
    '*': ['framework-packs/*.json'],
  },
};

export default nextConfig;
