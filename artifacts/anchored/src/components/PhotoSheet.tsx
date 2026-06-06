import { useState, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";

interface PhotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (photoUrl: string) => void;
  anchorName: string;
}

export function PhotoSheet({ open, onOpenChange, onSave, anchorName }: PhotoSheetProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSave = () => {
    if (preview) {
      onSave(preview);
      setPreview(null);
    }
  };

  const reset = () => setPreview(null);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="max-w-md mx-auto w-full p-4 pb-8 flex flex-col gap-4">
          <DrawerHeader className="px-0 pt-0 text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-bold">Proof: {anchorName}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={reset}>
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
                <Button variant="outline" className="flex-1 rounded-full h-12" onClick={reset}>
                  Retake
                </Button>
                <Button className="flex-1 rounded-full h-12" onClick={handleSave}>
                  Use this photo
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
