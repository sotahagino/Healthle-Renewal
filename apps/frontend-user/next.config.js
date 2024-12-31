/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['kqhjzzyaoehlmeileaii.supabase.co']
  },
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRBailout: false
  }
};

module.exports = nextConfig; 