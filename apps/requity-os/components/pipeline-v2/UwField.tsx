"use client";

import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UwFieldDef } from "./pipeline-types";

interface UwFieldProps {
  field: UwFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
}

export function UwField({ field, value, onChange, onBlur, disabled }: UwFieldProps) {
  switch (field.type) {
    case "currency":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={value != null ? String(value) : ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              onBlur={onBlur}
              disabled={disabled}
              className="pl-7 text-right num"
              placeholder="0"
            />
          </div>
        </div>
      );
    case "percent":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={value != null ? String(value) : ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              onBlur={onBlur}
              disabled={disabled}
              className="pr-7 text-right num"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
      );
    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) =>
              onChange(e.target.value ? Number(e.target.value) : null)
            }
            onBlur={onBlur}
            disabled={disabled}
            className="num"
            placeholder="0"
          />
        </div>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between py-2">
          <Label className="text-xs">{field.label}</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => {
              onChange(checked);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );
    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Select
            value={value != null ? String(value) : ""}
            onValueChange={(val) => {
              onChange(val);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <DatePicker
            value={value != null ? String(value) : ""}
            onChange={(val) => {
              onChange(val || null);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );
    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="text"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value || null)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={field.label}
          />
        </div>
      );
  }
}
