import { redirect } from "next/navigation";

export default function DSCRPriceRedirect() {
  redirect("/admin/models/dscr?tab=pricing");
}
