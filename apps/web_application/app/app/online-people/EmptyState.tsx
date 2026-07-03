import React from "react";
import { UsersRound } from "lucide-react";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-65 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center animate-in fade-in-50 duration-500">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/50">
        <UsersRound className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          No users to show
        </p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {message}
        </p>
      </div>
    </div>
  );
}

export default EmptyState;
