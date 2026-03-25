import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import ScrollReveal from "../../components/ScrollReveal";
import SectionLabel from "../../components/SectionLabel";
import FooterCTA from "../../components/FooterCTA";
import { ArrowLeft, ArrowRight, Clock, Calendar } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published_date: string | null;
  excerpt: string | null;
  body_content: string | null;
  thumbnail_url: string | null;
  featured_image_url: string | null;
  tags: string[];
  author: string | null;
  reading_time_minutes: number | null;
  meta_description: string | null;
  category: string | null;
  is_published: boolean;
  status: string;
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("site_insights")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  return data as BlogPost;
}

async function getRelatedPosts(
  currentId: string,
  tags: string[]
): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("site_insights")
    .select("id, title, slug, published_date, excerpt, tags, thumbnail_url, reading_time_minutes, category")
    .eq("status", "published")
    .eq("is_published", true)
    .neq("id", currentId)
    .order("published_date", { ascending: false })
    .limit(3);

  return (data as BlogPost[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  const description =
    post.meta_description || post.excerpt || "Insights from Requity Group";
  const image = post.featured_image_url || post.thumbnail_url;

  return {
    title: post.title,
    description,
    openGraph: {
      title: `${post.title} | Requity Group`,
      description,
      type: "article",
      publishedTime: post.published_date || undefined,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export const revalidate = 300;

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.id, post.tags || []);
  const heroImage = post.featured_image_url || post.thumbnail_url;

  // Article structured data for SEO and AI discoverability
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    author: {
      "@type": post.author === "Requity Group" ? "Organization" : "Person",
      name: post.author || "Requity Group",
      ...(post.author === "Requity Group"
        ? { url: "https://requitygroup.com" }
        : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Requity Group",
      url: "https://requitygroup.com",
      logo: {
        "@type": "ImageObject",
        url: "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg",
      },
    },
    datePublished: post.published_date || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://requitygroup.com/insights/${post.slug}`,
    },
    ...(heroImage ? { image: heroImage } : {}),
    keywords: post.tags?.join(", ") || "",
    wordCount: post.body_content
      ? post.body_content.replace(/<[^>]*>/g, "").split(/\s+/).length
      : undefined,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* Article Hero */}
      <section
        className="dark-zone hero-gradient"
        style={{
          minHeight: heroImage ? "70vh" : "50vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingTop: 120,
          paddingBottom: 60,
          position: "relative",
        }}
      >
        {/* Grid pattern */}
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>
        <div className="navy-glow" style={{ top: "15%", right: "10%" }} />
        <div className="navy-bottom-fade" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          {/* Back link */}
          <div style={{ animation: "fadeUp 0.8s ease forwards" }}>
            <Link
              href="/insights"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "1.5px",
                textTransform: "uppercase" as const,
                color: "var(--navy-text-mid)",
                textDecoration: "none",
                marginBottom: 32,
                transition: "color 0.3s ease",
              }}
            >
              <ArrowLeft size={14} /> All Insights
            </Link>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
                animation: "fadeUp 0.8s 0.05s ease both",
              }}
            >
              {post.tags.map((tag) => (
                <span key={tag} className="insight-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 800,
              animation: "fadeUp 0.8s 0.1s ease both",
              fontSize: "clamp(32px, 5vw, 56px)",
            }}
          >
            {post.title}
          </h1>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 24,
              animation: "fadeUp 0.8s 0.2s ease both",
              flexWrap: "wrap" as const,
            }}
          >
            {post.author && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {post.author}
              </span>
            )}
            {post.published_date && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "var(--navy-text-mid)",
                }}
              >
                <Calendar size={13} />
                {new Date(post.published_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {post.reading_time_minutes && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "var(--navy-text-mid)",
                }}
              >
                <Clock size={13} />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Featured image */}
      {heroImage && (
        <section className="light-zone" style={{ padding: 0 }}>
          <div
            className="container"
            style={{ marginTop: -40, position: "relative", zIndex: 2 }}
          >
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
                maxHeight: 520,
              }}
            >
              <img
                src={heroImage}
                alt={post.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Body */}
      <section
        className="light-zone"
        style={{ padding: heroImage ? "60px 0 80px" : "80px 0" }}
      >
        <div className="container">
          <div className="max-prose" style={{ margin: "0 auto" }}>
            {post.body_content ? (
              <article
                className="article-body"
                dangerouslySetInnerHTML={{ __html: post.body_content }}
              />
            ) : post.excerpt ? (
              <article className="article-body">
                <p>{post.excerpt}</p>
              </article>
            ) : (
              <p style={{ color: "var(--text-mid)", textAlign: "center" }}>
                Full article coming soon.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section
          className="light-zone"
          style={{
            padding: "80px 0",
            borderTop: "1px solid var(--border-light)",
          }}
        >
          <div className="container">
            <ScrollReveal>
              <SectionLabel>More Insights</SectionLabel>
              <h2
                className="type-h2"
                style={{ color: "var(--text)", marginBottom: 48 }}
              >
                Related reading
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 24,
                }}
              >
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/insights/${related.slug}`}
                    style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
                  >
                    <div className="card insight-card">
                      <div className="insight-tags">
                        {related.tags?.map((tag) => (
                          <span key={tag} className="insight-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="card-title" style={{ fontSize: 21 }}>
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="card-body">{related.excerpt}</p>
                      )}
                      {related.published_date && (
                        <p
                          className="type-caption"
                          style={{
                            color: "var(--text-light)",
                            marginTop: 12,
                          }}
                        >
                          {new Date(related.published_date).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      <FooterCTA
        label="Get Started"
        headline={
          <>
            Partner with{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              Requity
            </em>
          </>
        }
        body="We're always looking to connect with aligned investors, borrowers, and partners who share our commitment to building real value."
        primaryCta={
          <Link href="/invest" className="btn-primary">
            Invest With Us <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <Link href="/lending" className="btn-secondary">
            Apply for a Loan <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
