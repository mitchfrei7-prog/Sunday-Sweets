import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Bake photos are downscaled client-side before upload, but leave headroom
    // above the 1MB default so a large downscaled JPEG still gets through.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
