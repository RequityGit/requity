import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Company not found"
      description="This company may have been deleted or you may not have access."
      backTo={{ label: "Back to Companies", href: "/companies" }}
    />
  );
}
