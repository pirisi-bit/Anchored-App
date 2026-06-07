import { useState } from "react";
import { Anchor, Proof, Category } from "@/lib/storage";
import { getAnchorEmoji, getAnchorTint } from "@/lib/anchor-emoji";
import { StatusBadge } from "./StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Check, Camera, Receipt, Mic, RotateCcw, Plus } from "lucide-react";
import { format } from "date-fns";
import { useT } from "@/lib/lang-context";
import { cn } from "@/lib/utils";

type Method = "self" | "photo" | "receipt" | "voice";

interface AnchorCardProps {
  anchor: Anchor;
  proof?: Proof;
  proofCount?: number;
  onSelfConfirm: () => void | Promise<void>;
  onPhotoClick: () => void | Promise<void>;
  onReceiptClick: () => void | Promise<void>;
  onVoiceClick: () => void | Promise<void>;
  onReset: () => void | Promise<void>;
  onViewProof?: () => void;
  highlighted?: boolean;
}

export function getCategoryColor(category: Category) {
  switch (category) {
    case "Home Safety": return "bg-brand-sage";
    case "Medication": return "bg-brand-sky";
    case "Bills & Receipts": return "bg-brand-yellow";
    case "Personal Care": return "bg-brand-lavender";
    case "Pet Care": return "bg-brand-orange";
    case "Other": return "bg-muted";
    default: return "bg-muted";
  }
}

export function AnchorCard({
  anchor,
  proof,
  proofCount = 0,
  onSelfConfirm,
  onPhotoClick,
  onReceiptClick,
  onVoiceClick,
  onReset,
  onViewProof,
  highlighted,
}: AnchorCardProps) {
  const t = useT();
  const isDone = !!proof;
  const emoji = getAnchorEmoji(anchor);
  const tint = getAnchorTint(anchor);
  const [busy, setBusy] = useState<Method | null>(null);
  // When already verified, the user can tap "Log another check" to re-open the
  // method picker for an additional same-day verification.
  const [reVerifying, setReVerifying] = useState(false);

  const showPicker = !isDone || reVerifying;

  const run = async (method: Method, action: () => void | Promise<void>) => {
    if (busy) return;
    setBusy(method);
    try {
      await action();
      setReVerifying(false);
    } finally {
      setBusy(null);
    }
  };

  const lastTime = proof ? format(new Date(proof.createdAt), "p") : "";

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-4 shadow-sm border flex flex-col gap-3 transition-colors",
        isDone && "bg-brand-sage/[0.06] border-brand-sage/30",
        highlighted && "ring-2 ring-primary ring-offset-2",
      )}
      data-testid={`card-anchor-${anchor.id}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl leading-none",
            tint,
          )}
          aria-hidden
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base leading-snug truncate">{anchor.name}</h3>
          <p className="text-xs text-muted-foreground">{anchor.category}</p>
        </div>
        <StatusBadge status={proof ? proof.status : "Unverified"} />
      </div>

      {/* When verified, show the check summary (count + last time). */}
      {isDone && !reVerifying && (
        <p className="text-xs font-medium text-brand-sage px-0.5">
          {proofCount > 1
            ? t.anchor.verifiedTimes(proofCount, lastTime)
            : t.anchor.verifiedOnce(lastTime)}
        </p>
      )}

      {showPicker && (
        <div className="flex flex-col gap-1 pt-1">
          <p className="text-xs font-semibold text-muted-foreground px-1 pb-1">
            {reVerifying ? t.anchor.checkAgainHint : t.anchor.howVerify}
          </p>
          <MethodRow
            icon={<Check className="w-4 h-4" />}
            label={t.anchor.selfConfirm}
            hint={t.anchor.selfConfirmHint}
            checked={busy === "self"}
            disabled={busy !== null && busy !== "self"}
            onActivate={() => run("self", onSelfConfirm)}
            testId={`btn-self-confirm-${anchor.id}`}
          />
          <MethodRow
            icon={<Camera className="w-4 h-4" />}
            label={t.anchor.photo}
            hint={t.anchor.photoHint}
            checked={busy === "photo"}
            disabled={busy !== null && busy !== "photo"}
            onActivate={() => run("photo", onPhotoClick)}
            testId={`btn-photo-${anchor.id}`}
          />
          <MethodRow
            icon={<Receipt className="w-4 h-4" />}
            label={t.anchor.receipt}
            hint={t.anchor.receiptHint}
            checked={busy === "receipt"}
            disabled={busy !== null && busy !== "receipt"}
            onActivate={() => run("receipt", onReceiptClick)}
            testId={`btn-receipt-${anchor.id}`}
          />
          <MethodRow
            icon={<Mic className="w-4 h-4" />}
            label={t.anchor.voice}
            hint={t.anchor.voiceHint}
            checked={busy === "voice"}
            disabled={busy !== null && busy !== "voice"}
            onActivate={() => run("voice", onVoiceClick)}
            testId={`btn-voice-${anchor.id}`}
          />
          {reVerifying && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground self-start mt-1 px-1"
              onClick={() => setReVerifying(false)}
              disabled={busy !== null}
            >
              {t.tutorial.skip}
            </button>
          )}
        </div>
      )}

      {isDone && !reVerifying && (
        <div className="flex items-center justify-between pt-0.5">
          <button
            className="text-xs text-primary font-medium hover:underline"
            onClick={onViewProof}
            data-testid={`link-view-proof-${anchor.id}`}
          >
            {t.anchor.viewProof}
          </button>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              onClick={() => setReVerifying(true)}
              disabled={busy !== null}
              data-testid={`btn-log-another-${anchor.id}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {t.anchor.logAnother}
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              onClick={() => run("self", onReset)}
              disabled={busy !== null}
              data-testid={`btn-reset-${anchor.id}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.anchor.undoLast}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface MethodRowProps {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onActivate: () => void;
  testId: string;
}

function MethodRow({ icon, label, hint, checked, disabled, onActivate, testId }: MethodRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5 transition-opacity",
        disabled && "opacity-50",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-foreground/70 border">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(on) => { if (on) onActivate(); }}
        data-testid={testId}
        aria-label={`Verify with ${label}`}
      />
    </div>
  );
}
