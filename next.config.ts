import type { NextConfig } from "next";

function clothingPublicEnabled() {
  const v = (
    process.env.NEXT_PUBLIC_CLOTHING_PUBLIC ??
    process.env.CLOTHING_PUBLIC ??
    ""
  )
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.agent.cvm.dev",
    "p-3000-pod-3lnfxh7p2vamxkftm4gfxgkaca-10e28c9aaddc532031ec-us7p.agent.cvm.dev",
  ],
  redirects: async () => {
    if (clothingPublicEnabled()) return [];
    return [
      { source: "/clothing", destination: "/markets", permanent: false },
      {
        source: "/clothing/:path*",
        destination: "/markets",
        permanent: false,
      },
    ];
  },
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
    ],
  },
};

export default nextConfig;
