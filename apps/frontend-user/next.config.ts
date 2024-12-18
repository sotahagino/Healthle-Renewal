import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: ['kqhjzzyaoehlmeileaii.supabase.co']
  },
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
};

export default nextConfig;
