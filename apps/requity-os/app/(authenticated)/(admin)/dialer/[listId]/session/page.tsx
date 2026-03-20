"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DialerProvider, useDialer } from "@/lib/dialer/dialer-context";
import { DialerSession } from "@/components/dialer/DialerSession";
import type { DialerList, DialerListSettings } from "@/lib/dialer/types";
import { DEFAULT_DIALER_SETTINGS } from "@/lib/dialer/types";
import { Loader2 } from "lucide-react";

function SessionInner({ listId }: { listId: string }) {
  const { session, startSession, fireNextGroup } = useDialer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const { data: list, error: listError } = await supabase
          .from("dialer_lists")
          .select("*")
          .eq("id", listId)
          .single();

        if (listError || !list) {
          setError("List not found");
          setLoading(false);
          return;
        }

        const typedList = list as unknown as DialerList;
        const settings = (typedList.settings || DEFAULT_DIALER_SETTINGS) as DialerListSettings;

        // Mark list as active
        await supabase
          .from("dialer_lists")
          .update({ status: "active", started_at: typedList.started_at || new Date().toISOString() })
          .eq("id", listId);

        startSession(listId, typedList.name, settings, typedList.total_contacts);
        setLoading(false);
      } catch (err) {
        console.error("Session init error:", err);
        setError("Failed to initialize session");
        setLoading(false);
      }
    }

    if (session.state === "idle") {
      init();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  // Auto-fire the first group when session starts
  useEffect(() => {
    if (session.state === "ready" && session.listId && session.progress.processed === 0 && session.totalDials === 0) {
      fireNextGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.state, session.listId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => router.push("/dialer")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Lists
        </button>
      </div>
    );
  }

  return <DialerSession />;
}

export default function DialerSessionPage() {
  const params = useParams();
  const listId = params.listId as string;

  return (
    <DialerProvider>
      <SessionInner listId={listId} />
    </DialerProvider>
  );
}
