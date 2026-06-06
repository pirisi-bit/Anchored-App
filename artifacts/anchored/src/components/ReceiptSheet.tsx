import { useState, useRef, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, X, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface ReceiptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (receiptUrl: string) => void;
  anchorName: string;
}

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const ACCEPT = ALLOWED_TYPES.join(",");
const MAX_BYTES = 10 * 1024 * 1024;

export function ReceiptSheet({ open, onOpenChange, onSave, anchorName }: ReceiptSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPdf = file?.type === "application/pdf";

  // Revoke any outstanding object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error("Unsupported file. Please choose an image or PDF.");
      return;
    }

    if (selected.size > MAX_BYTES) {
      toast.error("File is too large. Max size is 10MB.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }

      const data = (await res.json()) as { url: string };
      onSave(data.url);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload receipt.");
      setUploading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    // Don't allow the sheet to close mid-upload — otherwise the file lands in
    // storage but the proof never gets linked to the anchor.
    if (!next && uploading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="max-w-md mx-auto w-full p-4 pb-8 flex flex-col gap-4">
          <DrawerHeader className="px-0 pt-0 text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-bold">Receipt: {anchorName}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
            data-testid="input-receipt-file"
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 py-12 px-4 text-center transition-colors hover:bg-muted active:scale-[0.99]"
              data-testid="btn-choose-receipt"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="w-6 h-6" />
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-base">Choose a file</p>
                <p className="text-sm text-muted-foreground">Image or PDF, up to 10MB</p>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              {isPdf ? (
                <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15">
                    <FileText className="w-6 h-6 text-brand-orange" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">PDF · {(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border bg-black/5 max-h-[50vh] flex items-center justify-center">
                  {previewUrl && (
                    <img src={previewUrl} alt="Receipt preview" className="w-full h-auto max-h-[50vh] object-contain" />
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  Replace
                </Button>
                <Button
                  className="flex-1 rounded-full h-12 gap-2"
                  onClick={handleUpload}
                  disabled={uploading}
                  data-testid="btn-upload-receipt"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload Receipt
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
