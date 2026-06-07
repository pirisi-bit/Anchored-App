---
name: Toggle/Switch used as an async action trigger
description: Why a Switch that fires an async action must reflect pending state, not be hard-pinned to checked={false}
---

When a Switch (or toggle) is used to *trigger* an async action rather than reflect
a stored boolean, do NOT render it `checked={false}` and act only on
`onCheckedChange(true)`.

**Why:** With `checked={false}` the thumb snaps back instantly, so under real
latency the control looks broken ("bounces back"), and nothing stops the user
from flipping it repeatedly and firing duplicate async calls (double submits,
repeated modal opens, duplicate toasts).

**How to apply:** Track a per-item `busy` state. While the action runs, set the
triggering switch `checked` and `disabled`, and disable the sibling controls.
- For actions that unmount the control on success (e.g. card flips to a "done"
  view) the switch naturally stays on until unmount — no bounce-back.
- For actions that just open a sheet/modal, release the lock after the open so
  the modal becomes the active surface.
