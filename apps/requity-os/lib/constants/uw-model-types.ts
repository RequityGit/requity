export type UWModelType = "commercial" | "rtl" | "dscr" | "guc" | "equity";

export const UW_MODEL_LABELS: Record<UWModelType, string> = {
  commercial: "Commercial UW",
  rtl: "Fix & Flip / RTL",
  dscr: "DSCR Calculator",
  guc: "Ground-Up Construction",
  equity: "Equity Model",
};

export function getUWModelForLoanType(loanType: string | null | undefined): UWModelType {
  switch (loanType) {
    case "commercial":
      return "commercial";
    case "rtl":
    case "fix_and_flip":
      return "rtl";
    case "dscr":
      return "dscr";
    case "guc":
    case "construction":
      return "guc";
    case "equity":
      return "equity";
    default:
      return "dscr";
  }
}
