import { useState } from "react";
import { useLocation } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { Category, Anchor } from "@/lib/storage";
import { CategoryAccordion } from "@/components/CategoryAccordion";
import { CreateAnchorSheet } from "@/components/CreateAnchorSheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ChevronLeft, PenLine } from "lucide-react";

const TEMPLATE_KEYS: Record<Category, string[]> = {
  "Home Safety":      ["Locked front door", "Turned off stove", "Checked windows", "Set alarm", "Turned off iron"],
  "Medication":       ["Morning medication", "Evening medication", "Vitamins", "Blood pressure check"],
  "Bills & Receipts": ["Paid rent", "Paid electricity", "Paid internet", "Saved receipt"],
  "Personal Care":    ["Brushed teeth (AM)", "Brushed teeth (PM)", "Took shower", "Skincare routine", "Drank 8 glasses of water"],
  "Pet Care":         ["Fed pet", "Pet walk", "Pet medication", "Cleaned litter"],
  "Other":            [],
};

const CATEGORY_ORDER = Object.keys(TEMPLATE_KEYS).filter(
  (c) => TEMPLATE_KEYS[c as Category].length > 0
) as Category[];

interface Selected {
  category: Category;
  key: string;
  label: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { anchors, addAnchors } = useAnchors();
  const t = useT();

  const [selectedTemplates, setSelectedTemplates] = useState<Selected[]>([]);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Build the set of already-saved anchor names for dedup check.
  const existingNames = new Set(anchors.map((a) => a.name.toLowerCase()));

  const getTemplates = (category: Category) =>
    TEMPLATE_KEYS[category].map((key) => ({
      key,
      label: t.templateNames[key] ?? key,
    }));

  const getSelectedKeysForCategory = (category: Category) =>
    selectedTemplates.filter((s) => s.category === category).map((s) => s.key);

  const toggleTemplate = (category: Category, key: string) => {
    const label = t.templateNames[key] ?? key;
    setSelectedTemplates((prev) => {
      const exists = prev.some((s) => s.category === category && s.key === key);
      if (exists) return prev.filter((s) => !(s.category === category && s.key === key));
      return [...prev, { category, key, label }];
    });
  };

  const handleSave = async () => {
    if (selectedTemplates.length === 0) return;

    const newAnchors: Anchor[] = selectedTemplates.map((s) => ({
      id: crypto.randomUUID(),
      name: s.key,
      category: s.category,
      verificationMethod: "Photo",
      active: true,
      createdAt: new Date().toISOString(),
    }));

    setSaving(true);
    try {
      await addAnchors(newAnchors);
      setLocation("/dashboard");
    } catch (e) {
      console.error("Failed to save anchors:", e);
      toast.error(t.errors.couldNotSave);
      setSaving(false);
    }
  };

  const hasExisting = anchors.length > 0;

  const addableCount = selectedTemplates.length;

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto relative pb-40">
      <div className="px-4 pt-12 pb-6">
        {hasExisting && (
          <button
            type="button"
            onClick={() => setLocation("/dashboard")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1"
            data-testid="btn-back-dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.onboarding.backToDashboard}
          </button>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{t.onboarding.title}</h1>
        <p className="text-muted-foreground">{t.onboarding.subtitle}</p>
      </div>

      <div className="px-4 flex flex-col gap-4 flex-1">
        {CATEGORY_ORDER.map((category, index) => (
          <CategoryAccordion
            key={category}
            category={category}
            categoryLabel={t.categories[category] ?? category}
            templates={getTemplates(category)}
            selectedKeys={getSelectedKeysForCategory(category)}
            alreadyAddedNames={existingNames}
            onToggle={(key) => toggleTemplate(category, key)}
            defaultExpanded={index === 0}
            alreadyAddedLabel={t.onboarding.alreadyAdded}
          />
        ))}

        {/* Create your own anchor */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-sm border w-full text-left hover:bg-muted/50 transition-colors"
          data-testid="btn-create-custom-onboarding"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">{t.onboarding.createOwn}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t.onboarding.createOwnSub}</div>
          </div>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-md mx-auto">
          <Button
            className="w-full rounded-full h-14 text-base font-bold shadow-xl"
            disabled={addableCount === 0 || saving}
            onClick={handleSave}
            data-testid="btn-save-anchors"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t.onboarding.addBtn(addableCount)
            )}
          </Button>
        </div>
      </div>

      <CreateAnchorSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
