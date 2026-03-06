import { redirect } from "next/navigation";

export default function DSCRLendersRedirect() {
  redirect("/admin/models/dscr?tab=lenders");
}
