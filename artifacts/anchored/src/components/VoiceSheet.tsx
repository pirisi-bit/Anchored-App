import { useState, useRef, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Mic, Square, X, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/lang-context";
import { cn } from "@/lib/utils";

interface VoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (voiceUrl: string) => void;
  anchorName: string;
}

const MAX_SECONDS = 15;

// Pick a mime type the browser can actually record, preferring widely-accepted ones.
function pickMimeType(): string {
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function extForMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function VoiceSheet({ open, onOpenChange, onSave, anchorName }: VoiceSheetProps) {
  const t = useT();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimers = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (stopTimeoutRef.current) { clearTimeout(stopTimeoutRef.current); stopTimeoutRef.current = null; }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    stopTracks();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    blobRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecording(false);
    setElapsed(0);
    setUploading(false);
  }, [audioUrl, clearTimers, stopTracks]);

  // Tidy up on unmount.
  useEffect(() => {
    return () => {
      clearTimers();
      stopTracks();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(() => {
    clearTimers();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, [clearTimers]);

  const startRecording = async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error(t.voice.notSupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const baseType = type.split(";")[0];
        const blob = new Blob(chunksRef.current, { type: baseType });
        blobRef.current = blob;
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stopTracks();
      };

      recorder.start();
      setRecording(true);
      setElapsed(0);

      tickRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
      // Hard cap in case the interval drifts.
      stopTimeoutRef.current = setTimeout(stopRecording, MAX_SECONDS * 1000 + 250);
    } catch {
      stopTracks();
      toast.error(t.voice.micDenied);
    }
  };

  const handleSave = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    setUploading(true);
    try {
      const ext = extForMime(blob.type);
      const file = new File([blob], `voice.${ext}`, { type: blob.type });
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/receipts/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      const data = (await res.json()) as { url: string };
      onSave(data.url);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.voice.uploadFailed);
      setUploading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    // Don't allow closing mid-upload, otherwise the file lands in storage but
    // the proof never gets linked to the anchor.
    if (!next && uploading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const remaining = MAX_SECONDS - elapsed;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="max-w-md mx-auto w-full p-4 pb-8 flex flex-col gap-4">
          <DrawerHeader className="px-0 pt-0 text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-bold">{t.voice.title}: {anchorName}</DrawerTitle>
              <DrawerClose asChild>
                <button
                  disabled={uploading}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </DrawerClose>
            </div>
            <p className="text-sm text-muted-foreground pt-1">{t.voice.subtitle}</p>
          </DrawerHeader>

          {audioUrl ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-muted/50 border p-4">
                <audio controls src={audioUrl} className="w-full" data-testid="audio-voice-preview" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full h-12 gap-2" onClick={reset} disabled={uploading}>
                  <RotateCcw className="w-4 h-4" />
                  {t.voice.reRecord}
                </Button>
                <Button className="flex-1 rounded-full h-12 gap-2" onClick={handleSave} disabled={uploading} data-testid="btn-use-voice">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.voice.uploading}
                    </>
                  ) : (
                    t.voice.useRecording
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-4">
              <div
                className={cn(
                  "w-28 h-28 rounded-full flex items-center justify-center transition-colors",
                  recording ? "bg-destructive/15" : "bg-primary/10",
                )}
              >
                <div
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center",
                    recording ? "bg-destructive/25 animate-pulse" : "bg-primary/15",
                  )}
                >
                  <Mic className={cn("w-9 h-9", recording ? "text-destructive" : "text-primary")} />
                </div>
              </div>

              <div className="text-center">
                <p className="font-mono text-2xl font-bold tabular-nums">
                  0:{String(recording ? remaining : MAX_SECONDS).padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {recording ? t.voice.recordingHint : t.voice.maxHint(MAX_SECONDS)}
                </p>
              </div>

              {recording ? (
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-14 px-8 gap-2"
                  onClick={stopRecording}
                  data-testid="btn-stop-voice"
                >
                  <Square className="w-5 h-5 fill-current" />
                  {t.voice.stop}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="rounded-full h-14 px-8 gap-2"
                  onClick={startRecording}
                  data-testid="btn-start-voice"
                >
                  <Mic className="w-5 h-5" />
                  {t.voice.startRecording}
                </Button>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
