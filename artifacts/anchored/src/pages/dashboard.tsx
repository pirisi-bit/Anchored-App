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
  const { anchors, proofs, todayKey, loading, selfConfirm, addPhotoProof, addReceiptProof, getTodayProof } = useAnchors();
  const [activeAnchorForPhoto, setActiveAnchorForPhoto] = useState<Anchor | null>(null);
  const [activeAnchorForReceipt, setActiveAnchorForReceipt] = useState<Anchor | null>(null);

  const activeAnchors = anchors.filter(a => a.active);
  const todayProofs = proofs.filter(p => p.dateKey === todayKey);
  const completedCount = activeAnchors.filter(a => getTodayProof(a.id)).length;
  const progressPercent = activeAnchors.length > 0 ? (completedCount / activeAnchors.length) * 100 : 0;
  const allDone = activeAnchors.length > 0 && completedCount === activeAnchors.length;

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

      <div className="bg-card rounded-3xl p-6 shadow-sm border mb-8 text-center flex flex-col items-center">
        <h3 className="font-bold text-lg mb-2">{completedCount} of {activeAnchors.length} anchors verified today</h3>
        <Progress value={progressPercent} className="h-3 w-full mb-3" />
        <p className="text-muted-foreground text-sm font-medium">
          {allDone ? "All done! 🎉" : "Keep going!"}
        </p>
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
          activeAnchors.map(anchor => {
            const todayProof = getTodayProof(anchor.id);
            return (
              <AnchorCard
                key={anchor.id}
                anchor={anchor}
                proof={todayProof}
                onSelfConfirm={() => handleSelfConfirm(anchor.id)}
                onPhotoClick={() => setActiveAnchorForPhoto(anchor)}
                onReceiptClick={() => setActiveAnchorForReceipt(anchor)}
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
