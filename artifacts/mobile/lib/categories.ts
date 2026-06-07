import { PREDEFINED_CATEGORIES } from "./storage";

type BrandColors = {
  brandSage: string;
  brandSky: string;
  brandYellow: string;
  brandLavender: string;
  brandOrange: string;
  muted: string;
};

export function categoryColor(category: string, colors: BrandColors): string {
  switch (category) {
    case "Home Safety":
      return colors.brandSage;
    case "Medication":
      return colors.brandSky;
    case "Bills & Receipts":
      return colors.brandYellow;
    case "Personal Care":
      return colors.brandLavender;
    case "Pet Care":
      return colors.brandOrange;
    default:
      return colors.muted;
  }
}

// Predefined display order — custom categories are appended after these.
export const CATEGORY_ORDER: string[] = [...PREDEFINED_CATEGORIES];

export const TEMPLATES: Record<string, string[]> = {
  "Home Safety": [
    "Locked front door",
    "Turned off stove",
    "Checked windows",
    "Set alarm",
    "Turned off iron",
  ],
  Medication: [
    "Morning medication",
    "Evening medication",
    "Vitamins",
    "Blood pressure check",
  ],
  "Bills & Receipts": [
    "Paid rent",
    "Paid electricity",
    "Paid internet",
    "Saved receipt",
  ],
  "Personal Care": [
    "Brushed teeth (AM)",
    "Brushed teeth (PM)",
    "Took shower",
    "Skincare routine",
    "Drank 8 glasses of water",
  ],
  "Pet Care": ["Fed pet", "Pet walk", "Pet medication", "Cleaned litter"],
  Other: [],
};
