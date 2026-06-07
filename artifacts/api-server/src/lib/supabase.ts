import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

export const RECEIPTS_BUCKET = "receipts";

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedClient;
}

let bucketReady = false;

// Mime types the receipts bucket accepts: images + PDF (receipts/photos) and
// audio (voice-note proofs). Wildcards keep this robust across the various
// audio container subtypes browsers/native emit (audio/webm, audio/mp4,
// audio/m4a, audio/x-m4a, ...). Per-request validation still happens against
// the stricter ALLOWED_MIME set in routes/receipts.ts.
const BUCKET_ALLOWED_MIME = ["image/*", "application/pdf", "audio/*"];

export async function ensureReceiptsBucket(): Promise<void> {
  if (bucketReady) return;

  const supabase = getSupabase();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list Supabase storage buckets: ${listError.message}`);
  }

  const exists = buckets?.some((b) => b.name === RECEIPTS_BUCKET);

  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(RECEIPTS_BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: BUCKET_ALLOWED_MIME,
    });

    if (createError) {
      throw new Error(`Failed to create receipts bucket: ${createError.message}`);
    }

    logger.info({ bucket: RECEIPTS_BUCKET }, "Created Supabase storage bucket");
  } else {
    // An existing bucket may have been created before audio (voice notes) was
    // supported, so its allowedMimeTypes would reject .m4a uploads. Update it
    // so voice-note proofs can be stored.
    const { error: updateError } = await supabase.storage.updateBucket(RECEIPTS_BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: BUCKET_ALLOWED_MIME,
    });

    if (updateError) {
      throw new Error(`Failed to update receipts bucket: ${updateError.message}`);
    }

    logger.info({ bucket: RECEIPTS_BUCKET }, "Ensured Supabase storage bucket accepts current mime types");
  }

  bucketReady = true;
}
