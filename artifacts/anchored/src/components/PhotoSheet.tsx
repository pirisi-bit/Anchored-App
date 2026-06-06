import { useState, useRef, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PhotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (photoUrl: string) => void;
  anchorName: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

export function PhotoSheet({ open, onOpenChange, onSave, anchorName }: PhotoSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  // Revoke any outstanding object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (selected.size > MAX_BYTES) {
      toast.error("Photo is too large. Max size is 10MB.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSave = async () => {
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
      toast.error(err instanceof Error ? err.message : "Could not upload photo.");
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
              <DrawerTitle className="text-xl font-bold">Proof: {anchorName}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full" disabled={uploading}>
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {preview ? (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-black">
                <img src={preview} alt="Proof preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-md font-mono text-sm shadow-xl">
                  {format(new Date(), "PPpp")}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full h-12" onClick={reset} disabled={uploading}>
                  Retake
                </Button>
                <Button className="flex-1 rounded-full h-12 gap-2" onClick={handleSave} disabled={uploading} data-testid="btn-use-photo">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    "Use this photo"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-4">
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
              <input type="file" accept="image/*" className="hidden" ref={libraryInputRef} onChange={handleFileChange} />

              <Button size="lg" className="rounded-2xl h-16 text-base gap-3" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="w-5 h-5" />
                Open Camera
              </Button>
              <Button variant="outline" size="lg" className="rounded-2xl h-16 text-base gap-3" onClick={() => libraryInputRef.current?.click()}>
                <ImageIcon className="w-5 h-5" />
                Choose from Library
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
