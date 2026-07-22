import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.agent.cvm.dev",
    "p-3000-pod-3lnfxh7p2vamxkftm4gfxgkaca-10e28c9aaddc532031ec-us7p.agent.cvm.dev",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.stockx.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
