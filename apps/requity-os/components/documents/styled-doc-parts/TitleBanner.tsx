import type { LayoutTitleBanner } from "./types";

interface TitleBannerProps {
  banner: LayoutTitleBanner;
  mergeData: Record<string, string>;
}

export function TitleBanner({ banner, mergeData }: TitleBannerProps) {
  const issuedDate = banner.date_field ? mergeData[banner.date_field] : undefined;
  const expirationDate = banner.expiration_field ? mergeData[banner.expiration_field] : undefined;

  return (
    <div className="title-banner mt-6 p-4 px-5 bg-foreground rounded-lg flex justify-between items-center flex-wrap gap-3">
      <div>
        <h1
          className="font-bold text-background"
          style={{ fontSize: "18px", letterSpacing: "-0.04em", margin: 0 }}
        >
          {banner.title}
        </h1>
        {banner.subtitle && (
          <p style={{ fontSize: "12px", color: "hsl(0 0% 60%)", margin: "2px 0 0" }}>
            {banner.subtitle}
          </p>
        )}
      </div>
      {(issuedDate || expirationDate) && (
        <div className="text-right">
          {issuedDate && (
            <div style={{ fontSize: "11px", color: "hsl(0 0% 60%)" }}>
              Issued: {issuedDate}
            </div>
          )}
          {expirationDate && (
            <div
              className="text-destructive"
              style={{ fontSize: "11px", fontWeight: 600, marginTop: "2px" }}
            >
              Expires: {expirationDate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
