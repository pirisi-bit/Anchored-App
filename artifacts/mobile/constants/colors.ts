/**
 * Semantic design tokens for the DoneMark mobile app.
 *
 * These mirror the sibling web artifact (artifacts/anchored/src/index.css)
 * so both apps share the same warm mid-century visual identity.
 */

const colors = {
  light: {
    text: "#1C1C1E",
    tint: "#3B82F6",

    background: "#F5F3EF",
    foreground: "#1C1C1E",

    card: "#FFFFFF",
    cardForeground: "#1C1C1E",

    primary: "#3B82F6",
    primaryForeground: "#FFFFFF",

    secondary: "#E5E7EB",
    secondaryForeground: "#1C1C1E",

    muted: "#F3F4F6",
    mutedForeground: "#6B7280",

    accent: "#E5E7EB",
    accentForeground: "#1C1C1E",

    destructive: "#FF6B6B",
    destructiveForeground: "#FFFFFF",

    border: "rgba(0,0,0,0.08)",
    input: "rgba(0,0,0,0.08)",

    brandSky: "#60B8FF",
    brandYellow: "#FFD93D",
    brandSage: "#6BCB77",
    brandOrange: "#FF8C42",
    brandLavender: "#C589E8",
    brandCoral: "#FF6B6B",
  },

  dark: {
    text: "#F5F3EF",
    tint: "#3B82F6",

    background: "#111111",
    foreground: "#F5F3EF",

    card: "#1C1C1E",
    cardForeground: "#F5F3EF",

    primary: "#3B82F6",
    primaryForeground: "#FFFFFF",

    secondary: "#333333",
    secondaryForeground: "#F5F3EF",

    muted: "#333333",
    mutedForeground: "#9CA3AF",

    accent: "#333333",
    accentForeground: "#F5F3EF",

    destructive: "#FF6B6B",
    destructiveForeground: "#FFFFFF",

    border: "rgba(255,255,255,0.12)",
    input: "rgba(255,255,255,0.12)",

    brandSky: "#60B8FF",
    brandYellow: "#FFD93D",
    brandSage: "#6BCB77",
    brandOrange: "#FF8C42",
    brandLavender: "#C589E8",
    brandCoral: "#FF6B6B",
  },

  // --radius: 0.5rem -> 8px
  radius: 8,
};

export default colors;
