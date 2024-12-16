import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
};

export default nextConfig;
