import { Anchor, Category } from "./storage";

// Keyword → emoji. First match (substring, case-insensitive) wins, so order
// more specific phrases before generic ones.
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
};

// A soft tinted background for the emoji tile, matching the anchor's category.
export function getCategoryTint(category: Category): string {
  switch (category) {
    case "Home Safety": return "bg-brand-sage/15";
    case "Medication": return "bg-brand-sky/15";
    case "Bills & Receipts": return "bg-brand-yellow/25";
    case "Personal Care": return "bg-brand-lavender/15";
    case "Pet Care": return "bg-brand-orange/15";
    default: return "bg-muted";
  }
}

export function getAnchorEmoji(anchor: Anchor): string {
  const name = anchor.name.toLowerCase();
  for (const [keyword, emoji] of NAME_EMOJI) {
    if (name.includes(keyword)) return emoji;
  }
  return CATEGORY_EMOJI[anchor.category] ?? "📌";
}
