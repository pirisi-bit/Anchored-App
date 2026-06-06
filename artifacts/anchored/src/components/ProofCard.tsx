import { format } from "date-fns";
import { useLocation } from "wouter";
import { Anchor, Proof } from "@/lib/storage";
import { StatusBadge } from "./StatusBadge";
import { getCategoryColor } from "./AnchorCard";
import { cn } from "@/lib/utils";

interface ProofCardProps {
  proof: Proof;
  anchor?: Anchor;
}

export function ProofCard({ proof, anchor }: ProofCardProps) {
  const [, setLocation] = useLocation();
  if (!anchor) return null;

  return (
    <button
      type="button"
      onClick={() => setLocation(`/proof/${proof.id}`)}
      className="w-full text-left bg-card rounded-2xl p-4 shadow-sm border flex flex-col gap-3 transition-transform active:scale-[0.98] hover:shadow-md"
      data-testid={`card-proof-${proof.id}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", getCategoryColor(anchor.category))} />
          <h3 className="font-bold text-sm">{anchor.name}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{format(new Date(proof.createdAt), "h:mm a")}</span>
      </div>

      <div className="flex justify-between items-end">
        <StatusBadge status={proof.status} />
        {proof.photoUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden border">
            <img src={proof.photoUrl} alt="Proof" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </button>
  );
}
