import { redirect } from "next/navigation";

export default async function PricingResultsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { run } = await searchParams;
  if (run) {
    redirect(`/admin/models/dscr/price/results?run=${run}`);
  }
  redirect("/admin/models/dscr?tab=pipeline");
}
