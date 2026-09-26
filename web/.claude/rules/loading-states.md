---
description: Loading, error and empty states for async data
paths:
  - '**/src/pages/**/*.tsx'
  - '**/src/components/**/*.tsx'
---

# Loading states

- Every asynchronous read renders explicit loading, error and settled states,
  plus empty where that outcome is possible. Tests cover each one.
- Harness data goes stale. Show when a value is stale or unavailable; never
  present an old value as current.
- Loading never leaves controls enabled that would act on data not yet loaded.
- Status comes from the server. Never optimistic, never inferred from a pending
  mutation. A rejected or failed action reports its reason in place; nothing
  reverts silently.
- No state is carried by colour alone: every rendering carries a label or a
  non-colour mark, and a text name in the accessibility tree.
