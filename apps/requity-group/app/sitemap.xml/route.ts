import { supabase } from "../../lib/supabase";

export const revalidate = 3600; // Revalidate every hour

const BASE_URL = "https://requitygroup.com";

// Static pages with their priority and change frequency
const STATIC_PAGES: { path: string; priority: number; changefreq: string }[] = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/about", priority: 0.8, changefreq: "monthly" },
  { path: "/lending", priority: 0.9, changefreq: "weekly" },
  { path: "/lending/manufactured-housing", priority: 0.9, changefreq: "monthly" },
  { path: "/lending/small-bay-industrial", priority: 0.9, changefreq: "monthly" },
  { path: "/lending/industrial-outdoor-storage", priority: 0.9, changefreq: "monthly" },
  { path: "/lending/rv-parks", priority: 0.9, changefreq: "monthly" },
  { path: "/lending/multifamily", priority: 0.9, changefreq: "monthly" },
  { path: "/lending/commercial-bridge", priority: 0.9, changefreq: "monthly" },
  { path: "/lending/guarantor-support", priority: 0.8, changefreq: "monthly" },
  { path: "/lending/transactional-funding", priority: 0.8, changefreq: "monthly" },
  { path: "/lending/apply", priority: 0.9, changefreq: "monthly" },
  { path: "/invest", priority: 0.9, changefreq: "weekly" },
  { path: "/invest/request-access", priority: 0.8, changefreq: "monthly" },
  { path: "/fund", priority: 0.8, changefreq: "monthly" },
  { path: "/portfolio", priority: 0.7, changefreq: "monthly" },
  { path: "/testimonials", priority: 0.6, changefreq: "monthly" },
  { path: "/insights", priority: 0.9, changefreq: "daily" },
];

export async function GET() {
  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from("site_insights")
    .select("slug, published_date, updated_at")
    .eq("status", "published")
    .eq("is_published", true)
    .order("published_date", { ascending: false });

  const blogEntries = (posts ?? []).map((post) => {
    const lastmod = post.updated_at
      ? new Date(post.updated_at).toISOString().split("T")[0]
      : post.published_date || new Date().toISOString().split("T")[0];
    return `  <url>
    <loc>${BASE_URL}/insights/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const staticEntries = STATIC_PAGES.map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries.join("\n")}
${blogEntries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
