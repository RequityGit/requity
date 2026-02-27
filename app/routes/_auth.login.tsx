import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

import { commitSession, getSession } from "~/session.server";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export const meta: MetaFunction = () => [
  { title: "Log In | Requity Lending Portal" },
];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return Response.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Get user profile to determine redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const session = await getSession(request.headers.get("Cookie"));
  session.set("__session", data.session.access_token);

  const redirectTo = profile?.role === "admin" ? "/admin" : "/dashboard";

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("__session");

  if (token) {
    return redirect("/dashboard");
  }

  return Response.json({});
}

export default function LogIn() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="w-full max-w-md px-8 py-10 bg-white shadow-lg rounded-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl text-navy tracking-tight">
          <span className="font-bold">Requity</span>{" "}
          <span className="font-light">Lending</span>
        </h1>
        <p className="text-[10px] text-muted tracking-widest uppercase mt-0.5">
          A Requity Group Company
        </p>
        <p className="mt-4 text-sm text-muted">
          Sign in to your borrower portal
        </p>
      </div>

      <Form method="POST">
        {actionData?.error && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 text-error border border-red-100">
            {actionData.error}
          </div>
        )}
        <fieldset
          className="space-y-5 disabled:opacity-70"
          disabled={isSubmitting}
        >
          <div>
            <label
              htmlFor="email"
              className="block mb-1.5 text-sm font-medium text-navy"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="block w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-text transition placeholder:text-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-1.5 text-sm font-medium text-navy"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              className="block w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-text transition placeholder:text-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </fieldset>
      </Form>
    </div>
  );
}
