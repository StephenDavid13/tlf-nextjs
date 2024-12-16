import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          fs: false,
          net: false,
          dns: false,
          tls: false,
          assert: false,
          process: false
        }
      };
    }
    return config;
  },
};

export default nextConfig;
