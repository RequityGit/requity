"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Phone, Play, Pause, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DialerList, DialerListStatus } from "@/lib/dialer/types";

interface TeamMember {
  id: string;
  full_name: string;
}

interface DialerListsPageProps {
  lists: DialerList[];
  teamMembers: TeamMember[];
  currentUserId: string;
  onCreateList: (data: {
    name: string;
    description: string;
    assigned_to: string;
  }) => Promise<{ id?: string; error?: string }>;
}

const STATUS_CONFIG: Record<
  DialerListStatus,
  { label: string; variant: string; icon: React.ElementType }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  active: { label: "Active", variant: "success", icon: Play },
  paused: { label: "Paused", variant: "warning", icon: Pause },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
};

export function DialerListsPage({
  lists,
  teamMembers,
  currentUserId,
  onCreateList,
}: DialerListsPageProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const result = await onCreateList({
        name: name.trim(),
        description: description.trim(),
        assigned_to: assignedTo,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setName("");
        setDescription("");
        // Page will be refreshed via revalidation
      }
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Dialer List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="list-name">Name</Label>
                <Input
                  id="list-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., FL FUB Leads"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="list-desc">Description</Label>
                <Textarea
                  id="list-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="h-20 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  size="sm"
                >
                  {creating ? "Creating..." : "Create List"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Phone className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground mb-1">
            No dialer lists yet
          </p>
          <p className="text-xs text-muted-foreground">
            Create your first list to start power dialing.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Progress</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.map((list) => {
                const config = STATUS_CONFIG[list.status];
                const progressPct =
                  list.total_contacts > 0
                    ? Math.round(
                        (list.completed_contacts / list.total_contacts) * 100
                      )
                    : 0;
                return (
                  <TableRow key={list.id}>
                    <TableCell>
                      <Link
                        href={`/admin/dialer/${list.id}`}
                        className="font-medium hover:underline"
                      >
                        {list.name}
                      </Link>
                      {list.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {list.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          config.variant as
                            | "default"
                            | "secondary"
                            | "success"
                            | "warning"
                        }
                        className="gap-1"
                      >
                        <config.icon className="h-3 w-3" strokeWidth={1.5} />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono tabular-nums text-muted-foreground">
                          {list.completed_contacts}/{list.total_contacts}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {list.assigned_to_name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(list.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(list.status === "draft" || list.status === "paused") && (
                        <Link href={`/admin/dialer/${list.id}/session`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Play className="h-3 w-3" strokeWidth={1.5} />
                            {list.status === "paused" ? "Resume" : "Start"}
                          </Button>
                        </Link>
                      )}
                      {list.status === "active" && (
                        <Link href={`/admin/dialer/${list.id}/session`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Phone className="h-3 w-3" strokeWidth={1.5} />
                            Join
                          </Button>
                        </Link>
                      )}
                      {list.status === "completed" && (
                        <Link href={`/admin/dialer/${list.id}`}>
                          <Button size="sm" variant="ghost" className="gap-1">
                            View
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
