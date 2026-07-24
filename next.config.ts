import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cursor cloud / agent preview hosts during local `next dev`.
  allowedDevOrigins: ["*.agent.cvm.dev"],
  redirects: async () => [
    { source: "/mine", destination: "/collection", permanent: true },
    {
      source: "/portfolio",
      destination: "/collection/portfolio",
      permanent: true,
    },
    {
      source: "/wardrobe",
      destination: "/collection/wardrobe",
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
    {
      source: "/manifest.webmanifest",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    },
    {
      source: "/og.png",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "Content-Type", value: "image/png" },
      ],
    },
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
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
};

export default nextConfig;
