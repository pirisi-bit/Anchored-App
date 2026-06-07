import { Anchor, Category } from "./storage";

const NAME_EMOJI: [string, string][] = [
  ["front door", "🔒"],
  ["lock", "🔒"],
  ["stove", "🍳"],
  ["window", "🪟"],
  ["alarm", "🚨"],
  ["iron", "🔌"],
  ["blood pressure", "🩺"],
  ["vitamin", "🟠"],
  ["medication", "💊"],
  ["med", "💊"],
  ["rent", "🏠"],
  ["electric", "⚡"],
  ["internet", "🌐"],
  ["receipt", "🧾"],
  ["teeth", "🪥"],
  ["brush", "🪥"],
  ["shower", "🚿"],
  ["skincare", "🧴"],
  ["water", "💧"],
  ["litter", "🐱"],
  ["walk", "🐕"],
  ["fed", "🦴"],
  ["feed", "🦴"],
  ["pet", "🐾"],
];

const CATEGORY_EMOJI: Record<Category, string> = {
  "Home Safety": "🏠",
  "Medication": "💊",
  "Bills & Receipts": "🧾",
  "Personal Care": "🧼",
  "Pet Care": "🐾",
  "Other": "📌",
};

export function getAnchorEmoji(anchor: Anchor): string {
  if (anchor.emoji) return anchor.emoji;
  const name = anchor.name.toLowerCase();
  for (const [keyword, emoji] of NAME_EMOJI) {
    if (name.includes(keyword)) return emoji;
  }
  return CATEGORY_EMOJI[anchor.category] ?? "📌";
}

// Per-color tint classes for custom anchors.
const COLOR_TINT: Record<string, string> = {
  sage: "bg-brand-sage/15",
  sky: "bg-brand-sky/15",
  yellow: "bg-brand-yellow/25",
  lavender: "bg-brand-lavender/15",
  orange: "bg-brand-orange/15",
  rose: "bg-rose-300/20",
  slate: "bg-slate-300/30",
};

// Category tint — used when no custom color is set.
export function getCategoryTint(category: Category): string {
  switch (category) {
    case "Home Safety": return "bg-brand-sage/15";
    case "Medication": return "bg-brand-sky/15";
    case "Bills & Receipts": return "bg-brand-yellow/25";
    case "Personal Care": return "bg-brand-lavender/15";
    case "Pet Care": return "bg-brand-orange/15";
    case "Other": return "bg-muted/50";
    default: return "bg-muted";
  }
}

// Anchor tint — respects a stored custom color, falls back to category.
export function getAnchorTint(anchor: Anchor): string {
  if (anchor.color && COLOR_TINT[anchor.color]) return COLOR_TINT[anchor.color];
  return getCategoryTint(anchor.category);
}
