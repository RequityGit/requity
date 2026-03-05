import { redirect } from "next/navigation";

export default function DSCRRateSheetsRedirect() {
  redirect("/admin/models/dscr?tab=rate-sheets");
}
