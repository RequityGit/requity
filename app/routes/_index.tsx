import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getSession } from "~/session.server";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export const meta: MetaFunction = () => [
  { title: "Requity Lending Portal" },
  { name: "description", content: "Requity Lending Borrower Portal" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("__session");

  if (token) {
    try {
      const supabase = getSupabaseClient(token);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "admin") return redirect("/admin");
        return redirect("/dashboard");
      }
    } catch {
      // Fall through to login
    }
  }

  return redirect("/login");
}

export default function Index() {
  return null;
}
