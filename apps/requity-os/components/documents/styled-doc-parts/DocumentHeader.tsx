import { cn } from "@/lib/utils";
import type { LayoutHeader } from "./types";

interface DocumentHeaderProps {
  header: LayoutHeader;
}

function LogoMark({ entity, subtitle }: { entity: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center shrink-0">
        <span
          className="text-background font-extrabold"
          style={{ fontSize: "15px", letterSpacing: "-0.03em" }}
        >
          R
        </span>
      </div>
      <div>
        <div
          className="font-bold text-foreground"
          style={{ fontSize: "16px", letterSpacing: "-0.03em", lineHeight: 1.2 }}
        >
          {entity}
        </div>
        {subtitle && (
          <div
            className="text-muted-foreground"
            style={{ fontSize: "11px", letterSpacing: "0.02em" }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentHeader({ header }: DocumentHeaderProps) {
  const showLogo = header.show_logo !== false;
  const hasContact = header.address || header.phone || header.email || header.website;

  return (
    <div className="px-7 pt-7 pb-5 border-b">
      <div className="flex justify-between items-start flex-wrap gap-4">
        {showLogo ? (
          <LogoMark entity={header.entity} subtitle={header.subtitle} />
        ) : (
          <div>
            <div
              className="font-bold text-foreground"
              style={{ fontSize: "16px", letterSpacing: "-0.03em", lineHeight: 1.2 }}
            >
              {header.entity}
            </div>
            {header.subtitle && (
              <div
                className="text-muted-foreground"
                style={{ fontSize: "11px", letterSpacing: "0.02em" }}
              >
                {header.subtitle}
              </div>
            )}
          </div>
        )}

        {hasContact && (
          <div
            className="text-muted-foreground text-right leading-relaxed"
            style={{ fontSize: "11px" }}
          >
            {header.address && <div>{header.address}</div>}
            {header.phone && <div>{header.phone}</div>}
            {header.email && <div>{header.email}</div>}
            {header.website && <div>{header.website}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
