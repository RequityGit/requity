// DEPRECATED: The Card Type Manager has been replaced by deterministic
// DealFlavor derivation in lib/pipeline/deal-display-config.ts.
// This page is no longer linked from the control center sidebar.
// Safe to delete this file and the entire card-types/ directory.

import { redirect } from "next/navigation";

export default function CardTypesPage() {
  redirect("/control-center");
}
