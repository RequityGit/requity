export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY || "";
  return Response.json({ key });
}
