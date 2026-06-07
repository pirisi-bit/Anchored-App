import { useState } from "react";
import { useLocation } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { Category } from "@/lib/storage";
import { getCategoryColor } from "@/components/AnchorCard";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CreateAnchorSheet } from "@/components/CreateAnchorSheet";
import { Plus, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AnchorsPage() {
  const [, setLocation] = useLocation();
  const { anchors, loading, updateAnchorState } = useAnchors();
  const t = useT();
  const [createOpen, setCreateOpen] = useState(false);

  const handleToggle = async (anchor: typeof anchors[number], checked: boolean) => {
    try {
      await updateAnchorState({ ...anchor, active: checked });
    } catch (e) {
      toast.error(t.errors.couldNotUpdate);
    }
  };

  const grouped = anchors.reduce((acc, anchor) => {
    if (!acc[anchor.category]) acc[anchor.category] = [];
    acc[anchor.category].push(anchor);
    return acc;
  }, {} as Record<string, typeof anchors>);

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8 relative">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.anchorsPage.title}</h1>
        <p className="text-muted-foreground mt-1">{t.anchorsPage.subtitle}</p>
      </header>

      {/* Create custom anchor shortcut */}
      <button
        onClick={() => setCreateOpen(true)}
        className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-sm border mb-6 w-full text-left hover:bg-muted/50 transition-colors"
        data-testid="btn-create-custom"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <PenLine className="w-5 h-5" />
        </div>
        <span className="font-bold">{t.anchorsPage.createCustom}</span>
      </button>

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : anchors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t.anchorsPage.noAnchors}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([categoryStr, categoryAnchors]) => {
            const category = categoryStr as Category;
            return (
              <div key={category} className="flex flex-col gap-2">
                <div className={cn("px-4 py-2 rounded-xl text-sm font-bold shadow-sm inline-block self-start", getCategoryColor(category))}>
                  {t.categories[category] ?? category}
                </div>
                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                  {categoryAnchors.map((anchor, i) => (
                    <div
                      key={anchor.id}
                      className={cn("flex items-center gap-3 justify-between p-4", i !== categoryAnchors.length - 1 && "border-b")}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {anchor.emoji && (
                          <span className="text-xl shrink-0" aria-hidden>{anchor.emoji}</span>
                        )}
                        <span className={cn("font-medium truncate", !anchor.active && "text-muted-foreground line-through")}>
                          {anchor.name}
                        </span>
                      </div>
                      <Switch
                        checked={anchor.active}
                        onCheckedChange={(checked) => handleToggle(anchor, checked)}
                        data-testid={`switch-anchor-${anchor.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB → template picker */}
      <Button
        size="icon"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-40"
        onClick={() => setLocation("/onboarding")}
        data-testid="fab-add-anchors"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <CreateAnchorSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
