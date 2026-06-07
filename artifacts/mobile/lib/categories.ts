import type { Category } from "./storage";

type BrandColors = {
  brandSage: string;
  brandSky: string;
  brandYellow: string;
  brandLavender: string;
  brandOrange: string;
  muted: string;
};

export function categoryColor(category: Category, colors: BrandColors): string {
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

export const CATEGORY_ORDER: Category[] = [
  "Home Safety",
  "Medication",
  "Bills & Receipts",
  "Personal Care",
  "Pet Care",
  "Other",
];

export const TEMPLATES: Record<Category, string[]> = {
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
