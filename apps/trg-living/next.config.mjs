/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 1. Existing Cloud Supabase Pattern
      {
        protocol: 'https',
        hostname: 'edhlkknvlczhbowasjna.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // 2. NEW: Appfolio CDN for Listings
      {
        protocol: 'https',
        hostname: 'listings.cdn.appfolio.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// SECURITY OVERRIDE: Local development injection
if (process.env.LOCAL_SUPABASE_HOSTNAME) {
  nextConfig.images.remotePatterns.push({
    protocol: 'http',
    hostname: process.env.LOCAL_SUPABASE_HOSTNAME,
    port: '54321',
    pathname: '/storage/v1/object/public/**',
  });
}

export default nextConfig;