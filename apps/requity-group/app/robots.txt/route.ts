export async function GET() {
  const content = `# Requity Group - requitygroup.com
# Allow all search engines and AI crawlers

User-agent: *
Allow: /

# AI Crawlers - explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Bytespider
Allow: /

# Sitemap
Sitemap: https://requitygroup.com/sitemap.xml

# LLMs.txt
# https://requitygroup.com/llms.txt
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
