import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Faster dev: tree-shake barrel imports so only used exports are compiled (lucide, recharts, etc.)
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|.*\\.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
                {
                  key: "Content-Security-Policy",
                  value:
                    "upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://accounts.google.com https://*.sentry.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://gmail.googleapis.com https://*.twil.io https://fonts.googleapis.com https://fonts.gstatic.com; frame-src 'self' https://docs.google.com; worker-src 'self' blob:",
                },
              ]
            : []),
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/originations',
        destination: '/pipeline?tab=debt',
        permanent: true,
      },
      {
        source: '/equity-pipeline/:id',
        destination: '/pipeline/:id',
        permanent: true,
      },
      {
        source: '/equity-pipeline',
        destination: '/pipeline?tab=equity',
        permanent: true,
      },
      {
        source: '/deals/:id',
        destination: '/pipeline/:id',
        permanent: true,
      },
      {
        source: '/dscr',
        destination: '/models/dscr',
        permanent: true,
      },
    ];
  },
};

const sentryConfig = {
  org: "requity",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  hideSourceMaps: true,
};

export default isDev ? nextConfig : withSentryConfig(nextConfig, sentryConfig);
