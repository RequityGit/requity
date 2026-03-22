import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Contact not found"
      description="This contact may have been deleted or you may not have access."
      backTo={{ label: "Back to Contacts", href: "/contacts" }}
    />
  );
}
