import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Fund not found"
      description="This fund may have been deleted or you may not have access."
      backTo={{ label: "Back to Dashboard", href: "/i" }}
    />
  );
}
