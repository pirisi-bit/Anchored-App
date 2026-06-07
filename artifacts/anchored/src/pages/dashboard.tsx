import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { AnchorCard } from "@/components/AnchorCard";
import { PhotoSheet } from "@/components/PhotoSheet";
import { ReceiptSheet } from "@/components/ReceiptSheet";
import { VoiceSheet } from "@/components/VoiceSheet";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Anchor } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Filter = "all" | "verified" | "pending";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { anchors, loading, selfConfirm, addPhotoProof, addReceiptProof, addVoiceProof, resetProof, getTodayProof, getTodayProofs } = useAnchors();
  const t = useT();
  const [activeAnchorForPhoto, setActiveAnchorForPhoto] = useState<Anchor | null>(null);
  const [activeAnchorForReceipt, setActiveAnchorForReceipt] = useState<Anchor | null>(null);
  const [activeAnchorForVoice, setActiveAnchorForVoice] = useState<Anchor | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showTutorial, setShowTutorial] = useState(false);

  // Show tutorial on first login; also listen for manual trigger from settings
  useEffect(() => {
    const seen = localStorage.getItem("anchored-tutorial-seen");
    if (!seen) setShowTutorial(true);

    const handler = () => setShowTutorial(true);
    window.addEventListener("show-tutorial", handler);
    return () => window.removeEventListener("show-tutorial", handler);
  }, []);

  const activeAnchors = anchors.filter(a => a.active);
  const completedCount = activeAnchors.filter(a => getTodayProof(a.id)).length;
  const pendingCount = activeAnchors.length - completedCount;
  const progressPercent = activeAnchors.length > 0 ? (completedCount / activeAnchors.length) * 100 : 0;
  const allDone = activeAnchors.length > 0 && completedCount === activeAnchors.length;

  // Sort: pending first (not done), then verified
  const sortedAnchors = [...activeAnchors].sort((a, b) => {
    const aDone = getTodayProof(a.id) ? 1 : 0;
    const bDone = getTodayProof(b.id) ? 1 : 0;
    return aDone - bDone;
  });

  // Apply filter
  const visibleAnchors = sortedAnchors.filter((a) => {
    if (filter === "verified") return !!getTodayProof(a.id);
    if (filter === "pending") return !getTodayProof(a.id);
    return true;
  });

  function toggleFilter(clicked: "verified" | "pending") {
    setFilter((prev) => (prev === clicked ? "all" : clicked));
  }

  const handleReset = async (anchorId: string) => {
    try {
      await resetProof(anchorId);
      toast.success(t.success.proofReset);
    } catch {
      toast.error(t.errors.couldNotReset);
    }
  };

  const handleSelfConfirm = async (anchorId: string) => {
    try {
      await selfConfirm(anchorId);
      toast.success("Future You has proof. ✓");
    } catch {
      toast.error(t.errors.couldNotSave);
    }
  };

  const handlePhotoSave = async (photoUrl: string) => {
    if (activeAnchorForPhoto) {
      const anchorId = activeAnchorForPhoto.id;
      setActiveAnchorForPhoto(null);
      try {
        await addPhotoProof(anchorId, photoUrl);
        toast.success("Proof saved. ✓");
      } catch {
        toast.error(t.errors.couldNotSave);
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
      } catch {
        toast.error(t.errors.couldNotSave);
      }
    }
  };

  const handleVoiceSave = async (voiceUrl: string) => {
    if (activeAnchorForVoice) {
      const anchorId = activeAnchorForVoice.id;
      setActiveAnchorForVoice(null);
      try {
        await addVoiceProof(anchorId, voiceUrl);
        toast.success("Voice proof saved. ✓");
      } catch {
        toast.error(t.errors.couldNotSave);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8">
      <header className="mb-6">
        <h2 className="text-muted-foreground font-medium mb-1 text-sm">{format(new Date(), "EEEE, MMMM d")}</h2>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.dashboard.title}</h1>
      </header>

      {/* Progress card */}
      <div className="bg-card rounded-3xl p-6 shadow-sm border mb-6 flex flex-col items-center">
        <h3 className="font-bold text-lg mb-3 text-center">
          {t.dashboard.verifiedOf(completedCount, activeAnchors.length)}
        </h3>
        <Progress value={progressPercent} className="h-3 w-full mb-4" />

        {/* Clickable stat cards */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => toggleFilter("verified")}
            className={cn(
              "rounded-2xl py-3 flex flex-col items-center transition-all active:scale-95 select-none",
              filter === "verified"
                ? "bg-brand-sage/30 ring-2 ring-brand-sage"
                : "bg-brand-sage/10 hover:bg-brand-sage/20"
            )}
            data-testid="stat-verified"
          >
            <span className="text-2xl font-extrabold text-brand-sage leading-none">{completedCount}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">{t.dashboard.verified}</span>
          </button>

          <button
            onClick={() => toggleFilter("pending")}
            className={cn(
              "rounded-2xl py-3 flex flex-col items-center transition-all active:scale-95 select-none",
              filter === "pending"
                ? "bg-muted/60 ring-2 ring-border"
                : "bg-muted hover:bg-muted/70"
            )}
            data-testid="stat-pending"
          >
            <span className="text-2xl font-extrabold leading-none">{pendingCount}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">{t.dashboard.pending}</span>
          </button>
        </div>

        {allDone && filter === "all" && (
          <p className="text-brand-sage text-sm font-semibold mt-4">{t.dashboard.allDone}</p>
        )}
      </div>

      {/* Active filter chip */}
      {filter !== "all" && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-semibold text-muted-foreground">
            {filter === "verified" ? t.dashboard.filterVerified : t.dashboard.filterPending}
          </span>
          <button
            onClick={() => setFilter("all")}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted rounded-full px-2.5 py-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Show all
          </button>
        </div>
      )}

      {/* Anchor list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : activeAnchors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">{t.dashboard.noAnchors}</p>
            <button className="text-primary font-medium underline" onClick={() => setLocation("/onboarding")}>
              {t.dashboard.addAnchors}
            </button>
          </div>
        ) : visibleAnchors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {filter === "verified" ? "Nothing verified yet today." : "All anchors verified! 🎉"}
          </div>
        ) : (
          visibleAnchors.map(anchor => {
            const todayProof = getTodayProof(anchor.id);
            const todayCount = getTodayProofs(anchor.id).length;
            return (
              <AnchorCard
                key={anchor.id}
                anchor={anchor}
                proof={todayProof}
                proofCount={todayCount}
                onSelfConfirm={() => handleSelfConfirm(anchor.id)}
                onPhotoClick={() => setActiveAnchorForPhoto(anchor)}
                onReceiptClick={() => setActiveAnchorForReceipt(anchor)}
                onVoiceClick={() => setActiveAnchorForVoice(anchor)}
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

      <VoiceSheet
        open={!!activeAnchorForVoice}
        onOpenChange={(open) => !open && setActiveAnchorForVoice(null)}
        anchorName={activeAnchorForVoice?.name || ""}
        onSave={handleVoiceSave}
      />

      <TutorialOverlay
        open={showTutorial}
        onClose={() => {
          localStorage.setItem("anchored-tutorial-seen", "1");
          setShowTutorial(false);
        }}
      />
    </div>
  );
}
