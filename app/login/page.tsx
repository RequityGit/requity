"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, Chrome, ShieldAlert } from "lucide-react";

function getSupabase() {
  return createClient();
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "magic" | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);
  const searchParams = useSearchParams();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam === "no_access") {
      setNoAccess(true);
    } else if (errorParam === "google_blocked") {
      setError(
        "Google sign-in is restricted to organization members. Please use a magic link instead."
      );
    } else if (errorParam === "auth_callback_failed") {
      setError(
        "Authentication failed. Please try again or use a magic link."
      );
    }
  }, [errorParam]);

  function getClient() {
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabase();
    }
    return supabaseRef.current;
  }

  async function handleGoogleLogin() {
    setLoading("google");
    setError(null);

    try {
      const supabase = getClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(null);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(null);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading("magic");
    setError(null);

    try {
      const supabase = getClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(null);
        return;
      }

      setMagicLinkSent(true);
      setLoading(null);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <img
              src="https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2"
              alt="Requity Group"
              className="h-12 mx-auto mb-4 hidden dark:block"
            />
            <img
              src="https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20Color.svg"
              alt="Requity Group"
              className="h-12 mx-auto mb-4 dark:hidden"
            />
            <p className="text-muted-foreground mt-2">
              Platform Login
            </p>
          </div>

          {/* No Access Message */}
          {noAccess && (
            <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md mb-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-medium">Access denied</p>
                <p className="mt-1 text-destructive/80">
                  Your account has not been invited to this portal. Please contact your administrator for access.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Magic Link Sent Confirmation */}
          {magicLinkSent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-green-50 mb-2">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Check your email
              </h2>
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link in the email to sign in.
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail("");
                }}
                className="text-sm text-foreground underline underline-offset-4 hover:text-[#243a5e] transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading !== null}
                className="w-full h-11 px-4 py-2 border border-border bg-card rounded-md text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
              >
                {loading === "google" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Chrome className="h-5 w-5" />
                )}
                Continue with Google
              </button>

              <p className="text-xs text-muted-foreground text-center -mt-2">
                For organization members only. External users, use a magic link below.
              </p>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              {/* Magic Link Form */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading !== null || !email}
                  className="w-full h-10 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-[#243a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading === "magic" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send Magic Link
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
