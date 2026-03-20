"use client";

import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BulletListSection } from "../../styled-doc-parts/types";

interface BulletListEditorProps {
  section: BulletListSection;
  onChange: (section: BulletListSection) => void;
}

export function BulletListEditor({ section, onChange }: BulletListEditorProps) {
  const updateItem = (index: number, value: string) => {
    const items = [...section.items];
    items[index] = value;
    onChange({ ...section, items });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= section.items.length) return;
    const items = [...section.items];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    onChange({ ...section, items });
  };

  const removeItem = (index: number) => {
    onChange({ ...section, items: section.items.filter((_, i) => i !== index) });
  };

  const addItem = () => {
    onChange({ ...section, items: [...section.items, ""] });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Section Title</Label>
        <Input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="h-8 text-xs mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Items</Label>
        {section.items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder="Bullet item text"
              className="h-7 text-xs flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => moveItem(i, -1)}
              disabled={i === 0}
            >
              <ChevronUp size={11} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => moveItem(i, 1)}
              disabled={i === section.items.length - 1}
            >
              <ChevronDown size={11} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(i)}
            >
              <Trash2 size={11} />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus size={12} className="mr-1" />
        Add Item
      </Button>
    </div>
  );
}
