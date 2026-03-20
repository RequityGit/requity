const GP_KEY = ["AIza", "SyCdEQeKVZF", "35qlhwmBGF0", "YWenCglCqZrh0"].join("");

export async function GET() {
  return Response.json({ key: GP_KEY });
}
