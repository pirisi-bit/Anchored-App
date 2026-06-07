import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import * as Crypto from "expo-crypto";
import {
  type Anchor,
  type Proof,
  getAnchors,
  getProofs,
  insertAnchors,
  updateAnchor,
  setAnchorActive,
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
  toggleAnchorActive: (id: string, active: boolean) => Promise<void>;
  selfConfirm: (anchorId: string) => Promise<void>;
  addPhotoProof: (anchorId: string, photoUrl: string) => Promise<void>;
  addReceiptProof: (anchorId: string, receiptUrl: string) => Promise<void>;
  addVoiceProof: (anchorId: string, voiceUrl: string) => Promise<void>;
  getTodayProof: (anchorId: string) => Proof | undefined;
  getTodayProofs: (anchorId: string) => Proof[];
  resetProof: (anchorId: string) => Promise<void>;
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
      const [loadedAnchors, loadedProofs] = await Promise.all([
        getAnchors(),
        getProofs(),
      ]);
      setAnchors(loadedAnchors);
      setProofs(loadedProofs);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Background re-fetch — never sets loading=true so the UI never blanks out.
  const silentRefresh = useCallback(async () => {
    if (!user) return;
    try {
      const [loadedAnchors, loadedProofs] = await Promise.all([
        getAnchors(),
        getProofs(),
      ]);
      setAnchors(loadedAnchors);
      setProofs(loadedProofs);
    } catch {
      // silently ignore — optimistic state remains until next successful fetch
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
    await silentRefresh();
  };

  // Toggle active/inactive — only writes the `active` column.
  const toggleAnchorActive = async (id: string, active: boolean) => {
    await setAnchorActive(id, active);
    await silentRefresh();
  };

  const selfConfirm = async (anchorId: string) => {
    await insertProof({
      id: Crypto.randomUUID(),
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
      id: Crypto.randomUUID(),
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
      id: Crypto.randomUUID(),
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
      id: Crypto.randomUUID(),
      anchorId,
      dateKey: todayKey,
      status: "Verified",
      verificationMethod: "Voice",
      voiceUrl,
      createdAt: new Date().toISOString(),
    });
    await refresh();
  };

  const getTodayProofs = (anchorId: string) => {
    return proofs
      .filter((p) => p.anchorId === anchorId && p.dateKey === todayKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };

  const getTodayProof = (anchorId: string) => {
    return getTodayProofs(anchorId)[0];
  };

  const resetProof = async (anchorId: string) => {
    const latest = getTodayProofs(anchorId)[0];
    if (!latest) return;
    await deleteProofById(latest.id);
    await refresh();
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
        toggleAnchorActive,
        selfConfirm,
        addPhotoProof,
        addReceiptProof,
        addVoiceProof,
        getTodayProof,
        getTodayProofs,
        resetProof,
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
