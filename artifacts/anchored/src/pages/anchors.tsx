import { useLocation } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { Category } from "@/lib/storage";
import { getCategoryColor } from "@/components/AnchorCard";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnchorsPage() {
  const [, setLocation] = useLocation();
  const { anchors, updateAnchorState } = useAnchors();

  // Group anchors by category
  const grouped = anchors.reduce((acc, anchor) => {
    if (!acc[anchor.category]) {
      acc[anchor.category] = [];
    }
    acc[anchor.category].push(anchor);
    return acc;
  }, {} as Record<Category, typeof anchors>);

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8 relative">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Manage Anchors</h1>
        <p className="text-muted-foreground mt-1">Enable or disable your tracked habits.</p>
      </header>

      <div className="flex flex-col gap-6">
        {anchors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>You haven't set up any anchors yet.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([categoryStr, categoryAnchors]) => {
            const category = categoryStr as Category;
            return (
              <div key={category} className="flex flex-col gap-2">
                <div className={cn("px-4 py-2 rounded-xl text-sm font-bold shadow-sm inline-block self-start", getCategoryColor(category))}>
                  {category}
                </div>
                <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                  {categoryAnchors.map((anchor, i) => (
                    <div key={anchor.id} className={cn("flex items-center justify-between p-4", i !== categoryAnchors.length - 1 && "border-b")}>
                      <span className={cn("font-medium", !anchor.active && "text-muted-foreground line-through")}>
                        {anchor.name}
                      </span>
                      <Switch 
                        checked={anchor.active} 
                        onCheckedChange={(checked) => updateAnchorState({ ...anchor, active: checked })}
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

      <Button
        size="icon"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-40"
        onClick={() => setLocation("/onboarding")}
        data-testid="fab-add-anchors"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
