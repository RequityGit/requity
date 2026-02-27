import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getUserRole } from "~/utils/auth.server";

export const meta: MetaFunction = () => [
  { title: "Requity Group Investor Portal" },
  { name: "description", content: "Requity Group Investor Portal" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { role, headers } = await getUserRole(request);

  if (role === "admin") {
    return redirect("/admin", { headers });
  }
  if (role === "investor") {
    return redirect("/dashboard", { headers });
  }

  return redirect("/login", { headers });
}

export default function Index() {
  return null;
}
