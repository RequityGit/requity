/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'edhlkknvlczhbowasjna.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

if (process.env.LOCAL_SUPABASE_HOSTNAME) {
  nextConfig.images.remotePatterns.push({
    protocol: 'http',
    hostname: process.env.LOCAL_SUPABASE_HOSTNAME,
    port: '54321',
    pathname: '/storage/v1/object/public/**',
  });
}

export default nextConfig;