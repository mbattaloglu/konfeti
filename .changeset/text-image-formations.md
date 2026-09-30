---
"konfeti": minor
---

Formations: `formation: { text }` or `formation: { image }` makes the particles form a text or an image, hold
it, then burst apart. `mode: "assemble"` flies them in from beyond the canvas edges, `"appear"` shows the shape
at once; every shape type can take part, image formations paint the particles in the image's colors, and `fit`
scales the whole formation down on small screens. Works in worker instances; with `konfeti/lite`, call
`enableFormations()` once.
