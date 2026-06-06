export type VerificationMethod = "Self-confirm" | "Photo" | "Receipt";
export type ProofStatus = "Unverified" | "Self-confirmed" | "Verified";

export type Category = "Home Safety" | "Medication" | "Bills & Receipts" | "Personal Care" | "Pet Care";

export interface Anchor {
  id: string;
  name: string;
  category: Category;
  verificationMethod: VerificationMethod;
  active: boolean;
  createdAt: string;
}

export interface Proof {
  id: string;
  anchorId: string;
  dateKey: string; // "2025-06-06"
  status: ProofStatus;
  verificationMethod: VerificationMethod;
  photoUrl?: string;
  receiptUrl?: string;
  voiceUrl?: string;
  createdAt: string;
}

export function getAnchors(): Anchor[] {
  try {
    const data = localStorage.getItem("anchored_anchors");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveAnchor(anchor: Anchor): void {
  const anchors = getAnchors();
  anchors.push(anchor);
  localStorage.setItem("anchored_anchors", JSON.stringify(anchors));
}

export function updateAnchor(anchor: Anchor): void {
  const anchors = getAnchors();
  const index = anchors.findIndex(a => a.id === anchor.id);
  if (index !== -1) {
    anchors[index] = anchor;
    localStorage.setItem("anchored_anchors", JSON.stringify(anchors));
  }
}

export function saveAnchors(anchors: Anchor[]): void {
  localStorage.setItem("anchored_anchors", JSON.stringify(anchors));
}

export function getProofs(dateKey?: string): Proof[] {
  try {
    const data = localStorage.getItem("anchored_proofs");
    let proofs: Proof[] = data ? JSON.parse(data) : [];
    if (dateKey) {
      proofs = proofs.filter(p => p.dateKey === dateKey);
    }
    return proofs;
  } catch (e) {
    return [];
  }
}

export function saveProof(proof: Proof): void {
  const proofs = getProofs();
  const index = proofs.findIndex(p => p.anchorId === proof.anchorId && p.dateKey === proof.dateKey);
  if (index !== -1) {
    proofs[index] = proof;
  } else {
    proofs.push(proof);
  }
  localStorage.setItem("anchored_proofs", JSON.stringify(proofs));
}

export function clearData(): void {
  localStorage.removeItem("anchored_anchors");
  localStorage.removeItem("anchored_proofs");
}

export function getTodayKey(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}