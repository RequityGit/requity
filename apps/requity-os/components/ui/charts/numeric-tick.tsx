"use client"

interface NumericTickProps {
  x?: number
  y?: number
  payload?: { value: string | number }
  anchor?: "start" | "middle" | "end"
}

export const NumericTick = ({
  x,
  y,
  payload,
  anchor = "middle",
}: NumericTickProps) => (
  <text
    x={x}
    y={(y ?? 0) + 12}
    textAnchor={anchor}
    fill="hsl(var(--muted-foreground))"
    fontSize={11}
    fontFamily="Inter, sans-serif"
    style={{
      fontVariantNumeric: "tabular-nums",
      fontFeatureSettings: '"tnum"',
    }}
  >
    {payload?.value}
  </text>
)
