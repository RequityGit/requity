"use client";

import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MergeFieldSelect } from "../MergeFieldSelect";
import type { SignatureSection, SignatureBlock, MergeFieldDefinition } from "../../styled-doc-parts/types";

interface SignatureEditorProps {
  section: SignatureSection;
  mergeFields: MergeFieldDefinition[];
  onChange: (section: SignatureSection) => void;
}

export function SignatureEditor({
  section,
  mergeFields,
  onChange,
}: SignatureEditorProps) {
  const updateBlock = (index: number, updates: Partial<SignatureBlock>) => {
    const blocks = [...section.blocks];
    blocks[index] = { ...blocks[index], ...updates };
    onChange({ ...section, blocks });
  };

  const removeBlock = (index: number) => {
    onChange({
      ...section,
      blocks: section.blocks.filter((_, i) => i !== index),
    });
  };

  const addBlock = () => {
    onChange({
      ...section,
      blocks: [...section.blocks, { role: "", show_date_line: true }],
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Title (optional)</Label>
        <Input
          value={section.title ?? ""}
          onChange={(e) => onChange({ ...section, title: e.target.value || undefined })}
          placeholder="e.g. Execution"
          className="h-8 text-xs mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Signer Blocks</Label>
        {section.blocks.map((block, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2 bg-background">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Role</Label>
                  <Input
                    value={block.role}
                    onChange={(e) => updateBlock(i, { role: e.target.value })}
                    placeholder="e.g. Lender, Borrower"
                    className="h-7 text-xs mt-0.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Name Field
                    </Label>
                    <div className="mt-0.5">
                      <MergeFieldSelect
                        mergeFields={mergeFields}
                        value={block.name_field}
                        onChange={(key) => updateBlock(i, { name_field: key })}
                        placeholder="Name..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Title Field
                    </Label>
                    <div className="mt-0.5">
                      <MergeFieldSelect
                        mergeFields={mergeFields}
                        value={block.title_field}
                        onChange={(key) => updateBlock(i, { title_field: key })}
                        placeholder="Title..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={block.show_date_line ?? false}
                    onCheckedChange={(checked) =>
                      updateBlock(i, { show_date_line: checked })
                    }
                    className="scale-75"
                  />
                  <Label className="text-[10px] text-muted-foreground">
                    Show date line
                  </Label>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeBlock(i)}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={addBlock}>
        <Plus size={12} className="mr-1" />
        Add Signer
      </Button>
    </div>
  );
}
