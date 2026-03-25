export const getBaseUrl = () => {
  // always use relative paths
  if (typeof window !== 'undefined') return '';
  if (process.env.URL) return process.env.URL;
  // fallback for Local Dev
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
};