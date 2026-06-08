import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryColor } from "@/components/AnchorCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, Mic, ShieldAlert, Receipt as ReceiptIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function isPdfUrl(url: string): boolean {
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export default function ProofReview() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/proof/:id");
  const { proofs, anchors, loading } = useAnchors();
  const t = useT();

  const proof = proofs.find(p => p.id === params?.id);
  const anchor = proof ? anchors.find(a => a.id === proof.anchorId) : undefined;

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center max-w-md mx-auto px-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proof || !anchor) {
    return (
      <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8">
        <button
          className="flex items-center gap-1 text-primary font-medium mb-8"
          onClick={() => setLocation("/proof")}
          data-testid="btn-back"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <p className="font-medium text-lg text-foreground">Proof not found.</p>
          <p>It may have been cleared or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isSelfConfirmed = proof.status === "Self-confirmed";

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8">
      <button
        className="flex items-center gap-1 text-primary font-medium mb-6 -ml-1"
        onClick={() => setLocation("/proof")}
        data-testid="btn-back"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <header className="mb-6">
        <p className="text-xs font-medium text-muted-foreground mb-2">PROOF REVIEW</p>
        <div className="flex items-center gap-3">
          <div className={cn("w-3.5 h-3.5 rounded-full shrink-0", getCategoryColor(anchor.category))} />
          <h1 className="text-2xl font-extrabold tracking-tight leading-tight">{t.templateNames[anchor.name] ?? anchor.name}</h1>
        </div>
      </header>

      {isSelfConfirmed && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-yellow-300/60 bg-brand-yellow/15 p-4 mb-6"
          data-testid="card-self-confirmed-warning"
        >
          <ShieldAlert className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-yellow-800">Self-confirmed</p>
            <p className="text-sm text-yellow-800/80">This item was self-confirmed without evidence.</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl p-5 shadow-sm border mb-6">
        <DetailRow label="Mark" value={t.templateNames[anchor.name] ?? anchor.name} />
        <DetailRow label="Category" value={anchor.category} />
        <DetailRow label="Status" value={<StatusBadge status={proof.status} />} />
        <DetailRow label="Verification Method" value={proof.verificationMethod} />
        <DetailRow label="Timestamp" value={format(new Date(proof.createdAt), "MMM d, yyyy · h:mm a")} />
      </div>

      {(proof.photoUrl || proof.receiptUrl || proof.voiceUrl) && (
        <div className="flex flex-col gap-5">
          {proof.photoUrl && (
            <section data-testid="section-photo">
              <h2 className="flex items-center gap-2 text-sm font-bold mb-3">
                <Camera className="w-4 h-4 text-muted-foreground" />
                Photo
              </h2>
              <div className="rounded-2xl overflow-hidden border shadow-sm bg-muted">
                <img src={proof.photoUrl} alt="Proof photo" className="w-full h-auto object-cover" />
              </div>
            </section>
          )}

          {proof.receiptUrl && (
            <section data-testid="section-receipt">
              <h2 className="flex items-center gap-2 text-sm font-bold mb-3">
                <ReceiptIcon className="w-4 h-4 text-muted-foreground" />
                Receipt
              </h2>
              {isPdfUrl(proof.receiptUrl) ? (
                <div className="rounded-2xl overflow-hidden border shadow-sm bg-card">
                  <object
                    data={proof.receiptUrl}
                    type="application/pdf"
                    className="w-full h-[420px] bg-muted"
                    aria-label="Receipt PDF preview"
                  >
                    <div className="flex flex-col items-center gap-3 p-8 text-center">
                      <FileText className="w-10 h-10 text-brand-orange" />
                      <p className="text-sm text-muted-foreground">PDF preview isn't supported here.</p>
                    </div>
                  </object>
                  <a
                    href={proof.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border-t py-3 text-sm font-medium text-primary hover:underline"
                    data-testid="link-open-receipt-pdf"
                  >
                    <FileText className="w-4 h-4" />
                    Open PDF
                  </a>
                </div>
              ) : (
                <a href={proof.receiptUrl} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden border shadow-sm bg-muted">
                  <img src={proof.receiptUrl} alt="Receipt" className="w-full h-auto object-cover" />
                </a>
              )}
            </section>
          )}

          {proof.voiceUrl && (
            <section data-testid="section-voice">
              <h2 className="flex items-center gap-2 text-sm font-bold mb-3">
                <Mic className="w-4 h-4 text-muted-foreground" />
                Voice Recording
              </h2>
              <div className="rounded-2xl border shadow-sm bg-card p-4">
                <audio controls src={proof.voiceUrl} className="w-full" />
              </div>
            </section>
          )}
        </div>
      )}

      <div className="mt-auto pt-8">
        <Button
          variant="outline"
          className="w-full rounded-full h-12 font-medium"
          onClick={() => setLocation("/proof")}
          data-testid="btn-done"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
