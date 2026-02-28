"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Briefcase, Mail, Loader2, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"password" | "magic" | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();

  function getClient() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading("password");
    setError(null);

    try {
      const supabase = getClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(error.message);
        }
        setLoading(null);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
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
      setError("Unable to connect. Please check your connection and try again.");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-deep px-4">
      <div className="w-full max-w-md">
        <div className="bg-navy-mid rounded-lg p-8" style={{ border: "1px solid rgba(197, 151, 91, 0.15)" }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gold/10 mb-4">
              <Briefcase className="h-6 w-6 text-gold" />
            </div>
            <h1 className="font-display text-3xl font-light text-surface-white">
              Requity Group
            </h1>
            <p className="text-surface-muted font-body text-sm mt-2">
              Sign in to your portal
            </p>
          </div>

          {error && (
            <div className="bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm font-body p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {magicLinkSent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-success/10 mb-2">
                <Mail className="h-8 w-8 text-status-success" />
              </div>
              <h2 className="font-display text-xl text-surface-white">
                Check your email
              </h2>
              <p className="text-sm text-surface-gray font-body">
                We sent a sign-in link to{" "}
                <span className="font-semibold text-gold">{email}</span>.
                Click the link in the email to sign in.
              </p>
              <button
                onClick={() => { setMagicLinkSent(false); setEmail(""); }}
                className="text-sm text-gold font-body underline underline-offset-4 hover:text-gold-light transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {mode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-body font-medium text-surface-offwhite">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex h-11 w-full rounded-md border border-navy-light bg-navy-deep px-3 py-2 text-sm font-body text-surface-white placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-body font-medium text-surface-offwhite">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex h-11 w-full rounded-md border border-navy-light bg-navy-deep px-3 py-2 pr-10 text-sm font-body text-surface-white placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted hover:text-surface-gray transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading !== null || !email || !password}
                    className="w-full h-11 px-4 py-2 bg-gold text-navy-deep rounded-md text-sm font-body font-semibold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading === "password" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="magic-email" className="text-sm font-body font-medium text-surface-offwhite">
                      Email address
                    </label>
                    <input
                      id="magic-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex h-11 w-full rounded-md border border-navy-light bg-navy-deep px-3 py-2 text-sm font-body text-surface-white placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading !== null || !email}
                    className="w-full h-11 px-4 py-2 bg-gold text-navy-deep rounded-md text-sm font-body font-semibold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading === "magic" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send Magic Link
                  </button>
                </form>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-navy-light" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-navy-mid px-2 text-surface-muted font-body tracking-wider">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setMode(mode === "password" ? "magic" : "password"); setError(null); }}
                className="w-full h-11 px-4 py-2 bg-transparent border border-gold/30 text-gold rounded-md text-sm font-body font-semibold hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
              >
                {mode === "password" ? (
                  <><Mail className="h-4 w-4" />Sign in with Magic Link</>
                ) : (
                  <><Lock className="h-4 w-4" />Sign in with Password</>
                )}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-surface-muted font-body mt-6">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
