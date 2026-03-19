/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 1. Cloud Supabase
      {
        protocol: 'https',
        hostname: 'edhlkknvlczhbowasjna.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // 2. Appfolio Listing CDN (UI/Placeholders)
      {
        protocol: 'https',
        hostname: 'listings.cdn.appfolio.com',
        port: '',
        pathname: '/**',
      },
      // 3. NEW: Appfolio Property Image CDN (Real Photos)
      {
        protocol: 'https',
        hostname: 'images.cdn.appfolio.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// SECURITY OVERRIDE: Local development
if (process.env.LOCAL_SUPABASE_HOSTNAME) {
  nextConfig.images.remotePatterns.push({
    protocol: 'http',
    hostname: process.env.LOCAL_SUPABASE_HOSTNAME,
    port: '54321',
    pathname: '/storage/v1/object/public/**',
  });
}

export default nextConfig;