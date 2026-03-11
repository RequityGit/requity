import type { LayoutDisclaimer } from "./types";

interface DisclaimerBlockProps {
  disclaimer: LayoutDisclaimer;
}

export function DisclaimerBlock({ disclaimer }: DisclaimerBlockProps) {
  return (
    <div className="disclaimer-box mt-8 p-4 px-5 bg-muted rounded-lg border-l-[3px] border-muted-foreground">
      <p
        className="text-muted-foreground leading-relaxed"
        style={{ fontSize: "10.5px", fontWeight: 400, lineHeight: 1.7, margin: 0 }}
      >
        {disclaimer.label && (
          <strong style={{ fontWeight: 600 }}>{disclaimer.label} </strong>
        )}
        {disclaimer.text}
      </p>
    </div>
  );
}
