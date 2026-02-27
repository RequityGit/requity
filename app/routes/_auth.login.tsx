import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import { createSupabaseServerClient } from "~/utils/supabase.server";
import { getUserRole } from "~/utils/auth.server";

export const meta: MetaFunction = () => [
  { title: "Sign In | Requity Group Investor Portal" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { role, headers } = await getUserRole(request);

  if (role === "admin") {
    return redirect("/admin", { headers });
  }
  if (role === "investor") {
    return redirect("/dashboard", { headers });
  }

  return Response.json({}, { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "magic-link") {
    return handleMagicLink(request, formData);
  }

  if (intent === "google") {
    return handleGoogleOAuth(request);
  }

  return Response.json({ error: "Invalid request." }, { status: 400 });
}

async function handleMagicLink(request: Request, formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const { supabase, headers } = createSupabaseServerClient(request);

  const url = new URL(request.url);
  const redirectTo = `${url.origin}/auth/confirm`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400, headers });
  }

  return Response.json(
    { success: true, message: "Check your email for a sign-in link." },
    { headers }
  );
}

async function handleGoogleOAuth(request: Request) {
  const { supabase, headers } = createSupabaseServerClient(request);

  const url = new URL(request.url);
  const redirectTo = `${url.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400, headers });
  }

  return redirect(data.url, { headers });
}

export default function Login() {
  const actionData = useActionData<{
    error?: string;
    success?: boolean;
    message?: string;
  }>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const errorMessage = searchParams.get("error") || actionData?.error;

  // Show success state after magic link sent
  if (actionData?.success) {
    return (
      <div className="w-full max-w-md px-8 py-10 bg-white shadow-lg rounded-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-navy">Check Your Email</h1>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            {actionData.message}
          </p>
        </div>
        <a
          href="/login"
          className="block w-full text-center py-2.5 text-sm text-accent hover:text-accent-light transition"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-8 py-10 bg-white shadow-lg rounded-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl text-navy tracking-tight">
          <span className="font-bold">Requity</span>{" "}
          <span className="font-light">Group</span>
        </h1>
        <p className="text-[10px] text-muted tracking-widest uppercase mt-0.5">
          Investor Portal
        </p>
        <p className="mt-4 text-sm text-muted">
          Sign in to access your investments
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 mb-6 text-sm rounded-lg bg-red-50 text-error border border-red-100">
          {errorMessage}
        </div>
      )}

      {/* Google OAuth */}
      <Form method="POST">
        <input type="hidden" name="intent" value="google" />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-text text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      </Form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-muted">or</span>
        </div>
      </div>

      {/* Magic Link */}
      <Form method="POST">
        <input type="hidden" name="intent" value="magic-link" />
        <fieldset
          className="space-y-4 disabled:opacity-70"
          disabled={isSubmitting}
        >
          <div>
            <label
              htmlFor="email"
              className="block mb-1.5 text-sm font-medium text-navy"
            >
              Email Address
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Sending link..." : "Send Magic Link"}
          </button>
        </fieldset>
      </Form>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-muted">
        No password needed. We&apos;ll send you a secure link to sign in.
      </p>
    </div>
  );
}
