"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Mail,
  Paperclip,
  ChevronDown,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { IntakeQueueItem, CardType } from "@/app/(authenticated)/admin/pipeline/intake/page";
import { IntakeReviewSheet } from "./IntakeReviewSheet";
import { formatDistanceToNow } from "date-fns";

interface IntakeQueueProps {
  activeItems: IntakeQueueItem[];
  recentItems: IntakeQueueItem[];
  cardTypes: CardType[];
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case "ready":
      return (
        <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600">
          <Sparkles className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    case "deal_created":
      return (
        <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Deal Created
        </Badge>
      );
    case "attached":
      return (
        <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Attached
        </Badge>
      );
    case "dismissed":
      return (
        <Badge variant="outline" className="text-[10px] border-muted-foreground/50 text-muted-foreground">
          <XCircle className="h-3 w-3 mr-1" />
          Dismissed
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function ConfidenceIndicator({ item }: { item: IntakeQueueItem }) {
  if (!item.extracted_deal_fields) return null;

  const fields = Object.values(item.extracted_deal_fields);
  if (fields.length === 0) return null;

  const avgConfidence =
    fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;

  if (avgConfidence >= 0.8) {
    return (
      <span className="text-[10px] text-emerald-600 font-medium">
        {Math.round(avgConfidence * 100)}%
      </span>
    );
  }
  if (avgConfidence >= 0.5) {
    return (
      <span className="text-[10px] text-amber-600 font-medium">
        {Math.round(avgConfidence * 100)}%
      </span>
    );
  }
  return (
    <span className="text-[10px] text-red-600 font-medium">
      {Math.round(avgConfidence * 100)}%
    </span>
  );
}

export function IntakeQueue({ activeItems, recentItems, cardTypes }: IntakeQueueProps) {
  const [selectedItem, setSelectedItem] = useState<IntakeQueueItem | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      window.location.reload();
    } catch {
      setSyncing(false);
    }
  };

  const handleRetrigger = async (itemId: string) => {
    try {
      await fetch("/api/intake/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_queue_id: itemId }),
      });
      window.location.reload();
    } catch {
      // Silently fail, user can retry
    }
  };

  if (activeItems.length === 0 && recentItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-medium text-foreground mb-1">No intake items</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          Forward emails with documents to intake@requitygroup.com and they will appear here for review.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>
      <div className="space-y-2">
        {activeItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="w-full flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">
                  {item.from_name || item.from_email}
                </span>
                <StatusBadge status={item.status} />
                <ConfidenceIndicator item={item} />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {item.subject || "(no subject)"}
              </p>
              {item.extraction_summary && item.status === "ready" && (
                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                  {item.extraction_summary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {item.attachments.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  {item.attachments.length}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(item.received_at), { addSuffix: true })}
              </span>
              {(item.status === "error" || item.status === "pending") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetrigger(item.id);
                  }}
                  title="Retry extraction"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </button>
        ))}
      </div>

      {recentItems.length > 0 && (
        <Collapsible open={showRecent} onOpenChange={setShowRecent}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-4">
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${!showRecent ? "-rotate-90" : ""}`}
              />
              Recently resolved ({recentItems.length})
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1 mt-2">
              {recentItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full flex items-center gap-4 rounded-lg border border-muted p-3 text-left transition-colors hover:bg-muted/50 opacity-70"
                >
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">
                      {item.from_name || item.from_email}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {item.subject || "(no subject)"}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <IntakeReviewSheet
        item={selectedItem}
        cardTypes={cardTypes}
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />
    </>
  );
}
