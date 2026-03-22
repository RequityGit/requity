import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FundNotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[40vh] px-6">
      <div className="rounded-full bg-muted/60 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-foreground text-base">Investment not found</h3>
      <p className="mt-1.5 max-w-sm text-muted-foreground text-sm">
        This investment may have been deleted or you don&apos;t have access to it.
      </p>
      <div className="mt-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/funds">Back to funds</Link>
        </Button>
      </div>
    </div>
  );
}
