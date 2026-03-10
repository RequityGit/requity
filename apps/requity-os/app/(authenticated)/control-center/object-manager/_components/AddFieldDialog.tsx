"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FIELD_TYPES } from "./constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    field_label: string;
    field_key: string;
    field_type: string;
  }) => void;
}

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function AddFieldDialog({ open, onOpenChange, onSubmit }: Props) {
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState("text");
  const [autoKey, setAutoKey] = useState(true);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (autoKey) {
      setKey(toSnakeCase(val));
    }
  };

  const handleKeyChange = (val: string) => {
    setAutoKey(false);
    setKey(val);
  };

  const handleSubmit = () => {
    if (!label.trim() || !key.trim()) return;
    onSubmit({ field_label: label.trim(), field_key: key.trim(), field_type: type });
    setLabel("");
    setKey("");
    setType("text");
    setAutoKey(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Display Name</Label>
            <Input
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. Interest Rate"
              className="h-8 text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">API Key</Label>
            <Input
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="e.g. interest_rate"
              className="h-8 text-xs font-mono mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Field Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft.key} value={ft.key}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!label.trim() || !key.trim()}>
            Create Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
