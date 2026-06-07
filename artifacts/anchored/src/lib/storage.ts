import { supabase } from "./supabase-client";

export type VerificationMethod = "Self-confirm" | "Photo" | "Receipt" | "Voice";
export type ProofStatus = "Unverified" | "Self-confirmed" | "Verified";

// Open string so users can create their own categories. The predefined set is
// available as PREDEFINED_CATEGORIES for UI pickers.
export type Category = string;

export const PREDEFINED_CATEGORIES = [
  "Home Safety",
  "Medication",
  "Bills & Receipts",
  "Personal Care",
  "Pet Care",
  "Other",
] as const;

export interface AnchorReminder {
  enabled: boolean;
  days: number[];   // 0=Sun … 6=Sat; empty = every day
  hour: number;     // 0–23
  minute: number;   // 0, 15, 30, 45
}

export interface Anchor {
  id: string;
  name: string;
  category: Category;
  verificationMethod: VerificationMethod;
  active: boolean;
  createdAt: string;
  emoji?: string;
  color?: string;
  reminder?: AnchorReminder;
}

export interface Proof {
  id: string;
  anchorId: string;
  dateKey: string;
  status: ProofStatus;
  verificationMethod: VerificationMethod;
  photoUrl?: string;
  receiptUrl?: string;
  voiceUrl?: string;
  createdAt: string;
}

interface AnchorRow {
  id: string;
  user_id: string;
  name: string;
  category: Category;
  verification_method: VerificationMethod;
  active: boolean;
  created_at: string;
  emoji?: string | null;
  color?: string | null;
  reminder?: AnchorReminder | null;
}

interface ProofRow {
  id: string;
  user_id: string;
  anchor_id: string;
  date_key: string;
  status: ProofStatus;
  verification_method: VerificationMethod;
  photo_url: string | null;
  receipt_url: string | null;
  voice_url: string | null;
  created_at: string;
}

function mapAnchor(row: AnchorRow): Anchor {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    verificationMethod: row.verification_method,
    active: row.active,
    createdAt: row.created_at,
    emoji: row.emoji ?? undefined,
    color: row.color ?? undefined,
    reminder: row.reminder ?? undefined,
  };
}

function mapProof(row: ProofRow): Proof {
  return {
    id: row.id,
    anchorId: row.anchor_id,
    dateKey: row.date_key,
    status: row.status,
    verificationMethod: row.verification_method,
    photoUrl: row.photo_url ?? undefined,
    receiptUrl: row.receipt_url ?? undefined,
    voiceUrl: row.voice_url ?? undefined,
    createdAt: row.created_at,
  };
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function getAnchors(): Promise<Anchor[]> {
  const { data, error } = await supabase
    .from("anchors")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as AnchorRow[]).map(mapAnchor);
}

export async function insertAnchors(anchors: Anchor[]): Promise<void> {
  if (anchors.length === 0) return;
  const userId = await currentUserId();
  const rows = anchors.map((a) => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    category: a.category,
    verification_method: a.verificationMethod,
    active: a.active,
    created_at: a.createdAt,
    ...(a.emoji ? { emoji: a.emoji } : {}),
    ...(a.color ? { color: a.color } : {}),
    ...(a.reminder ? { reminder: a.reminder } : {}),
  }));
  const { error } = await supabase.from("anchors").insert(rows);
  if (error) throw error;
}

export async function updateAnchor(anchor: Anchor): Promise<void> {
  const { error } = await supabase
    .from("anchors")
    .update({
      name: anchor.name,
      category: anchor.category,
      verification_method: anchor.verificationMethod,
      active: anchor.active,
      ...(anchor.emoji ? { emoji: anchor.emoji } : {}),
      ...(anchor.color ? { color: anchor.color } : {}),
      reminder: anchor.reminder ?? null,
    })
    .eq("id", anchor.id);
  if (error) throw error;
}

// Targeted single-column updates so unrelated columns (especially ones that
// may not yet exist in older schema versions) never appear in the payload.

export async function setAnchorActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("anchors")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export async function setAnchorReminder(
  id: string,
  reminder: AnchorReminder | null,
): Promise<void> {
  const { error } = await supabase
    .from("anchors")
    .update({ reminder })
    .eq("id", id);
  if (error) throw error;
}

export async function getProofs(): Promise<Proof[]> {
  const { data, error } = await supabase
    .from("proofs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ProofRow[]).map(mapProof);
}

// Each verification is its own row — users may log several checks for the same
// anchor in a single day (see migration 0004).
export async function insertProof(proof: Proof): Promise<void> {
  const userId = await currentUserId();
  const row = {
    id: proof.id,
    user_id: userId,
    anchor_id: proof.anchorId,
    date_key: proof.dateKey,
    status: proof.status,
    verification_method: proof.verificationMethod,
    photo_url: proof.photoUrl ?? null,
    receipt_url: proof.receiptUrl ?? null,
    voice_url: proof.voiceUrl ?? null,
    created_at: proof.createdAt,
  };
  const { error } = await supabase.from("proofs").insert(row);
  if (error) throw error;
}

export async function deleteProofById(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("proofs")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

export async function clearData(): Promise<void> {
  const userId = await currentUserId();
  const proofsResult = await supabase.from("proofs").delete().eq("user_id", userId);
  if (proofsResult.error) throw proofsResult.error;
  const anchorsResult = await supabase.from("anchors").delete().eq("user_id", userId);
  if (anchorsResult.error) throw anchorsResult.error;
}

export function getTodayKey(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
