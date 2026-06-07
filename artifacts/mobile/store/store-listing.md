# Anchored — App Store & Play Store Listing Content

> Positioning: people reach for Anchored because they're anxious they *didn't*
> do the thing — lock the door, take the meds, pay the bill. The promise isn't
> "remember more," it's **confidence, trust, and peace of mind**: everything is
> under control. Copy below leads with reassurance, not memory.

---

## Core naming & taglines

- **App name:** Anchored
- **Subtitle (iOS, ≤30 chars):** `Calm proof your day is done` (27)
- **Alt subtitles:**
  - `Confidence your day is handled` (30)
  - `Peace of mind, every day` (24)
- **One-line tagline:** Everything's under control.

---

## Apple App Store

### Promotional text (≤170 chars)
> That nagging "did I actually do it?" feeling — gone. Anchored gives you calm,
> dated proof that your daily routines are truly done. Peace of mind, on tap.

### Keywords (≤100 chars, comma-separated, no spaces wasted)
```
peace of mind,routine,reminder,proof,checklist,habit,daily,medication,home safety,calm,tracker,log
```

### Description (≤4000 chars)
```
Everything's under control.

If you've ever stood at the door wondering "did I lock it?" — or lay awake
asking "did I take my pill, pay that bill, turn off the stove?" — Anchored is
for you. It's the calm way to know, for certain, that the things that matter
got done today.

Anchored isn't another nagging to-do list. It's quiet, dependable proof. Each
day you confirm your routines and Anchored saves a dated record you can trust.
No more second-guessing. No more circling back to check. Just the steady
confidence that everything is handled.

WHY PEOPLE STAY ANCHORED
• Peace of mind — replace the "did I?" loop with proof you can see.
• Confidence — open the app and know exactly what's done and what's left.
• Trust — every confirmation is dated, so your memory doesn't have to carry it.
• Calm by design — a warm, uncluttered space, not a stressful checklist.

HOW IT WORKS
1. Choose your anchors — the routines that matter to you (home safety,
   medication, bills, personal care, pet care, and more).
2. Verify each day — a quick self-confirm, a photo, or a receipt. Whatever
   gives you certainty.
3. Build your timeline — your proof stacks up into a private record you can
   look back on anytime.

GENTLE DAILY REMINDERS
Anchored can nudge you once a day, at a time you choose, about anything you
haven't confirmed yet — so nothing slips, without the noise.

BUILT FOR THE ANXIOUS MIND
Anchored was made for people who care deeply about getting it right: caregivers,
people managing medication, anyone who carries the mental load of a household.
The whole experience is designed to feel reassuring, not demanding.

PRIVATE BY DEFAULT
Your proof is yours alone. Everything is tied to your private account and
visible only to you. We don't sell your data or show you ads.

Stop wondering. Start knowing. Download Anchored and feel everything fall into
place.
```

### What's New (release notes — v1.0.0)
```
Welcome to Anchored.

• Choose the daily routines that matter and confirm them with a tap, a photo,
  or a receipt.
• Build a private, dated timeline of proof you can trust.
• Set one gentle daily reminder for anything you haven't confirmed yet.

We'd love your feedback — it shapes what comes next.
```

### Categories
- **Primary:** Health & Fitness  (alt: Lifestyle)
- **Secondary:** Productivity

### Age rating
- 4+ (no objectionable content)

---

## Google Play Store

### Short description (≤80 chars)
> Calm, dated proof your daily routines are done. Stop wondering — start knowing.

### Full description (≤4000 chars)
Use the App Store description above; it fits within Play's 4000-char limit.
Optionally lead with the short tagline line "Everything's under control." for
parity.

---

## Privacy & data safety answers

Use these to fill Apple's "App Privacy" questionnaire and Google's "Data safety"
form. Confirm against the actual build before submitting.

- **Account / contact info:** Email address — collected for account creation and
  sign-in. Linked to the user. Not used for tracking.
- **User content — photos:** Photos/receipts the user attaches as proof —
  stored to provide the core feature. Linked to the user. Not used for tracking.
- **Identifiers:** App account ID only. No advertising identifiers.
- **Tracking:** None. The app does not track users across apps or websites.
- **Ads:** None.
- **Data sharing with third parties:** Auth and storage are handled by Supabase
  (a data processor) solely to operate the app; data is not sold or shared for
  advertising.
- **Data deletion:** Users can request account and data deletion. Provide a
  working deletion path/contact before submission (Apple & Google both require
  this).
- **Encryption in transit:** Yes (HTTPS).

> NOTE: A public **Privacy Policy URL** is required by both stores. It must be
> live before submission. Draft a policy reflecting the points above and host it
> (the privacy page can live on the Anchored web app).

---

## Required URLs

These live on the Anchored web app (`artifacts/anchored`) as public, no-login
routes. Paste the production-domain versions into App Store Connect / Play
Console. In development they are reachable at `$REPLIT_DEV_DOMAIN/privacy` and
`/support`; after the web app is published, use the published HTTPS domain.

- **Privacy Policy URL:** `https://<your-published-domain>/privacy`
- **Support URL:** `https://<your-published-domain>/support`
- **Marketing URL (optional):** `https://<your-published-domain>/` (the landing page)

> Pages are wired in `artifacts/anchored/src/App.tsx` (`/privacy`, `/support`)
> and linked from the landing page footer. Both are public.

> **BEFORE SUBMISSION — support email.** The pages show a contact address from
> `artifacts/anchored/src/lib/contact.ts` (`support@anchored.app`). Change it to
> an inbox you actually monitor — both stores require a working support contact,
> and Apple requires that account/data-deletion requests sent there are honored.

---

## App Review notes (paste into App Store Connect "Notes")

```
Anchored helps people keep trustworthy daily proof that important routines were
done (e.g. locking the door, taking medication, paying a bill, pet care).

ACCOUNT FOR REVIEW
Please create a free account with email + password on first launch (no invite
code or paid tier is required). Google sign-in is also available.

CAMERA & PHOTO PERMISSIONS
The app requests camera and photo-library access for a single purpose: when a
user taps "Photo" or "Receipt" on an anchor, they can capture a photo or attach
an existing image/PDF as proof that the routine was completed. Access is
requested only at the moment the user chooses to add proof — never in the
background. Granting is optional; users can instead "self-confirm" with a tap.
(See components/CaptureSheet.tsx.)

NOTIFICATIONS
The single optional daily reminder is a local notification scheduled on-device
for a user-chosen time; it lists how many routines are still unconfirmed.

PRIVACY / DATA DELETION
All data is private per user (Supabase row-level security). Users can clear all
their data in-app via Settings → Data → Clear all data. Full account deletion
can be requested at the support email on the Support URL.
```

---

## Screenshots — shot list & captions

Ready-to-upload marketing screenshots have been generated into
`store/screenshots/`, at every size the stores require:

- `screenshots/ios-6.7/` — 1290 × 2796 (iPhone 6.7", required by Apple)
- `screenshots/ios-6.5/` — 1242 × 2688 (iPhone 6.5", required by Apple)
- `screenshots/android-phone/` — 1080 × 1920 (Google Play phone)

Six frames per size, each a device mockup of the real Anchored UI with a calm,
on-message caption:

1. `01-hero` — "Everything's under control." (today's dashboard)
2. `02-glance` — "See what's done at a glance." (anchors, mixed states)
3. `03-proof` — "Proof you can trust — not just memory." (capturing a receipt)
4. `04-timeline` — "Your dated record, always there." (history)
5. `05-reminder` — "One gentle nudge, on your schedule." (daily reminder)
6. `06-alldone` — "Nothing left to worry about today." (all-confirmed state)

These are designed marketing frames (warm mid-century palette, Inter type) that
faithfully mirror the app. They satisfy the store size requirements as-is. If
you prefer literal device captures, run the app and screenshot the matching
screens, then keep the same caption order.

### Regenerating

`node store/generate-screenshots.mjs` (run from `artifacts/mobile/`) rebuilds all
sizes. It composes SVG and rasterizes with ImageMagick/librsvg; it needs the
Inter font available to fontconfig and `magick` on PATH.
