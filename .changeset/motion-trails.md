---
"konfeti": minor
---

Motion trails: the `trail` style option (`true` or `{ length, width, opacity, color }`) draws a streak behind
each particle that thins and fades toward its tail and fades with the particle. Works on every shape; the
position buffer is allocated once per pooled particle, so trails add no per-frame allocations.
