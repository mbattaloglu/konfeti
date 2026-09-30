---
"konfeti": minor
---

Replays: every burst handle has `getSeed()` (worker handles too, the seed is picked on the main thread), so
`fire({ seed })` fires the same burst again. The new `fixedTimestep: true` instance option simulates in fixed
1/60 s steps, which makes such replays exact, motion included, on any display and at any frame rate.
