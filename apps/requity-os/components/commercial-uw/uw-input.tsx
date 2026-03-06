"use client";

import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { parseNumericInput } from "./format-utils";

interface UWInputProps {
  label?: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  small?: boolean;
  className?: string;
  width?: string;
  onChange?: (value: number) => void;
  onTextChange?: (value: string) => void;
}

export function UWInput({
  label,
  value,
  prefix,
  suffix,
  disabled,
  small,
  className,
  width,
  onChange,
  onTextChange,
}: UWInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    if (onChange) {
      onChange(parseNumericInput(localValue));
    }
    if (onTextChange) {
      onTextChange(localValue);
    }
  };

  return (
    <div className={cn("flex-1 min-w-0", width && `flex-none`)} style={width ? { width } : undefined}>
      {label && (
        <div className="text-[11px] font-medium text-muted-foreground mb-[5px]">
          {label}
        </div>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span
            className={cn(
              "absolute pointer-events-none text-muted-foreground",
              small ? "left-2 text-xs" : "left-3 text-[13px]"
            )}
          >
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          defaultValue={typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : value}
          disabled={disabled}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            "w-full rounded-lg border border-border bg-accent/50 text-foreground font-sans tabular-nums outline-none transition-colors",
            "focus:border-muted-foreground focus:ring-1 focus:ring-muted-foreground/25",
            "disabled:opacity-45 disabled:cursor-not-allowed",
            small ? "px-2 py-[5px] text-xs" : "px-3 py-2 text-[13px]",
            prefix && (small ? "pl-[22px]" : "pl-7"),
            suffix && "pr-8",
            className
          )}
        />
        {suffix && (
          <span className="absolute right-3 pointer-events-none text-muted-foreground text-xs">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface UWSelectProps {
  label?: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
}

export function UWSelect({ label, value, options, onChange }: UWSelectProps) {
  return (
    <div className="flex-1 min-w-0">
      {label && (
        <div className="text-[11px] font-medium text-muted-foreground mb-[5px]">
          {label}
        </div>
      )}
      <select
        defaultValue={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-border bg-accent/50 text-foreground px-3 py-2 text-[13px] font-sans outline-none cursor-pointer appearance-none transition-colors focus:border-muted-foreground"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "32px",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
