/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['kqhjzzyaoehlmeileaii.supabase.co']
  },
  output: 'standalone',
  experimental: {
    // missingSuspenseWithCSRBailoutオプションを削除
  }
};

module.exports = nextConfig; 