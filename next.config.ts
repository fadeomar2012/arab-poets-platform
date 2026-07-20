import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The Cloudinary loader is applied per-image via SmartImage, not globally,
    // so local /images/* assets keep the default optimization pipeline.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  redirects: async () => [
    { source: "/", destination: "/ar", permanent: false },
  ],
};

export default withPayload(nextConfig);
