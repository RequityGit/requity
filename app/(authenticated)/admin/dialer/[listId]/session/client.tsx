"use client";

import { DialerProvider } from "@/lib/dialer/dialer-context";
import { DialerSession } from "@/components/dialer/DialerSession";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function DialerSessionClient({ listId }: { listId: string }) {
  return (
    <DialerProvider>
      <div className="space-y-4">
        <PageHeader
          title="Dialing Session"
          description="Power dialer active session."
          action={
            <Link href={`/admin/dialer/${listId}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                Back to List
              </Button>
            </Link>
          }
        />
        <DialerSession listId={listId} />
      </div>
    </DialerProvider>
  );
}
