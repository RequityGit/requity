"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/lib/toast";
import { Mail, CheckCircle2, XCircle, Loader2, Unplug, AlertTriangle, RefreshCw, Inbox } from "lucide-react";

interface GmailToken {
  id: string;
  email: string;
  is_active: boolean;
  connected_at: string;
  scopes: string[] | null;
}

export function GmailIntegration() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [gmailToken, setGmailToken] = useState<GmailToken | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    messagesProcessed: number;
    errors: string[];
  } | null>(null);

  const fetchGmailStatus = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("gmail_tokens")
        .select("id, email, is_active, connected_at, scopes")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      setGmailToken(data as GmailToken | null);
    } catch (err) {
      console.error("Failed to fetch Gmail status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle OAuth callback query params
  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      showSuccess("Gmail connected");
      // Clean up the URL
      router.replace(pathname, { scroll: false });
    } else if (gmailParam === "error") {
      const message = searchParams.get("message");
      showError("Could not connect Gmail", message || "Something went wrong. Please try again.");
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  // Check token health (can it actually refresh?) after initial status load
  const checkTokenHealth = useCallback(async () => {
    if (!gmailToken) return;
    try {
      const res = await fetch("/api/gmail/status");
      if (!res.ok) return;
      const data = await res.json();
      if (data.error === "expired") {
        setTokenExpired(true);
        // Token was deactivated server-side, refresh local state
        setGmailToken(null);
      }
    } catch {
      // Silently ignore — health check is best-effort
    }
  }, [gmailToken]);

  useEffect(() => {
    fetchGmailStatus();
  }, [fetchGmailStatus]);

  // Re-fetch after returning from OAuth flow
  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      setTokenExpired(false);
      fetchGmailStatus();
    }
  }, [searchParams, fetchGmailStatus]);

  // Run token health check once after token is loaded
  useEffect(() => {
    checkTokenHealth();
  }, [checkTokenHealth]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const supabase = createClient();

      // Call the Supabase edge function to get the Google OAuth URL
      const { data, error } = await supabase.functions.invoke('gmail-oauth-start');

      if (error) {
        console.error('Failed to start Gmail OAuth:', error);
        showError("Could not start Gmail authorization", "Please try again.");
        return;
      }

      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
        console.error('No auth_url returned from gmail-oauth-start');
        showError("Could not start Gmail authorization", "No authorization URL received.");
      }
    } catch (err) {
      console.error("Gmail connect error:", err);
      showError("Could not connect Gmail", "An unexpected error occurred.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("gmail_tokens")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) {
        showError("Could not disconnect Gmail", "Please try again.");
        return;
      }

      setGmailToken(null);
      showSuccess("Gmail disconnected");
    } catch (err) {
      console.error("Gmail disconnect error:", err);
      showError("Could not disconnect Gmail", "An unexpected error occurred.");
    } finally {
      setDisconnecting(false);
    }
  }

  // Check if the token has gmail.readonly scope for email sync
  const hasReadScope = gmailToken?.scopes?.some(
    (s) => s.includes("gmail.readonly") || s.includes("mail.google.com")
  );

  async function handleSyncNow() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        showError("Could not sync emails", data?.error || "Please try again.");
        return;
      }

      setSyncResult({
        messagesProcessed: data.messagesProcessed,
        errors: data.errors || [],
      });

      showSuccess(`Synced ${data.messagesProcessed} new email${data.messagesProcessed === 1 ? "" : "s"}`);
    } catch (err) {
      console.error("Gmail sync error:", err);
      showError("Could not sync emails", "An unexpected error occurred.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <Mail className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Gmail Integration</CardTitle>
            <CardDescription>
              Connect your Gmail account to send and sync CRM emails
            </CardDescription>
          </div>
          {!loading && (
            <Badge
              variant={gmailToken ? "default" : "secondary"}
              className={
                gmailToken
                  ? "bg-green-100 text-green-800 border-green-200"
                  : ""
              }
            >
              {gmailToken ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Not connected
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
        ) : gmailToken ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Connected as {gmailToken.email}
                </p>
                <p className="text-xs text-green-700">
                  CRM emails will be sent from this Gmail account
                </p>
              </div>
            </div>

            {/* Re-auth banner when gmail.readonly scope is missing */}
            {!hasReadScope && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-200">
                <Inbox className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Email sync requires updated permissions
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Re-authorize your Gmail connection to enable inbound email
                    sync. Your sent email capability will not be affected.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                        Re-authorize Gmail
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Sync controls — only show when read scope is available */}
            {hasReadScope && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50 border border-blue-200">
                <Inbox className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Email sync is active
                  </p>
                  <p className="text-xs text-blue-700">
                    Inbound emails matching your contacts are synced automatically every 5 minutes
                  </p>
                  {syncResult && (
                    <p className="text-xs text-blue-600 mt-1">
                      Last sync: {syncResult.messagesProcessed} new email{syncResult.messagesProcessed === 1 ? "" : "s"}
                      {syncResult.errors.length > 0 && ` (${syncResult.errors.length} error${syncResult.errors.length === 1 ? "" : "s"})`}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1.5" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unplug className="h-4 w-4 mr-2" />
                  Disconnect Gmail
                </>
              )}
            </Button>
          </div>
        ) : tokenExpired ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Gmail connection expired
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Your Gmail authorization has expired. This can happen when
                  Google revokes access after a period of inactivity or if the
                  app&apos;s OAuth configuration changed. Please reconnect to
                  resume sending and syncing emails.
                </p>
              </div>
            </div>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect Gmail Account
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When connected, CRM emails will be sent from your Gmail account
              instead of the default system sender. Recipients will see your
              email address and can reply directly to you.
            </p>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail Account
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
