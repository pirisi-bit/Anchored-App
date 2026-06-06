import { Link } from "wouter";
import { Anchor, Proof, Category } from "@/lib/storage";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Camera, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnchorCardProps {
  anchor: Anchor;
  proof?: Proof;
  onSelfConfirm: () => void;
  onPhotoClick: () => void;
  onViewProof?: () => void;
}

export function getCategoryColor(category: Category) {
  switch (category) {
    case "Home Safety": return "bg-brand-sage text-white";
    case "Medication": return "bg-brand-sky text-white";
    case "Bills & Receipts": return "bg-brand-yellow text-amber-900";
    case "Personal Care": return "bg-brand-lavender text-white";
    case "Pet Care": return "bg-brand-orange text-white";
    default: return "bg-muted text-muted-foreground";
  }
}

export function AnchorCard({ anchor, proof, onSelfConfirm, onPhotoClick, onViewProof }: AnchorCardProps) {
  const isVerified = proof && proof.status === "Verified";
  const isSelfConfirmed = proof && proof.status === "Self-confirmed";

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between gap-4" data-testid={`card-anchor-${anchor.id}`}>
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        <div className={cn("w-3 h-3 rounded-full shrink-0", getCategoryColor(anchor.category))} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base truncate">{anchor.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{anchor.category}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <StatusBadge status={proof ? proof.status : "Unverified"} />
        
        {!proof && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={onSelfConfirm} data-testid={`btn-self-confirm-${anchor.id}`}>
              Self-confirm
            </Button>
            <Button size="sm" className="h-8 rounded-full px-3 text-xs gap-1.5" onClick={onPhotoClick} data-testid={`btn-photo-${anchor.id}`}>
              <Camera className="w-3.5 h-3.5" />
              Photo
            </Button>
          </div>
        )}

        {(isVerified || isSelfConfirmed) && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" onClick={onViewProof} data-testid={`link-view-proof-${anchor.id}`}>
            View Proof
          </Button>
        )}
      </div>
    </div>
  );
}
