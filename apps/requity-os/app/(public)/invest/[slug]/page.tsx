import { SoftCommitmentFormPage } from "@/components/fundraising/SoftCommitmentFormPage";

export const metadata = {
  title: "Invest | Requity Group",
  description: "Express your interest in a Requity Group investment opportunity.",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InvestSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <SoftCommitmentFormPage slug={slug} />;
}
