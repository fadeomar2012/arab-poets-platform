import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    {
      source: "/",
      destination: "/ar",
      permanent: false,
    },
  ],
};

export default nextConfig;
