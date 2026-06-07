import { useState, useMemo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { PREDEFINED_CATEGORIES } from "@/lib/storage";
import { cn } from "@/lib/utils";

const PREDEFINED_SET = new Set<string>(PREDEFINED_CATEGORIES);

const EMOJIS = [
  "🏠","🔒","🍳","🪟","🚨","🔌",
  "💊","🩺","🧴","🟠","🏥","🩹",
  "🧾","⚡","💡","🌐","💳","🏦",
  "🧼","🪥","🚿","💧","🏃","🧘",
  "💤","🥗","🌿","📱","☀️","🌙",
  "🐾","🐕","🐱","🦴","🐠","🐦",
  "📝","✅","⭐","❤️","🌟","🎯",
];

const COLOR_OPTIONS = [
  { key: "sage",     cls: "bg-brand-sage",     ring: "ring-brand-sage" },
  { key: "sky",      cls: "bg-brand-sky",      ring: "ring-brand-sky" },
  { key: "yellow",   cls: "bg-brand-yellow",   ring: "ring-brand-yellow" },
  { key: "lavender", cls: "bg-brand-lavender", ring: "ring-brand-lavender" },
  { key: "orange",   cls: "bg-brand-orange",   ring: "ring-brand-orange" },
  { key: "rose",     cls: "bg-rose-300",        ring: "ring-rose-300" },
  { key: "slate",    cls: "bg-slate-400",       ring: "ring-slate-400" },
];

interface CreateAnchorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAnchorSheet({ open, onOpenChange }: CreateAnchorSheetProps) {
  const t = useT();
  const { addAnchors, anchors } = useAnchors();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [emoji, setEmoji] = useState("📌");
  const [color, setColor] = useState("sage");
  const [saving, setSaving] = useState(false);

  // Categories the user has already created (derived from saved anchors, no extra API call).
  const derivedCustomCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const anchor of anchors) {
      if (!PREDEFINED_SET.has(anchor.category) && !seen.has(anchor.category)) {
        seen.add(anchor.category);
        result.push(anchor.category);
      }
    }
    return result;
  }, [anchors]);

  // Categories typed in this session but not yet saved (disappear on close without saving).
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");

  const allCategories = [
    ...PREDEFINED_CATEGORIES,
    ...derivedCustomCategories,
    ...pendingCategories.filter(
      (c) => !PREDEFINED_SET.has(c) && !derivedCustomCategories.includes(c)
    ),
  ];

  const reset = () => {
    setName("");
    setCategory("Other");
    setEmoji("📌");
    setColor("sage");
    setSaving(false);
    setPendingCategories([]);
    setShowNewCat(false);
    setNewCatInput("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const existing = allCategories.find((c) => c.toLowerCase() === lower);
    if (existing) {
      setCategory(existing);
      setShowNewCat(false);
      setNewCatInput("");
      return;
    }
    setPendingCategories((prev) => [...prev, trimmed]);
    setCategory(trimmed);
    setShowNewCat(false);
    setNewCatInput("");
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t.createAnchor.nameRequired);
      return;
    }
    setSaving(true);
    try {
      await addAnchors([{
        id: crypto.randomUUID(),
        name: trimmed,
        category,
        verificationMethod: "Photo",
        active: true,
        createdAt: new Date().toISOString(),
        emoji,
        color,
      }]);
      toast.success(t.success.anchorSaved);
      handleClose(false);
    } catch {
      toast.error(t.errors.couldNotSave);
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[92vh]">
        <div className="max-w-md mx-auto w-full p-4 pb-8 flex flex-col gap-5 overflow-y-auto">
          <DrawerHeader className="px-0 pt-0 text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-bold">{t.createAnchor.title}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">{t.createAnchor.nameLabel}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.createAnchor.namePlaceholder}
              className="h-12 rounded-2xl"
              maxLength={60}
              data-testid="input-anchor-name"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">{t.createAnchor.categoryLabel}</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  )}
                  data-testid={`cat-pill-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {t.categories[cat] ?? cat}
                </button>
              ))}

              {/* "+ New category" toggle */}
              {!showNewCat ? (
                <button
                  type="button"
                  onClick={() => setShowNewCat(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-border bg-transparent hover:bg-muted transition-colors text-muted-foreground"
                >
                  + {t.createAnchor.newCategory}
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full mt-1">
                  <Input
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    placeholder={t.createAnchor.newCategoryPlaceholder}
                    className="h-9 rounded-xl text-xs flex-1"
                    maxLength={30}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={!newCatInput.trim()}
                    className="rounded-xl h-9 px-3 text-xs shrink-0"
                  >
                    {t.createAnchor.addCategory}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowNewCat(false); setNewCatInput(""); }}
                    className="rounded-xl h-9 px-2 shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Emoji picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">{t.createAnchor.emojiLabel}</label>
            <div className="grid grid-cols-9 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-colors",
                    emoji === e
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">{t.createAnchor.colorLabel}</label>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    c.cls,
                    color === c.key
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  aria-label={c.key}
                />
              ))}
            </div>
          </div>

          <Button
            className="rounded-full h-12 font-bold mt-1"
            onClick={handleSave}
            disabled={saving}
            data-testid="btn-save-anchor"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.createAnchor.save}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
