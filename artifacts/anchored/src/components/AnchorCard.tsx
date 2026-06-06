import { Anchor, Proof, Category } from "@/lib/storage";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Camera, Check, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnchorCardProps {
  anchor: Anchor;
  proof?: Proof;
  onSelfConfirm: () => void;
  onPhotoClick: () => void;
  onReceiptClick: () => void;
  onViewProof?: () => void;
}

export function getCategoryColor(category: Category) {
  switch (category) {
    case "Home Safety": return "bg-brand-sage";
    case "Medication": return "bg-brand-sky";
    case "Bills & Receipts": return "bg-brand-yellow";
    case "Personal Care": return "bg-brand-lavender";
    case "Pet Care": return "bg-brand-orange";
    default: return "bg-muted";
  }
}

export function AnchorCard({ anchor, proof, onSelfConfirm, onPhotoClick, onReceiptClick, onViewProof }: AnchorCardProps) {
  const isDone = !!proof;

  return (
    <div
      className="bg-card rounded-2xl p-4 shadow-sm border flex flex-col gap-3"
      data-testid={`card-anchor-${anchor.id}`}
    >
      {/* Top row: colored dot + name + category */}
      <div className="flex items-center gap-3">
        <div className={cn("w-3 h-3 rounded-full shrink-0", getCategoryColor(anchor.category))} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base leading-snug">{anchor.name}</h3>
          <p className="text-xs text-muted-foreground">{anchor.category}</p>
        </div>
        <StatusBadge status={proof ? proof.status : "Unverified"} />
      </div>

      {/* Bottom row: action buttons — equal width, icon over label so nothing gets clipped */}
      {!isDone && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 rounded-xl py-2.5 text-xs font-medium"
            onClick={onSelfConfirm}
            data-testid={`btn-self-confirm-${anchor.id}`}
          >
            <Check className="w-4 h-4" />
            Confirm
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 rounded-xl py-2.5 text-xs font-medium"
            onClick={onPhotoClick}
            data-testid={`btn-photo-${anchor.id}`}
          >
            <Camera className="w-4 h-4" />
            Photo
          </Button>
          <Button
            className="h-auto flex-col gap-1 rounded-xl py-2.5 text-xs font-medium"
            onClick={onReceiptClick}
            data-testid={`btn-receipt-${anchor.id}`}
          >
            <Receipt className="w-4 h-4" />
            Receipt
          </Button>
        </div>
      )}

      {isDone && (
        <button
          className="text-xs text-primary font-medium text-left pt-0.5 hover:underline"
          onClick={onViewProof}
          data-testid={`link-view-proof-${anchor.id}`}
        >
          View Proof →
        </button>
      )}
    </div>
  );
}
