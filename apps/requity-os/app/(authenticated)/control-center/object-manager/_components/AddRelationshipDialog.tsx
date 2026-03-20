"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ObjectDefinition } from "../actions";
import { getObjectIcon } from "./constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentObjectKey: string;
  objects: ObjectDefinition[];
  onSubmit: (input: {
    parent_object_key: string;
    child_object_key: string;
    cardinality: string;
  }) => void;
}

const CARDINALITY_OPTIONS = [
  { value: "one_to_one", label: "One to One" },
  { value: "one_to_many", label: "One to Many" },
  { value: "many_to_many", label: "Many to Many" },
];

export function AddRelationshipDialog({
  open,
  onOpenChange,
  currentObjectKey,
  objects,
  onSubmit,
}: Props) {
  const [direction, setDirection] = useState<"parent" | "child">("parent");
  const [targetObjectKey, setTargetObjectKey] = useState("");
  const [cardinality, setCardinality] = useState("one_to_many");

  const otherObjects = objects.filter((o) => o.object_key !== currentObjectKey);

  const handleSubmit = () => {
    if (!targetObjectKey) return;
    onSubmit({
      parent_object_key:
        direction === "parent" ? currentObjectKey : targetObjectKey,
      child_object_key:
        direction === "parent" ? targetObjectKey : currentObjectKey,
      cardinality,
    });
    setDirection("parent");
    setTargetObjectKey("");
    setCardinality("one_to_many");
  };

  const currentObject = objects.find((o) => o.object_key === currentObjectKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Direction</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as "parent" | "child")}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">
                  {currentObject?.label} is Parent
                </SelectItem>
                <SelectItem value="child">
                  {currentObject?.label} is Child
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Related Object</Label>
            <Select value={targetObjectKey} onValueChange={setTargetObjectKey}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue placeholder="Select an object..." />
              </SelectTrigger>
              <SelectContent>
                {otherObjects.map((obj) => {
                  const ObjIcon = getObjectIcon(obj.icon);
                  return (
                    <SelectItem key={obj.object_key} value={obj.object_key}>
                      <span className="flex items-center gap-1.5">
                        <ObjIcon size={12} style={{ color: obj.color }} />
                        {obj.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cardinality</Label>
            <Select value={cardinality} onValueChange={setCardinality}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARDINALITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!targetObjectKey}>
            Create Relationship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
