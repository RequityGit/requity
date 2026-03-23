"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Copy,
  Link2,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

// -- Types --

interface ApplicationLink {
  id: string;
  token: string;
  deal_id: string;
  form_id: string;
  contact_id: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  form_definitions: {
    name: string;
    slug: string;
  } | null;
  crm_contacts: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface FormOption {
  id: string;
  name: string;
  slug: string;
}

interface ConditionOption {
  id: string;
  condition_name: string;
  status: string;
}

interface SendFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  conditions?: ConditionOption[];
  onLinkGenerated?: () => void;
  onConditionsMarked?: (conditionIds: string[]) => void;
}

// -- Component --

export function SendFormDialog({
  open,
  onOpenChange,
  dealId,
  conditions = [],
  onLinkGenerated,
  onConditionsMarked,
}: SendFormDialogProps) {
  const [links, setLinks] = useState<ApplicationLink[]>([]);
  const [forms, setForms] = useState<FormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);

  // Fetch existing links + published forms when dialog opens
  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();

    const [linksRes, formsRes] = await Promise.all([
      supabase
        .from("deal_application_links")
        .select(`
          id, token, deal_id, form_id, contact_id, status, expires_at, created_at,
          form_definitions (name, slug),
          crm_contacts (first_name, last_name, email)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false }),
      supabase
        .from("form_definitions")
        .select("id, name, slug")
        .eq("status", "published")
        .order("name"),
    ]);

    if (linksRes.data) setLinks(linksRes.data as unknown as ApplicationLink[]);
    if (formsRes.data) setForms(formsRes.data as FormOption[]);
    setLoading(false);
  }, [open, dealId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setGeneratedUrl(null);
      setSelectedFormId("");
      setExpiryDays("7");
      setShowNewForm(false);
      setSelectedConditionIds([]);
    }
  }, [open]);

  // Generate new link
  const handleGenerate = async () => {
    if (!selectedFormId) return;
    setGenerating(true);
    try {
      const supabase = createClient();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));
      const token = crypto.randomUUID();

      const { data, error } = await supabase
        .from("deal_application_links")
        .insert({
          token,
          deal_id: dealId,
          form_id: selectedFormId,
          status: "active",
          expires_at: expiresAt.toISOString(),
        })
        .select("id, token")
        .single();

      if (error) throw error;

      const selectedForm = forms.find((f) => f.id === selectedFormId);
      const url = `${window.location.origin}/forms/${selectedForm?.slug ?? "unknown"}?dt=${data.token}`;
      setGeneratedUrl(url);

      // Mark selected conditions as "requested"
      if (selectedConditionIds.length > 0) {
        const now = new Date().toISOString();
        const { error: condError } = await supabase
          .from("unified_deal_conditions")
          .update({ status: "requested", requested_at: now })
          .in("id", selectedConditionIds);

        if (condError) {
          showError("Could not mark conditions as requested", condError.message);
        } else {
          onConditionsMarked?.(selectedConditionIds);
        }
      }

      showSuccess("Application link generated");
      onLinkGenerated?.();
      // Refresh links list to show the new one
      fetchData();
    } catch (err) {
      showError("Could not generate link", err instanceof Error ? err.message : undefined);
    } finally {
      setGenerating(false);
    }
  };

  // Copy link to clipboard
  const handleCopy = (link: ApplicationLink) => {
    const url = `${window.location.origin}/forms/${link.form_definitions?.slug ?? "unknown"}?dt=${link.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    showSuccess("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyGenerated = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      showSuccess("Link copied to clipboard");
    }
  };

  // Toggle condition selection
  const toggleCondition = (conditionId: string) => {
    setSelectedConditionIds((prev) =>
      prev.includes(conditionId)
        ? prev.filter((id) => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  // Helpers
  const activeLinks = links.filter(
    (l) => l.status === "active" && new Date(l.expires_at) > new Date()
  );
  const expiredLinks = links.filter(
    (l) => l.status !== "active" || new Date(l.expires_at) <= new Date()
  );
  const pendingConditions = conditions.filter((c) => c.status === "pending");

  const contactName = (link: ApplicationLink) => {
    const c = link.crm_contacts;
    if (!c) return null;
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
    return name || c.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Form
          </DialogTitle>
          <DialogDescription>
            Manage application links for this deal. Copy an existing link or generate a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Active Links */}
              {activeLinks.length > 0 && (
                <div>
                  <h4 className="rq-micro-label mb-2">Active Links</h4>
                  <div className="space-y-1.5">
                    {activeLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-muted/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm truncate">
                              {link.form_definitions?.name ?? "Unknown Form"}
                              {contactName(link) && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  &middot; {contactName(link)}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expires {formatDateShort(link.expires_at)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs shrink-0"
                          onClick={() => handleCopy(link)}
                        >
                          {copiedId === link.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedId === link.id ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expired / Revoked Links */}
              {expiredLinks.length > 0 && (
                <div>
                  <h4 className="rq-micro-label mb-2">
                    Expired / Revoked ({expiredLinks.length})
                  </h4>
                  <div className="space-y-1">
                    {expiredLinks.slice(0, 3).map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 py-1.5 px-3 rounded-md text-muted-foreground"
                      >
                        <Link2 className="h-3 w-3 shrink-0 opacity-50" />
                        <p className="text-xs truncate">
                          {link.form_definitions?.name ?? "Unknown"} &middot;{" "}
                          {new Date(link.expires_at) <= new Date()
                            ? "Expired"
                            : link.status}
                        </p>
                      </div>
                    ))}
                    {expiredLinks.length > 3 && (
                      <p className="text-xs text-muted-foreground px-3">
                        +{expiredLinks.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Divider */}
              {links.length > 0 && <div className="rq-divider" />}

              {/* Generate New Link */}
              {!showNewForm && !generatedUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => setShowNewForm(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Generate New Link
                </Button>
              ) : generatedUrl ? (
                <div className="space-y-3">
                  <h4 className="rq-micro-label">Generated Link</h4>
                  <div className="flex gap-2">
                    <Input
                      value={generatedUrl}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyGenerated}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with the borrower. It expires in {expiryDays} days.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setGeneratedUrl(null);
                      setShowNewForm(false);
                      setSelectedConditionIds([]);
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="rq-micro-label">New Application Link</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="inline-field-label">Form</span>
                      <Select
                        value={selectedFormId}
                        onValueChange={setSelectedFormId}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select a form" />
                        </SelectTrigger>
                        <SelectContent>
                          {forms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="inline-field-label">Expires After</span>
                      <Select value={expiryDays} onValueChange={setExpiryDays}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Mark Conditions as Requested */}
                  {pendingConditions.length > 0 && (
                    <div className="space-y-2">
                      <span className="inline-field-label">
                        Mark conditions as requested ({selectedConditionIds.length} selected)
                      </span>
                      <div className="max-h-32 overflow-y-auto space-y-1 rounded-md border border-border p-2">
                        {pendingConditions.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50 cursor-pointer text-sm"
                          >
                            <Checkbox
                              checked={selectedConditionIds.includes(c.id)}
                              onCheckedChange={() => toggleCondition(c.id)}
                            />
                            <span className="truncate">{c.condition_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewForm(false);
                        setSelectedConditionIds([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={!selectedFormId || generating}
                      className="gap-1.5"
                    >
                      {generating && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Generate Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {links.length === 0 && !showNewForm && !generatedUrl && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No application links yet. Generate one to get started.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
