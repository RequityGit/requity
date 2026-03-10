"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, FileText } from "lucide-react";

interface ResumePromptProps {
  onResume: () => void;
  onStartFresh: () => void;
  stepProgress: string;
}

export function ResumePrompt({ onResume, onStartFresh, stepProgress }: ResumePromptProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-6 space-y-4">
        <div className="text-center">
          <RefreshCw size={24} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Resume your application?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You have an in-progress application ({stepProgress}). Would you like to pick up where you left off?
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onStartFresh}>
            <FileText size={16} strokeWidth={1.5} className="mr-2" />
            Start fresh
          </Button>
          <Button className="flex-1" onClick={onResume}>
            <RefreshCw size={16} strokeWidth={1.5} className="mr-2" />
            Resume
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
