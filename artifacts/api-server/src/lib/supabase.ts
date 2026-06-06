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
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "application/pdf"],
    });

    if (createError) {
      throw new Error(`Failed to create receipts bucket: ${createError.message}`);
    }

    logger.info({ bucket: RECEIPTS_BUCKET }, "Created Supabase storage bucket");
  }

  bucketReady = true;
}
