import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActionsBodySizeLimit: "25mb",
  },
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
        permanent: true,
      },
      {
        source: '/admin/equity-pipeline/:id',
        destination: '/admin/pipeline/equity/:id',
        permanent: true,
      },
      {
        source: '/admin/equity-pipeline',
        destination: '/admin/pipeline/equity',
        permanent: true,
      },
      {
        source: '/admin/deals/:id',
        destination: '/admin/pipeline/debt/:id',
        permanent: true,
      },
      {
        source: '/admin/dscr',
        destination: '/admin/models/dscr',
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "requity",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Enables automatic instrumentation of Vercel Cron Monitors (does not yet work with Netlify)
  // automaticVercelMonitors: true,
});
