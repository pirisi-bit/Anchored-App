import { useState } from "react";
import { useLocation } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { Category, Anchor } from "@/lib/storage";
import { CategoryAccordion } from "@/components/CategoryAccordion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TEMPLATES: Record<Category, string[]> = {
  "Home Safety": ["Locked front door", "Turned off stove", "Checked windows", "Set alarm", "Turned off iron"],
  "Medication": ["Morning medication", "Evening medication", "Vitamins", "Blood pressure check"],
  "Bills & Receipts": ["Paid rent", "Paid electricity", "Paid internet", "Saved receipt"],
  "Personal Care": ["Brushed teeth (AM)", "Brushed teeth (PM)", "Took shower", "Skincare routine", "Drank 8 glasses of water"],
  "Pet Care": ["Fed pet", "Pet walk", "Pet medication", "Cleaned litter"]
};

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { addAnchors } = useAnchors();
  const [selectedTemplates, setSelectedTemplates] = useState<{ category: Category; name: string }[]>([]);

  const toggleTemplate = (category: Category, name: string) => {
    setSelectedTemplates(prev => {
      const exists = prev.some(t => t.category === category && t.name === name);
      if (exists) {
        return prev.filter(t => !(t.category === category && t.name === name));
      }
      return [...prev, { category, name }];
    });
  };

  const getSelectedForCategory = (category: Category) => {
    return selectedTemplates.filter(t => t.category === category).map(t => t.name);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selectedTemplates.length === 0) return;

    const newAnchors: Anchor[] = selectedTemplates.map(t => ({
      id: crypto.randomUUID(),
      name: t.name,
      category: t.category,
      verificationMethod: "Photo",
      active: true,
      createdAt: new Date().toISOString()
    }));

    setSaving(true);
    try {
      await addAnchors(newAnchors);
      setLocation("/dashboard");
    } catch (e) {
      toast.error("Could not save your anchors. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto relative pb-40">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">What do you want to track?</h1>
        <p className="text-muted-foreground">Select the habits and routines you want to build proof for.</p>
      </div>

      <div className="px-4 flex flex-col gap-4 flex-1">
        {(Object.keys(TEMPLATES) as Category[]).map((category, index) => (
          <CategoryAccordion
            key={category}
            category={category}
            templates={TEMPLATES[category]}
            selectedTemplates={getSelectedForCategory(category)}
            onToggle={(name) => toggleTemplate(category, name)}
            defaultExpanded={index === 0}
          />
        ))}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-12 bg-gradient-to-t from-background via-background to-transparent"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">
          <Button 
            className="w-full rounded-full h-14 text-lg font-bold shadow-lg" 
            disabled={selectedTemplates.length === 0 || saving}
            onClick={handleSave}
            data-testid="btn-save-onboarding"
          >
            {saving ? "Saving…" : `Add Selected (${selectedTemplates.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
