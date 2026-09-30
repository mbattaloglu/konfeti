---
"konfeti": minor
---

Adaptive quality: `adaptiveQuality: true` (instance option) watches the frame rate while particles animate. When
frames stay slow and konfeti's own drawing is a real part of the cost, it renders at CSS resolution first, then
drops shadows, shine and trails, then spawns 60% of the particles, and steps back up once frames are smooth;
`getQualityLevel()` reports the level. A busy page or a 30 Hz screen does not lower it, and with `fixedTimestep`
the particle step is skipped so replays stay exact.
