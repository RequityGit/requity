// @ts-nocheck — Netlify Edge Functions run in Deno, not Node.js
export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "http") {
    const url = new URL(request.url);
    url.protocol = "https:";
    return new Response(null, {
      status: 301,
      headers: { Location: url.toString() },
    });
  }
  return context.next();
};
