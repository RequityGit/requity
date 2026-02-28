"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Building2, Plus, Pencil, Trash2, MapPin, FileText } from "lucide-react";
import { BorrowerEntityDialog } from "@/components/admin/borrower-entity-dialog";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { BorrowerEntity } from "@/lib/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { toast } = useToast();

  function handleAdd() {
    setEditingEntity(null);
    setDialogOpen(true);
  }

  function handleEdit(entity: BorrowerEntity) {
    setEditingEntity(entity);
    setDialogOpen(true);
  }

  async function handleDelete(entityId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("borrower_entities")
      .delete()
      .eq("id", entityId);

    if (error) {
      toast({
        title: "Error deleting entity",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Entity deleted" });
      router.refresh();
    }
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditingEntity(null);
  }

  if (entities.length === 0 && !dialogOpen) {
    return (
      <div className="rounded-md border bg-navy-mid p-8 text-center">
        <Building2 className="mx-auto h-10 w-10 text-surface-muted mb-3" />
        <h3 className="text-sm font-semibold text-surface-white mb-1">
          No entities yet
        </h3>
        <p className="text-sm text-surface-muted mb-4">
          Add an LLC, Corporation, or other entity for this borrower.
        </p>
        <Button size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entity
        </Button>
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
                  <Building2 className="h-4 w-4 text-surface-muted" />
                  <h4 className="font-semibold text-surface-white">
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-status-danger hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entity</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{entity.entity_name}&quot;?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(entity.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {entity.entity_type.replace(/_/g, " ")}
                  </Badge>
                  {entity.state_of_formation && (
                    <span className="text-surface-muted">
                      Formed in {entity.state_of_formation}
                    </span>
                  )}
                </div>

                {entity.ein && (
                  <p className="text-surface-muted">EIN: {entity.ein}</p>
                )}

                {entity.address_line1 && (
                  <div className="flex items-start gap-1.5 text-surface-muted">
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
                  <p className="text-surface-muted">
                    Foreign filed in: {entity.foreign_filed_states.join(", ")}
                  </p>
                )}

                {entity.notes && (
                  <p className="text-surface-muted text-xs mt-2">
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
