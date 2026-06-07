---
name: Supabase Storage bucket allowedMimeTypes
description: Why adding a new upload type (e.g. audio) can 415 even after the server allowlist is updated.
---

# Supabase Storage bucket allowedMimeTypes

A bucket's `allowedMimeTypes` is fixed at `createBucket` time. If the bucket
already exists, `createBucket` is skipped, so newly-supported types are NEVER
applied and uploads fail with StorageApiError 415 "mime type X is not supported"
— even if the Express/multer route-level allowlist accepts them.

**Why:** the error looks like a route bug but originates at the storage layer
checking the upload's contentType against the bucket's stored allowed list.

**How to apply:** when adding an upload type to an existing bucket, also call
`supabase.storage.updateBucket(id, { allowedMimeTypes, ... })` on the
existing-bucket path (not just create). Prefer wildcards (`image/*`,
`audio/*`) over enumerating subtypes — Supabase may reject odd subtypes like
`audio/m4a` when setting the list, and wildcards match all container variants.
Bucket setup is usually cached (`bucketReady`) and lazy on first upload, so the
server must restart to re-run it.
