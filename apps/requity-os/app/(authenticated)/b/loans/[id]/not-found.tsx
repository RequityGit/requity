import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Loan not found"
      description="This loan may have been deleted or you may not have access."
      backTo={{ label: "Back to Dashboard", href: "/b" }}
    />
  );
}
