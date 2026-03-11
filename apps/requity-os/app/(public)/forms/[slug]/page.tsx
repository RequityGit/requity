"use client";

import { useParams, useSearchParams } from "next/navigation";
import { FormPage } from "@/components/forms/contexts/FormPage";

export default function PublicFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const sessionToken = searchParams.get("t") || undefined;

  return (
    <FormPage
      formSlug={slug}
      sessionToken={sessionToken}
    />
  );
}
