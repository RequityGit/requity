import type { LayoutFooter } from "./types";

interface DocumentFooterProps {
  footer: LayoutFooter;
}

export function DocumentFooter({ footer }: DocumentFooterProps) {
  return (
    <div className="mt-7 pt-4 border-t flex justify-between items-end">
      <div>
        <div className="text-foreground" style={{ fontSize: "11px", fontWeight: 600 }}>
          {footer.entity}
        </div>
        {footer.nmls && (
          <div className="text-muted-foreground mt-0.5" style={{ fontSize: "10.5px" }}>
            NMLS #{footer.nmls}
          </div>
        )}
      </div>
      <div className="text-muted-foreground text-right" style={{ fontSize: "10px" }}>
        {footer.confidential && (
          <>
            Confidential · For intended recipient only
            <br />
          </>
        )}
        {footer.generated_by}
      </div>
    </div>
  );
}
