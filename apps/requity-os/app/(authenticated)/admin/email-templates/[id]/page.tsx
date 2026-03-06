import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmailTemplateDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/control-center/email-templates/${id}`);
}
