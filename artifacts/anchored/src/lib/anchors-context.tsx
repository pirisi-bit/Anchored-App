import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  Anchor,
  Proof,
  getAnchors,
  getProofs,
  insertAnchors,
  updateAnchor,
  insertProof,
  deleteProofById,
  getTodayKey,
  clearData,
} from "./storage";
import { useAuth } from "./auth-context";

interface AnchorsContextType {
  anchors: Anchor[];
  proofs: Proof[];
  todayKey: string;
  loading: boolean;
  addAnchors: (newAnchors: Anchor[]) => Promise<void>;
  updateAnchorState: (anchor: Anchor) => Promise<void>;
  selfConfirm: (anchorId: string) => Promise<void>;
  addPhotoProof: (anchorId: string, photoUrl: string) => Promise<void>;
  addReceiptProof: (anchorId: string, receiptUrl: string) => Promise<void>;
  addVoiceProof: (anchorId: string, voiceUrl: string) => Promise<void>;
  resetProof: (anchorId: string) => Promise<void>;
  getTodayProof: (anchorId: string) => Proof | undefined;
  getTodayProofs: (anchorId: string) => Proof[];
  refresh: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const AnchorsContext = createContext<AnchorsContextType | undefined>(undefined);

export function AnchorsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const todayKey = getTodayKey();

  const refresh = useCallback(async () => {
    if (!user) {
      setAnchors([]);
      setProofs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [loadedAnchors, loadedProofs] = await Promise.all([getAnchors(), getProofs()]);
      setAnchors(loadedAnchors);
      setProofs(loadedProofs);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addAnchors = async (newAnchors: Anchor[]) => {
    await insertAnchors(newAnchors);
    await refresh();
  };

  const updateAnchorState = async (anchor: Anchor) => {
    await updateAnchor(anchor);
    await refresh();
  };

  const selfConfirm = async (anchorId: string) => {
    await insertProof({
      id: crypto.randomUUID(),
      anchorId,
      dateKey: todayKey,
      status: "Self-confirmed",
      verificationMethod: "Self-confirm",
      createdAt: new Date().toISOString(),
    });
    await refresh();
  };

  const addPhotoProof = async (anchorId: string, photoUrl: string) => {
    await insertProof({
      id: crypto.randomUUID(),
      anchorId,
      dateKey: todayKey,
      status: "Verified",
      verificationMethod: "Photo",
      photoUrl,
      createdAt: new Date().toISOString(),
    });
    await refresh();
  };

  const addReceiptProof = async (anchorId: string, receiptUrl: string) => {
    await insertProof({
      id: crypto.randomUUID(),
      anchorId,
      dateKey: todayKey,
      status: "Verified",
      verificationMethod: "Receipt",
      receiptUrl,
      createdAt: new Date().toISOString(),
    });
    await refresh();
  };

  const addVoiceProof = async (anchorId: string, voiceUrl: string) => {
    await insertProof({
      id: crypto.randomUUID(),
      anchorId,
      dateKey: todayKey,
      status: "Verified",
      verificationMethod: "Voice",
      voiceUrl,
      createdAt: new Date().toISOString(),
    });
    await refresh();
  };

  // "Undo last" — removes only the most recent check for today, so earlier
  // checks of the same anchor remain in the timeline.
  const resetProof = async (anchorId: string) => {
    const todays = proofs
      .filter((p) => p.anchorId === anchorId && p.dateKey === todayKey)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latest = todays[0];
    if (!latest) return;
    await deleteProofById(latest.id);
    await refresh();
  };

  // Latest proof for today (proofs are loaded newest-first).
  const getTodayProof = (anchorId: string) => {
    return proofs.find((p) => p.anchorId === anchorId && p.dateKey === todayKey);
  };

  const getTodayProofs = (anchorId: string) => {
    return proofs.filter((p) => p.anchorId === anchorId && p.dateKey === todayKey);
  };

  const clearAll = async () => {
    await clearData();
    await refresh();
  };

  return (
    <AnchorsContext.Provider
      value={{
        anchors,
        proofs,
        todayKey,
        loading,
        addAnchors,
        updateAnchorState,
        selfConfirm,
        addPhotoProof,
        addReceiptProof,
        addVoiceProof,
        resetProof,
        getTodayProof,
        getTodayProofs,
        refresh,
        clearAll,
      }}
    >
      {children}
    </AnchorsContext.Provider>
  );
}

export function useAnchors() {
  const context = useContext(AnchorsContext);
  if (context === undefined) {
    throw new Error("useAnchors must be used within an AnchorsProvider");
  }
  return context;
}
