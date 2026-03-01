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
import { useToast } from "@/components/ui/use-toast";
import { Mail, CheckCircle2, XCircle, Loader2, Unplug, AlertTriangle, RefreshCw, Inbox } from "lucide-react";

interface GmailToken {
  id: string;
  email: string;
  is_active: boolean;
  connected_at: string;
  scopes: string[] | null;
}

export function GmailIntegration() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [gmailToken, setGmailToken] = useState<GmailToken | null>(null);
  const [gmailConfigured, setGmailConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
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

  // Check if Gmail OAuth is configured on the server
  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch("/api/gmail/config");
        const data = await res.json();
        setGmailConfigured(data.configured ?? false);
      } catch {
        setGmailConfigured(false);
      }
    }
    checkConfig();
  }, []);

  // Handle OAuth callback query params
  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      toast({
        title: "Gmail connected",
        description:
          "Your Gmail account has been connected successfully. Emails will now be sent via your Gmail.",
      });
      // Clean up the URL
      router.replace(pathname, { scroll: false });
    } else if (gmailParam === "error") {
      const message = searchParams.get("message");
      toast({
        title: "Gmail connection failed",
        description:
          message || "Something went wrong connecting your Gmail account. Please try again.",
        variant: "destructive",
      });
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, toast, router, pathname]);

  useEffect(() => {
    fetchGmailStatus();
  }, [fetchGmailStatus]);

  // Re-fetch after returning from OAuth flow
  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      fetchGmailStatus();
    }
  }, [searchParams, fetchGmailStatus]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/gmail/auth/start", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data?.error || "Failed to start Gmail authorization. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
        toast({
          title: "Error",
          description: "No authorization URL received. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Gmail connect error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: "Failed to disconnect Gmail. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setGmailToken(null);
      toast({
        title: "Gmail disconnected",
        description:
          "Your Gmail account has been disconnected. Emails will be sent via the default sender.",
      });
    } catch (err) {
      console.error("Gmail disconnect error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Sync failed",
          description: data?.error || "Failed to sync emails.",
          variant: "destructive",
        });
        return;
      }

      setSyncResult({
        messagesProcessed: data.messagesProcessed,
        errors: data.errors || [],
      });

      toast({
        title: "Sync complete",
        description: `Synced ${data.messagesProcessed} new email${data.messagesProcessed === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      console.error("Gmail sync error:", err);
      toast({
        title: "Sync failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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
        ) : gmailConfigured === false ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Gmail integration is not configured
                </p>
                {pathname.startsWith("/admin") || pathname.startsWith("/control-center") ? (
                  <div className="text-xs text-amber-700 space-y-1 mt-1">
                    <p>
                      To enable Gmail integration, add these environment variables
                      to your deployment:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      <li>
                        <code className="bg-amber-100 px-1 rounded text-[11px]">GMAIL_CLIENT_ID</code>
                      </li>
                      <li>
                        <code className="bg-amber-100 px-1 rounded text-[11px]">GMAIL_CLIENT_SECRET</code>
                      </li>
                    </ul>
                    <p>
                      Create OAuth credentials in the{" "}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        Google Cloud Console
                      </a>{" "}
                      and set the redirect URI to{" "}
                      <code className="bg-amber-100 px-1 rounded text-[11px]">
                        {"<your-domain>"}/api/gmail/auth/callback
                      </code>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">
                    Contact your administrator to enable Gmail OAuth.
                  </p>
                )}
              </div>
            </div>
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
