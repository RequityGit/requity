import { CommercialUWShell } from "@/components/commercial-uw/commercial-uw-shell";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommercialUnderwritingPage({ params }: Props) {
  const { id } = await params;

  return <CommercialUWShell dealId={id} dealName="123 Test Deal" />;
}
