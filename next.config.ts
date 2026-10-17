import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/groups", destination: "/sections", permanent: true },
      { source: "/sermons/manage", destination: "/admin", permanent: true },
    ];
  },
  images: {
    formats: ["image/webp"],
  },
};

export default nextConfig;
