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
