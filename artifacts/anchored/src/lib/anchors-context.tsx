import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import {
  Anchor,
  AnchorReminder,
  Proof,
  getAnchors,
  getProofs,
  insertAnchors,
  updateAnchor,
  setAnchorActive,
  setAnchorReminder,
  deleteAnchor as storageDeleteAnchor,
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
  deleteAnchor: (id: string) => Promise<void>;
  saveAnchorReminder: (id: string, reminder: AnchorReminder | null) => Promise<void>;
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
  // Tracks which user's data is currently loaded. Without this, after the
  // initial no-user refresh sets loading=false with empty anchors, a freshly
  // logged-in user has one render where loading reads false and anchors are
  // still []. Routing gates would then send them to onboarding even though
  // they have anchors. We treat data as "not ready" until it's loaded for the
  // current user id.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  // Monotonic token so overlapping refreshes (e.g. fast logout/login or account
  // switch) can't commit stale results: only the latest refresh is allowed to
  // write state. Prevents both obsolete data overwrites and a stuck loading gate.
  const refreshToken = useRef(0);
  const todayKey = getTodayKey();

  const refresh = useCallback(async () => {
    const token = ++refreshToken.current;
    if (!user) {
      setAnchors([]);
      setProofs([]);
      setLoadedUserId(null);
      setLoading(false);
      return;
    }
    const userId = user.id;
    setLoading(true);
    try {
      const [loadedAnchors, loadedProofs] = await Promise.all([getAnchors(), getProofs()]);
      if (token !== refreshToken.current) return;
      setAnchors(loadedAnchors);
      setProofs(loadedProofs);
      setLoadedUserId(userId);
    } finally {
      if (token === refreshToken.current) setLoading(false);
    }
  }, [user]);

  // Background re-fetch that never sets loading=true — used after mutations so
  // the UI never blanks out to a spinner while the updated data syncs back.
  const silentRefresh = useCallback(async () => {
    const token = ++refreshToken.current;
    if (!user) return;
    const userId = user.id;
    try {
      const [loadedAnchors, loadedProofs] = await Promise.all([getAnchors(), getProofs()]);
      if (token !== refreshToken.current) return;
      setAnchors(loadedAnchors);
      setProofs(loadedProofs);
      setLoadedUserId(userId);
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

  // Toggle active/inactive — only writes the `active` column so an absent
  // `reminder` column (pre-migration) never causes the update to fail.
  const toggleAnchorActive = async (id: string, active: boolean) => {
    await setAnchorActive(id, active);
    await silentRefresh();
  };

  const deleteAnchor = async (id: string) => {
    await storageDeleteAnchor(id);
    await silentRefresh();
  };

  // Save or clear a reminder — only writes the `reminder` column.
  const saveAnchorReminder = async (id: string, reminder: AnchorReminder | null) => {
    await setAnchorReminder(id, reminder);
    await silentRefresh();
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

  // For a logged-in user, treat data as still loading until it has actually
  // been fetched for that user id. This avoids a brief stale window (empty
  // anchors + loading=false) right after login that would mis-route the user.
  const effectiveLoading = user ? loading || loadedUserId !== user.id : loading;

  return (
    <AnchorsContext.Provider
      value={{
        anchors,
        proofs,
        todayKey,
        loading: effectiveLoading,
        addAnchors,
        updateAnchorState,
        toggleAnchorActive,
        deleteAnchor,
        saveAnchorReminder,
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
