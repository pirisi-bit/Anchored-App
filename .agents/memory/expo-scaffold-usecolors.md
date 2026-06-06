---
name: Expo scaffold useColors vs custom color tokens
description: Why adding a non-palette top-level key to constants/colors.ts breaks the scaffold's useColors cast
---

# Expo scaffold `useColors` + custom `constants/colors.ts`

The Expo artifact scaffold ships a `hooks/useColors.ts` that originally did
`(colors as Record<string, typeof colors.light>).dark`. That cast assumes EVERY
top-level key of `constants/colors.ts` is a palette object.

**Gotcha:** the moment you add a non-palette top-level token (e.g. `radius: number`)
alongside `light`/`dark`, that cast fails typecheck (`radius` is not a palette).

**How to apply:** when you sync a web palette into `constants/colors.ts` and keep
scheme-independent tokens (radius, spacing) at the top level, also simplify
`useColors` to index `colors.light` / `colors.dark` directly instead of the generic
`Record<string, palette>` cast.
