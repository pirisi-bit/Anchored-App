import { Category } from "@/lib/storage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { getCategoryColor } from "./AnchorCard";
import { cn } from "@/lib/utils";

interface CategoryAccordionProps {
  category: Category;
  templates: string[];
  selectedTemplates: string[];
  onToggle: (template: string) => void;
  defaultExpanded?: boolean;
}

export function CategoryAccordion({ category, templates, selectedTemplates, onToggle, defaultExpanded }: CategoryAccordionProps) {
  return (
    <Accordion type="single" collapsible defaultValue={defaultExpanded ? category : undefined} className="bg-card rounded-2xl shadow-sm border overflow-hidden">
      <AccordionItem value={category} className="border-b-0">
        <AccordionTrigger className={cn("px-4 py-3 hover:no-underline", getCategoryColor(category))} data-testid={`accordion-trigger-${category.replace(/\s+/g, '-').toLowerCase()}`}>
          <span className="font-bold">{category}</span>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-2 px-2">
          <div className="flex flex-col gap-1">
            {templates.map(template => {
              const id = `${category}-${template}`;
              const checked = selectedTemplates.includes(template);
              return (
                <label key={template} htmlFor={id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`template-row-${template.replace(/\s+/g, '-').toLowerCase()}`}>
                  <Checkbox 
                    id={id} 
                    checked={checked} 
                    onCheckedChange={() => onToggle(template)} 
                    className="w-5 h-5 rounded-md"
                  />
                  <span className="text-sm font-medium select-none">{template}</span>
                </label>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
