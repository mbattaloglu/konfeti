---
"konfeti": minor
---

`tint` for `image` and `spritesheet` shapes: paints the artwork in the particle colors (`colors`, or the `paper`
colors), so one white logo or coin gives a whole palette. `true` (or `"multiply"`) keeps the shading, `"fill"` draws
flat silhouettes. Each color is painted once when the image has loaded (images at the size they are drawn, sheets at
their own size so frames stay in place), so drawing costs the same as without a tint; it works in worker instances
too.
