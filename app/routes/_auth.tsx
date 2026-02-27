import { redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { getSupabaseClient } from "~/utils/getSupabaseClient";

export function loader() {
  try {
    getSupabaseClient();
  } catch {
    return redirect("/");
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
