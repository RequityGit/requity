"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LinkIcon,
  Unlink,
  Loader2,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  MoreHorizontal,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  linkScenarioToDeal,
  unlinkScenarioFromDeal,
  updateScenario,
  deleteScenario,
} from "../actions";

interface ScenarioHeaderProps {
  scenario: {
    id: string;
    name: string;
    description: string | null;
    model_type: string;
    status: string;
    created_by: string;
    created_at: string;
  };
  modelType: string;
  linkedDealName: string | null;
  linkedDealType: "opportunity" | "loan" | null;
  linkedDealId: string | null;
  availableDeals: {
    id: string;
    name: string;
    loanType: string | null;
    stage: string;
    type: "opportunity" | "loan";
  }[];
  authorName: string;
}

export function ScenarioHeader({
  scenario,
  modelType,
  linkedDealName,
  linkedDealType,
  linkedDealId,
  availableDeals,
  authorName,
}: ScenarioHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [linkOpen, setLinkOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [editName, setEditName] = useState(scenario.name);
  const [renameOpen, setRenameOpen] = useState(false);

  const filteredDeals = availableDeals.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLink = async (dealId: string, dealType: "opportunity" | "loan") => {
    setLinking(true);
    try {
      const result = await linkScenarioToDeal(scenario.id, dealId, dealType);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Linked", description: "Scenario linked to deal. Versions are now visible on the deal." });
        setLinkOpen(false);
        router.refresh();
      }
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const result = await unlinkScenarioFromDeal(scenario.id);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Unlinked", description: "Scenario is now standalone." });
        router.refresh();
      }
    } finally {
      setUnlinking(false);
    }
  };

  const handleRename = async () => {
    if (!editName.trim()) return;
    setRenaming(true);
    try {
      const result = await updateScenario(scenario.id, { name: editName.trim() });
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Renamed" });
        setRenameOpen(false);
        router.refresh();
      }
    } finally {
      setRenaming(false);
    }
  };

  const handleArchive = async () => {
    const result = await updateScenario(scenario.id, { status: "archived" });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Archived" });
      router.push(`/admin/models/${modelType}/scenarios`);
    }
  };

  const handleDelete = async () => {
    const result = await deleteScenario(scenario.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      router.push(`/admin/models/${modelType}/scenarios`);
    }
  };

  return (
    <div className="border-b border-border bg-muted/30 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] text-muted-foreground">
            {authorName} · {formatDate(scenario.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Deal link status */}
          {linkedDealName ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1">
                <LinkIcon size={10} className="text-blue-500" strokeWidth={1.5} />
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 max-w-[200px] truncate">
                  {linkedDealName}
                </span>
                <Badge variant="outline" className="text-[8px] h-3.5 px-1">
                  {linkedDealType === "opportunity" ? "Opp" : "Loan"}
                </Badge>
              </div>
              <Link
                href={
                  linkedDealType === "opportunity"
                    ? `/admin/pipeline/equity/${linkedDealId}`
                    : `/admin/pipeline/debt/${linkedDealId}`
                }
              >
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <ExternalLink size={12} strokeWidth={1.5} />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] text-muted-foreground"
                onClick={handleUnlink}
                disabled={unlinking}
              >
                {unlinking ? <Loader2 size={10} className="animate-spin" /> : <Unlink size={10} />}
                <span className="ml-1">Unlink</span>
              </Button>
            </div>
          ) : (
            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  <LinkIcon size={10} className="mr-1" strokeWidth={1.5} />
                  Link to Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Link Scenario to Deal</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground mb-3">
                  Linking makes all versions in this scenario visible on the deal&apos;s underwriting tab. You can unlink later without losing version history.
                </p>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1">
                  {filteredDeals.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No matching deals found
                    </p>
                  ) : (
                    filteredDeals.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => handleLink(deal.id, deal.type)}
                        disabled={linking}
                        className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-muted/50 transition-colors text-left w-full"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {deal.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {deal.loanType ? deal.loanType.toUpperCase() : "—"} · {deal.stage.replace(/_/g, " ")}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 ml-2">
                          {deal.type === "opportunity" ? "Opportunity" : "Loan"}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil size={12} className="mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive size={12} className="mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={12} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Scenario</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRename} disabled={!editName.trim() || renaming}>
              {renaming && <Loader2 size={14} className="mr-1 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
