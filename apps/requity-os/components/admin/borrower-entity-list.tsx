"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Building2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { BorrowerEntityDialog } from "@/components/admin/borrower-entity-dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { deleteEntityAction } from "@/app/(authenticated)/(admin)/borrowers/new/actions";
import { showSuccess, showError } from "@/lib/toast";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import type { Tables } from "@/lib/supabase/types";

type BorrowerEntity = Tables<"borrower_entities">;

interface BorrowerEntityListProps {
  borrowerId: string;
  entities: BorrowerEntity[];
}

export function BorrowerEntityList({
  borrowerId,
  entities,
}: BorrowerEntityListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<BorrowerEntity | null>(
    null
  );
  const router = useRouter();
  const confirm = useConfirm();

  function handleAdd() {
    setEditingEntity(null);
    setDialogOpen(true);
  }

  function handleEdit(entity: BorrowerEntity) {
    setEditingEntity(entity);
    setDialogOpen(true);
  }

  async function handleDelete(entity: BorrowerEntity) {
    const ok = await confirm({
      title: "Delete Entity",
      description: `Are you sure you want to delete "${entity.entity_name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    const result = await deleteEntityAction(entity.id);
    if (result.error) {
      showError("Could not delete entity", result.error);
    } else {
      showSuccess("Entity deleted");
      router.refresh();
    }
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditingEntity(null);
  }

  if (entities.length === 0 && !dialogOpen) {
    return (
      <div className="rounded-md border bg-card">
        <EmptyState
          icon={Building2}
          title="No entities yet"
          description="Add an LLC, Corporation, or other entity for this borrower."
          action={{ label: "Add Entity", onClick: handleAdd, icon: Plus }}
        />
        <BorrowerEntityDialog
          borrowerId={borrowerId}
          entity={editingEntity}
          open={dialogOpen}
          onClose={handleDialogClose}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map((entity) => (
          <Card key={entity.id}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold text-foreground">
                    {entity.entity_name}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(entity)}
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(entity)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {entity.entity_type.replace(/_/g, " ")}
                  </Badge>
                  {entity.state_of_formation && (
                    <span className="text-muted-foreground">
                      Formed in {entity.state_of_formation}
                    </span>
                  )}
                </div>

                {entity.ein && (
                  <p className="text-muted-foreground">EIN: {entity.ein}</p>
                )}

                {entity.address_line1 && (
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      {entity.address_line1}
                      {entity.address_line2 && `, ${entity.address_line2}`}
                      {entity.city && `, ${entity.city}`}
                      {entity.state && `, ${entity.state}`} {entity.zip}
                    </span>
                  </div>
                )}

                {entity.is_foreign_filed && entity.foreign_filed_states && (
                  <p className="text-muted-foreground">
                    Foreign filed in: {entity.foreign_filed_states.join(", ")}
                  </p>
                )}

                {entity.notes && (
                  <p className="text-muted-foreground text-xs mt-2">
                    {entity.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BorrowerEntityDialog
        borrowerId={borrowerId}
        entity={editingEntity}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
}
