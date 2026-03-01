"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CRM_RELATIONSHIP_TYPES,
  RELATIONSHIP_COLORS,
  CRM_LENDER_DIRECTIONS,
  CRM_VENDOR_TYPES,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Relationship {
  id: string;
  contact_id: string;
  relationship_type: string;
  lender_direction: string | null;
  vendor_type: string | null;
  is_active: boolean | null;
  notes: string | null;
  started_at: string | null;
  ended_at: string | null;
}

interface ContactRelationshipsProps {
  contactId: string;
  relationships: Relationship[];
}

export function ContactRelationships({
  contactId,
  relationships,
}: ContactRelationshipsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState("");
  const [newLenderDir, setNewLenderDir] = useState("");
  const [newVendorType, setNewVendorType] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function addRelationship() {
    if (!newType) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("contact_relationship_types")
        .insert({
          contact_id: contactId,
          relationship_type: newType as any,
          lender_direction:
            newType === "lender" && newLenderDir
              ? (newLenderDir as any)
              : null,
          vendor_type:
            newType === "vendor" && newVendorType
              ? (newVendorType as any)
              : null,
          is_active: true,
        });
      if (error) throw error;
      toast({ title: "Relationship added" });
      setShowAddForm(false);
      setNewType("");
      setNewLenderDir("");
      setNewVendorType("");
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error adding relationship",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(rel: Relationship) {
    try {
      const supabase = createClient();
      const updates: Record<string, any> = {
        is_active: !rel.is_active,
      };
      if (rel.is_active) {
        updates.ended_at = new Date().toISOString();
      } else {
        updates.ended_at = null;
      }
      const { error } = await supabase
        .from("contact_relationship_types")
        .update(updates)
        .eq("id", rel.id);
      if (error) throw error;
      toast({
        title: rel.is_active
          ? "Relationship deactivated"
          : "Relationship reactivated",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error updating relationship",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Relationships
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add form */}
        {showAddForm && (
          <div className="mb-4 rounded-md border p-3 space-y-3">
            <div className="space-y-2">
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship type..." />
                </SelectTrigger>
                <SelectContent>
                  {CRM_RELATIONSHIP_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {newType === "lender" && (
                <Select value={newLenderDir} onValueChange={setNewLenderDir}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lender direction..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_LENDER_DIRECTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {newType === "vendor" && (
                <Select
                  value={newVendorType}
                  onValueChange={setNewVendorType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vendor type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_VENDOR_TYPES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={addRelationship}
                disabled={!newType || loading}
              >
                {loading ? "Adding..." : "Add"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Relationship list */}
        {relationships.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No relationships defined.
          </p>
        ) : (
          <div className="space-y-2">
            {relationships.map((rel) => {
              const label =
                CRM_RELATIONSHIP_TYPES.find(
                  (r) => r.value === rel.relationship_type
                )?.label ?? rel.relationship_type;
              const colors =
                RELATIONSHIP_COLORS[rel.relationship_type] ??
                "bg-gray-100 text-gray-800 border-gray-200";
              const lenderLabel = rel.lender_direction
                ? CRM_LENDER_DIRECTIONS.find(
                    (d) => d.value === rel.lender_direction
                  )?.label
                : null;
              const vendorLabel = rel.vendor_type
                ? CRM_VENDOR_TYPES.find((v) => v.value === rel.vendor_type)
                    ?.label
                : null;

              return (
                <div
                  key={rel.id}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                    !rel.is_active && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium", colors)}
                    >
                      {label}
                    </Badge>
                    {lenderLabel && (
                      <span className="text-xs text-muted-foreground">
                        ({lenderLabel})
                      </span>
                    )}
                    {vendorLabel && (
                      <span className="text-xs text-muted-foreground">
                        ({vendorLabel})
                      </span>
                    )}
                    {!rel.is_active && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-gray-100 text-gray-500"
                      >
                        Inactive
                      </Badge>
                    )}
                    {rel.notes && (
                      <span className="text-xs text-muted-foreground">
                        — {rel.notes}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(rel)}
                    className="text-xs"
                  >
                    {rel.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
