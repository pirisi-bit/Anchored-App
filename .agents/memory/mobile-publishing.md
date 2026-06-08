---
name: Mobile publishing path (DoneMark)
description: How the DoneMark Expo app gets to the stores on Replit — and why EAS is off-limits.
---

# Publishing the DoneMark mobile app

**Rule:** Do NOT create `eas.json` or run/suggest any EAS CLI command
(`eas build`, `eas submit`, `eas init`, `eas update`, etc.). iOS publishing is
done through Replit's **Expo Launch** (the user clicks Publish; agent calls
`suggestDeploy()` only from the MAIN agent context — task-agents get
`success:false`). Google Play / Android publishing is **not supported** on
Replit.

**Why:** The `expo` skill forbids EAS and dynamic config; EAS/`app.config.*`
break the Expo Launch build. A task literally asking for "EAS profiles +
TestFlight/Play submission" cannot be fulfilled that way — the real deliverable
is store *readiness* + telling the user to publish via Expo Launch.

**How to apply:** For "put the app in the stores" work, finalize `app.json`
only: iOS `bundleIdentifier` + `buildNumber`, Android `package` + `versionCode`,
icon/splash, and required permission strings (`ios.infoPlist.NS*UsageDescription`
plus the `expo-image-picker` plugin's camera/photos permissions, since
`CaptureSheet` uses camera + photo library). Keep config static in `app.json`.
