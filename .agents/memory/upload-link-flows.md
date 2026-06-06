---
name: Upload-then-link flows
description: Avoiding orphaned uploads when a file upload feeds a separate record-save step
---

# Upload-then-link flows

When a UI uploads a file to storage and THEN links the returned URL into a record
(e.g. ReceiptSheet → POST /api/receipts/upload → addReceiptProof), the upload and
the record-save are two separate async steps.

**Rule:** the target id / record context must survive until the link step runs.
Either block the dismiss/close path while `uploading` is true, OR capture the
target id at upload start and pass it through the success callback.

**Why:** the dashboard tracked the active anchor in state and nulled it on drawer
close. If the user dismissed the sheet mid-upload, the file landed in Supabase but
`onSave`'s handler saw a null anchor and never created the proof — a silent orphan.

**How to apply:** any sheet/modal that uploads then persists via parent state must
guard its `onOpenChange(false)` while a request is in flight (see ReceiptSheet).
