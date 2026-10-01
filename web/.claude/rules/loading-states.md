---
paths:
  - '**/src/pages/**/*.tsx'
  - '**/src/components/**/*.tsx'
---

# Loading states

- Every asynchronous read renders loading, error and settled states, and
  empty where that can happen. Tests and stories cover each one.
- Data goes stale when the stream drops or a refetch fails. Show that a value
  is stale or unavailable; never present an old value as current.
- While data loads, controls that would act on it are disabled.
