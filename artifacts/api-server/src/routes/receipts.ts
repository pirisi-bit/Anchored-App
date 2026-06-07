import { Router, type IRouter } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { getSupabase, ensureReceiptsBucket, RECEIPTS_BUCKET } from "../lib/supabase";

const router: IRouter = Router();

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "application/pdf",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/aac",
  "audio/x-m4a",
  "audio/m4a",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/aac": "aac",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/receipts/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No file provided. Send a multipart 'file' field." });
      return;
    }

    if (!ALLOWED_MIME.has(file.mimetype)) {
      res.status(400).json({
        error: `Unsupported file type "${file.mimetype}". Allowed: images (PNG, JPG, WEBP, HEIC) and PDF.`,
      });
      return;
    }

    await ensureReceiptsBucket();

    const ext = EXTENSION_BY_MIME[file.mimetype] ?? "bin";
    const objectPath = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;

    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      req.log.error({ err: uploadError }, "Supabase receipt upload failed");
      res.status(502).json({ error: "Failed to store receipt." });
      return;
    }

    const { data } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(objectPath);

    res.json({ url: data.publicUrl, contentType: file.mimetype });
  } catch (err) {
    req.log.error({ err }, "Receipt upload error");
    res.status(500).json({ error: "Unexpected error while uploading receipt." });
  }
});

export default router;
