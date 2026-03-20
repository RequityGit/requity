"use client";

import { FormEngine } from "../FormEngine";
import type { FormEngineProps } from "@/lib/form-engine/types";

type FormPageProps = Omit<FormEngineProps, "context">;

export function FormPage(props: FormPageProps) {
  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <p className="text-sm font-semibold text-foreground tracking-tight">Requity Group</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
        <FormEngine {...props} context="page" />
      </main>
      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Powered by Requity Group
          </p>
        </div>
      </footer>
    </div>
  );
}
