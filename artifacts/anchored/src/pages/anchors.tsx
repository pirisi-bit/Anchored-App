import { useState } from "react";
import { useLocation } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { Anchor, AnchorReminder, Category } from "@/lib/storage";
import { getCategoryColor } from "@/components/AnchorCard";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CreateAnchorSheet } from "@/components/CreateAnchorSheet";
import { AnchorReminderSheet } from "@/components/AnchorReminderSheet";
import { Plus, Loader2, PenLine, Bell, BellRing, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AnchorsPage() {
  const [, setLocation] = useLocation();
  const { anchors, loading, toggleAnchorActive, deleteAnchor, saveAnchorReminder } = useAnchors();
  const t = useT();
  const [createOpen, setCreateOpen] = useState(false);
  const [reminderAnchor, setReminderAnchor] = useState<Anchor | null>(null);
  // Optimistic active-state overrides: id → boolean. Applied on top of DB state
  // so the toggle feels instant even while the network call is in flight.
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});

  const handleToggle = async (anchor: Anchor, checked: boolean) => {
    setActiveOverrides((prev) => ({ ...prev, [anchor.id]: checked }));
    try {
      await toggleAnchorActive(anchor.id, checked);
    } catch {
      setActiveOverrides((prev) => ({ ...prev, [anchor.id]: anchor.active }));
      toast.error(t.errors.couldNotUpdate);
    } finally {
      setActiveOverrides((prev) => {
        const next = { ...prev };
        delete next[anchor.id];
        return next;
      });
    }
  };

  const handleDelete = async (anchor: Anchor) => {
    const confirmed = window.confirm(
      `Remove "${anchor.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await deleteAnchor(anchor.id);
    } catch {
      toast.error(t.errors.couldNotUpdate);
    }
  };

  const handleSaveReminder = async (anchor: Anchor, reminder: AnchorReminder | undefined) => {
    try {
      await saveAnchorReminder(anchor.id, reminder ?? null);
      toast.success(reminder ? t.success.reminderSaved : t.success.reminderRemoved);
    } catch {
      toast.error(t.errors.couldNotUpdate);
    }
  };

  // Merge optimistic overrides into the displayed anchor list
  const displayAnchors = anchors.map((a) =>
    a.id in activeOverrides ? { ...a, active: activeOverrides[a.id] } : a
  );

  // Group and sort: active first within each category, inactive below
  const grouped = displayAnchors.reduce((acc, anchor) => {
    if (!acc[anchor.category]) acc[anchor.category] = [];
    acc[anchor.category].push(anchor);
    return acc;
  }, {} as Record<string, Anchor[]>);

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

            // Sort: active anchors first, inactive at bottom
            const sorted = [...categoryAnchors].sort((a, b) => {
              if (a.active === b.active) return 0;
              return a.active ? -1 : 1;
            });

            const activeList = sorted.filter((a) => a.active);
            const inactiveList = sorted.filter((a) => !a.active);

            return (
              <div key={category} className="flex flex-col gap-2">
                <div className={cn("px-4 py-2 rounded-xl text-sm font-bold shadow-sm inline-block self-start", getCategoryColor(category))}>
                  {t.categories[category] ?? category}
                </div>

                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                  {/* Active anchors */}
                  {activeList.map((anchor, i) => (
                    <AnchorRow
                      key={anchor.id}
                      anchor={anchor}
                      showBorder={i !== activeList.length - 1 || inactiveList.length > 0}
                      onToggle={handleToggle}
                      onReminderClick={() => setReminderAnchor(anchor)}
                      onDelete={handleDelete}
                      t={t}
                    />
                  ))}

                  {/* Inactive section divider */}
                  {inactiveList.length > 0 && activeList.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/40">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        {t.anchorsPage.inactiveSection}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {/* Inactive anchors */}
                  {inactiveList.map((anchor, i) => (
                    <AnchorRow
                      key={anchor.id}
                      anchor={anchor}
                      showBorder={i !== inactiveList.length - 1}
                      onToggle={handleToggle}
                      onReminderClick={() => setReminderAnchor(anchor)}
                      onDelete={handleDelete}
                      t={t}
                    />
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

      <AnchorReminderSheet
        anchor={reminderAnchor}
        open={!!reminderAnchor}
        onClose={() => setReminderAnchor(null)}
        onSave={handleSaveReminder}
      />
    </div>
  );
}

// ── Extracted row component ────────────────────────────────────────────────

interface AnchorRowProps {
  anchor: Anchor;
  showBorder: boolean;
  onToggle: (anchor: Anchor, checked: boolean) => void;
  onReminderClick: () => void;
  onDelete: (anchor: Anchor) => void;
  t: ReturnType<typeof useT>;
}

function AnchorRow({ anchor, showBorder, onToggle, onReminderClick, onDelete, t }: AnchorRowProps) {
  const hasReminder = !!anchor.reminder?.enabled;
  return (
    <div
      className={cn(
        "flex items-center gap-2 justify-between px-4 py-3",
        showBorder && "border-b",
        !anchor.active && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {anchor.emoji && (
          <span className="text-xl shrink-0" aria-hidden>{anchor.emoji}</span>
        )}
        <span className="font-medium truncate">
          {anchor.name}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={anchor.active}
          onCheckedChange={(checked) => onToggle(anchor, checked)}
          data-testid={`switch-anchor-${anchor.id}`}
        />

        {/* Reminder bell — only on active anchors */}
        {anchor.active && (
          <button
            onClick={onReminderClick}
            title={hasReminder ? t.reminder.active : t.reminder.setReminder}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              hasReminder
                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
            )}
            data-testid={`btn-reminder-${anchor.id}`}
          >
            {hasReminder ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
        )}

        {/* Delete — visible on hover/focus; always visible on inactive anchors */}
        <button
          onClick={() => onDelete(anchor)}
          title="Remove anchor"
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10",
            !anchor.active && "text-muted-foreground/60"
          )}
          data-testid={`btn-delete-anchor-${anchor.id}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
