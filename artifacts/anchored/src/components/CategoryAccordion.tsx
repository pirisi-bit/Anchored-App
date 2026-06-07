import { Category } from "@/lib/storage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { getCategoryColor } from "./AnchorCard";
import { cn } from "@/lib/utils";

interface TemplateItem {
  key: string;
  label: string;
}

interface CategoryAccordionProps {
  category: Category;
  categoryLabel: string;
  templates: TemplateItem[];
  selectedKeys: string[];
  alreadyAddedNames: Set<string>;
  onToggle: (key: string) => void;
  defaultExpanded?: boolean;
  alreadyAddedLabel?: string;
}

export function CategoryAccordion({
  category,
  categoryLabel,
  templates,
  selectedKeys,
  alreadyAddedNames,
  onToggle,
  defaultExpanded,
  alreadyAddedLabel = "Already added",
}: CategoryAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultExpanded ? category : undefined}
      className="bg-card rounded-2xl shadow-sm border overflow-hidden"
    >
      <AccordionItem value={category} className="border-b-0">
        <AccordionTrigger
          className={cn("px-4 py-3 hover:no-underline", getCategoryColor(category))}
          data-testid={`accordion-trigger-${category.replace(/\s+/g, "-").toLowerCase()}`}
        >
          <span className="font-bold">{categoryLabel}</span>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-2 px-2">
          <div className="flex flex-col gap-1">
            {templates.map(({ key, label }) => {
              const isAlreadyAdded = alreadyAddedNames.has(key.toLowerCase());
              const isSelected = selectedKeys.includes(key);
              const id = `${category}-${key}`;
              return (
                <label
                  key={key}
                  htmlFor={id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-colors",
                    isAlreadyAdded
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/50 cursor-pointer",
                  )}
                  data-testid={`template-row-${key.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <Checkbox
                    id={id}
                    checked={isAlreadyAdded || isSelected}
                    disabled={isAlreadyAdded}
                    onCheckedChange={() => !isAlreadyAdded && onToggle(key)}
                    className="w-5 h-5 rounded-md"
                  />
                  <span className="text-sm font-medium select-none flex-1">{label}</span>
                  {isAlreadyAdded && (
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {alreadyAddedLabel}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
