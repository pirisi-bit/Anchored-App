import { ProofStatus } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface StatusBadgeProps {
  status: ProofStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Verified") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-sage/10 text-brand-sage text-xs font-semibold" data-testid={`badge-${status}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </div>
    );
  }

  if (status === "Self-confirmed") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-yellow/20 text-yellow-700 text-xs font-semibold" data-testid={`badge-${status}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        Self-confirmed
      </div>
    );
  }

  return (
    <div className="flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold" data-testid={`badge-${status}`}>
      Unverified
    </div>
  );
}
