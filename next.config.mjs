/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin/originations',
        destination: '/admin/pipeline?tab=debt',
        permanent: false,
      },
      {
        source: '/admin/equity-pipeline',
        destination: '/admin/pipeline?tab=equity',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
