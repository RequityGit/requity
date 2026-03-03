"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, Plus, Trash2, Variable } from "lucide-react";
import type { UserEmailTemplateVariable } from "@/lib/types/user-email-templates";

interface VariableManagerProps {
  variables: UserEmailTemplateVariable[];
  onChange: (variables: UserEmailTemplateVariable[]) => void;
}

const sourceColors: Record<string, string> = {
  contact: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  loan: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  computed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  static: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  user: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export function VariableManager({ variables, onChange }: VariableManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newVar, setNewVar] = useState<UserEmailTemplateVariable>({
    key: "",
    label: "",
    source: "static",
    sample: "",
  });

  function addVariable() {
    if (!newVar.key || !newVar.label) return;
    if (variables.some((v) => v.key === newVar.key)) return;
    onChange([...variables, { ...newVar }]);
    setNewVar({ key: "", label: "", source: "static", sample: "" });
  }

  function removeVariable(key: string) {
    onChange(variables.filter((v) => v.key !== key));
  }

  return (
    <Card>
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Variable className="h-4 w-4" />
            Available Variables ({variables.length})
          </CardTitle>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Key</TableHead>
                  <TableHead className="text-xs">Label</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Sample</TableHead>
                  <TableHead className="text-xs w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map((v) => (
                  <TableRow key={v.key}>
                    <TableCell className="font-mono text-[11px]">
                      {v.key}
                    </TableCell>
                    <TableCell className="text-xs">{v.label}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${sourceColors[v.source] ?? ""}`}
                      >
                        {v.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {v.sample}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeVariable(v.key)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Add new variable */}
          <div className="flex items-end gap-2 flex-wrap">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Key</label>
              <Input
                value={newVar.key}
                onChange={(e) =>
                  setNewVar((p) => ({ ...p, key: e.target.value }))
                }
                placeholder="custom_field"
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Label</label>
              <Input
                value={newVar.label}
                onChange={(e) =>
                  setNewVar((p) => ({ ...p, label: e.target.value }))
                }
                placeholder="Custom Field"
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Source</label>
              <Select
                value={newVar.source}
                onValueChange={(val) =>
                  setNewVar((p) => ({
                    ...p,
                    source: val as UserEmailTemplateVariable["source"],
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["contact", "loan", "computed", "static", "user"].map(
                    (s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Sample</label>
              <Input
                value={newVar.sample}
                onChange={(e) =>
                  setNewVar((p) => ({ ...p, sample: e.target.value }))
                }
                placeholder="Sample value"
                className="h-8 text-xs w-36"
              />
            </div>
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={addVariable}
              disabled={!newVar.key || !newVar.label}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
