import { Outlet } from "@remix-run/react";

export function loader() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Response("Server configuration error: missing Supabase environment variables.", { status: 503 });
  }

  return Response.json({});
}

export default function AuthLayout() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-navy via-navy-light to-navy px-4">
      <Outlet />
    </main>
  );
}
