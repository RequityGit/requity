import { PageHeader } from "@/components/shared/page-header";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat"
        description="Conversations and messaging across your team."
      />
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted mb-4">
          <MessageSquare className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start a chat to begin messaging with your team.
        </p>
      </div>
    </div>
  );
}
