---
name: Finding Expo Go-compatible package versions
description: How to pick native-module versions that match the installed Expo SDK without running expo install
---

When adding a native Expo module (expo-notifications, @react-native-community/datetimepicker, etc.) to a mobile artifact, the version MUST match what the installed Expo SDK / Expo Go bundles, or it crashes at runtime.

**Rule:** Do not guess versions, and do not run `npx expo install` (the expo CLI is reserved for the workflow per the expo skill's forbidden list).

**How to apply:**
1. Read `node_modules/.pnpm/expo@<ver>_.../node_modules/expo/bundledNativeModules.json` — it maps each native module to the exact compatible version range for the installed SDK.
2. Install with `pnpm --filter @workspace/<app> add <pkg>@<range-from-manifest>`.
3. Restart the mobile workflow (native dep change) and confirm Metro bundles clean + the app loads without a redbox.

**Why:** Expo Go ships fixed native module versions; a mismatched JS package version fails to find the native module. The manifest is the source of truth that `expo install` itself uses.
