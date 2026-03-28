import { redirect } from "next/navigation";

interface LoanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  redirect("/b/dashboard");
}
