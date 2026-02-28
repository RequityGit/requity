"use client";

import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  className?: string;
  detailed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function CurrencyDisplay({
  amount,
  className,
  detailed = false,
  size = "md",
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: detailed ? 2 : 0,
    maximumFractionDigits: detailed ? 2 : 0,
  }).format(amount ?? 0);

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        SIZE_CLASSES[size],
        className
      )}
    >
      {formatted}
    </span>
  );
}
