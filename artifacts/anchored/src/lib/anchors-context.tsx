import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  Anchor, 
  Proof, 
  getAnchors, 
  getProofs, 
  saveAnchor, 
  saveAnchors as storageSaveAnchors, 
  saveProof, 
  getTodayKey,
  clearData
} from "./storage";

interface AnchorsContextType {
  anchors: Anchor[];
  proofs: Proof[];
  todayKey: string;
  addAnchors: (newAnchors: Anchor[]) => void;
  updateAnchorState: (anchor: Anchor) => void;
  selfConfirm: (anchorId: string) => void;
  addPhotoProof: (anchorId: string, photoUrl: string) => void;
  getTodayProof: (anchorId: string) => Proof | undefined;
  refresh: () => void;
  clearAll: () => void;
}

const AnchorsContext = createContext<AnchorsContextType | undefined>(undefined);

export function AnchorsProvider({ children }: { children: ReactNode }) {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const todayKey = getTodayKey();

  const refresh = () => {
    setAnchors(getAnchors());
    setProofs(getProofs());
  };

  useEffect(() => {
    refresh();
  }, []);

  const addAnchors = (newAnchors: Anchor[]) => {
    const existing = getAnchors();
    storageSaveAnchors([...existing, ...newAnchors]);
    refresh();
  };

  const updateAnchorState = (anchor: Anchor) => {
    const existing = getAnchors();
    const index = existing.findIndex(a => a.id === anchor.id);
    if (index !== -1) {
      existing[index] = anchor;
      storageSaveAnchors(existing);
      refresh();
    }
  };

  const selfConfirm = (anchorId: string) => {
    saveProof({
      id: crypto.randomUUID(),
      anchorId,
      dateKey: todayKey,
      status: "Self-confirmed",
      verificationMethod: "Self-confirm",
      createdAt: new Date().toISOString()
    });
    refresh();
  };

  const addPhotoProof = (anchorId: string, photoUrl: string) => {
    saveProof({
      id: crypto.randomUUID(),
      anchorId,
      dateKey: todayKey,
      status: "Verified",
      verificationMethod: "Photo",
      photoUrl,
      createdAt: new Date().toISOString()
    });
    refresh();
  };

  const getTodayProof = (anchorId: string) => {
    return proofs.find(p => p.anchorId === anchorId && p.dateKey === todayKey);
  };

  const clearAll = () => {
    clearData();
    refresh();
  };

  return (
    <AnchorsContext.Provider value={{
      anchors,
      proofs,
      todayKey,
      addAnchors,
      updateAnchorState,
      selfConfirm,
      addPhotoProof,
      getTodayProof,
      refresh,
      clearAll
    }}>
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
