import { useState } from "react";
import { useLocation } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { AnchorCard } from "@/components/AnchorCard";
import { PhotoSheet } from "@/components/PhotoSheet";
import { ReceiptSheet } from "@/components/ReceiptSheet";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Anchor } from "@/lib/storage";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { anchors, loading, selfConfirm, addPhotoProof, addReceiptProof, resetProof, getTodayProof } = useAnchors();
  const [activeAnchorForPhoto, setActiveAnchorForPhoto] = useState<Anchor | null>(null);
  const [activeAnchorForReceipt, setActiveAnchorForReceipt] = useState<Anchor | null>(null);

  // Deactivated anchors never appear on the dashboard.
  const activeAnchors = anchors.filter(a => a.active);
  const completedCount = activeAnchors.filter(a => getTodayProof(a.id)).length;
  const pendingCount = activeAnchors.length - completedCount;
  const progressPercent = activeAnchors.length > 0 ? (completedCount / activeAnchors.length) * 100 : 0;
  const allDone = activeAnchors.length > 0 && completedCount === activeAnchors.length;

  // Show the ones still needing proof first, verified ones (with Reset) below.
  const sortedAnchors = [...activeAnchors].sort((a, b) => {
    const aDone = getTodayProof(a.id) ? 1 : 0;
    const bDone = getTodayProof(b.id) ? 1 : 0;
    return aDone - bDone;
  });

  const handleReset = async (anchorId: string) => {
    try {
      await resetProof(anchorId);
      toast.success("Reset. You can verify it again.");
    } catch (e) {
      toast.error("Could not reset. Please try again.");
    }
  };

  const handleSelfConfirm = async (anchorId: string) => {
    try {
      await selfConfirm(anchorId);
      toast.success("Future You has proof. ✓");
    } catch (e) {
      toast.error("Could not save. Please try again.");
    }
  };

  const handlePhotoSave = async (photoUrl: string) => {
    if (activeAnchorForPhoto) {
      const anchorId = activeAnchorForPhoto.id;
      setActiveAnchorForPhoto(null);
      try {
        await addPhotoProof(anchorId, photoUrl);
        toast.success("Proof saved. ✓");
      } catch (e) {
        toast.error("Could not save proof. Please try again.");
      }
    }
  };

  const handleReceiptSave = async (receiptUrl: string) => {
    if (activeAnchorForReceipt) {
      const anchorId = activeAnchorForReceipt.id;
      setActiveAnchorForReceipt(null);
      try {
        await addReceiptProof(anchorId, receiptUrl);
        toast.success("Receipt saved. ✓");
      } catch (e) {
        toast.error("Could not save receipt. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8">
      <header className="mb-6">
        <h2 className="text-muted-foreground font-medium mb-1 text-sm">{format(new Date(), "EEEE, MMMM d")}</h2>
        <h1 className="text-3xl font-extrabold tracking-tight">Anchored</h1>
      </header>

      <div className="bg-card rounded-3xl p-6 shadow-sm border mb-8 flex flex-col items-center">
        <h3 className="font-bold text-lg mb-3 text-center">{completedCount} of {activeAnchors.length} anchors verified today</h3>
        <Progress value={progressPercent} className="h-3 w-full mb-4" />
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="rounded-2xl bg-brand-sage/10 py-3 flex flex-col items-center" data-testid="stat-verified">
            <span className="text-2xl font-extrabold text-brand-sage leading-none">{completedCount}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">Verified</span>
          </div>
          <div className="rounded-2xl bg-muted py-3 flex flex-col items-center" data-testid="stat-pending">
            <span className="text-2xl font-extrabold leading-none">{pendingCount}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">Pending</span>
          </div>
        </div>
        {allDone && (
          <p className="text-brand-sage text-sm font-semibold mt-4">All done for today! 🎉</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : activeAnchors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No active anchors.</p>
            <button className="text-primary font-medium underline" onClick={() => setLocation("/onboarding")}>Add some anchors</button>
          </div>
        ) : (
          sortedAnchors.map(anchor => {
            const todayProof = getTodayProof(anchor.id);
            return (
              <AnchorCard
                key={anchor.id}
                anchor={anchor}
                proof={todayProof}
                onSelfConfirm={() => handleSelfConfirm(anchor.id)}
                onPhotoClick={() => setActiveAnchorForPhoto(anchor)}
                onReceiptClick={() => setActiveAnchorForReceipt(anchor)}
                onReset={() => handleReset(anchor.id)}
                onViewProof={() => todayProof && setLocation(`/proof/${todayProof.id}`)}
              />
            );
          })
        )}
      </div>

      <PhotoSheet
        open={!!activeAnchorForPhoto}
        onOpenChange={(open) => !open && setActiveAnchorForPhoto(null)}
        anchorName={activeAnchorForPhoto?.name || ""}
        onSave={handlePhotoSave}
      />

      <ReceiptSheet
        open={!!activeAnchorForReceipt}
        onOpenChange={(open) => !open && setActiveAnchorForReceipt(null)}
        anchorName={activeAnchorForReceipt?.name || ""}
        onSave={handleReceiptSave}
      />
    </div>
  );
}
