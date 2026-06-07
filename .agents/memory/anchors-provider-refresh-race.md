---
name: Async data-provider refresh race vs. routing gate
description: Why a logged-in user with data gets misrouted to an onboarding/empty screen right after login.
---

# Async data-provider refresh race vs. routing gate

A context provider whose `refresh()` runs once with no user (sets
`loading=false`, data=`[]`) and again after login has a one-render stale window:
when the user becomes set, a routing gate's effect (children run before parent
effects) reads the stale `loading=false` + empty data and redirects to
onboarding/empty before the new fetch starts.

**Why:** `loading` alone can't distinguish "loaded, genuinely empty" from
"about to load for a new user." Effect ordering means the gate fires first.

**How to apply:**
- Track `loadedUserId`; expose `effectiveLoading = user ? (loading || loadedUserId !== user.id) : loading` so gates wait until data is loaded for the *current* user id.
- Add a monotonic request token (`useRef`) in `refresh()`; only the latest call commits state and clears loading. Otherwise overlapping refreshes (fast logout/login, account switch) can overwrite current data with stale results or leave the gate stuck loading.
