import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ModuleAccessPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
          <Shield size={18} strokeWidth={1.5} className="text-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Module Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure which modules each role can access.
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Module access configuration coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
