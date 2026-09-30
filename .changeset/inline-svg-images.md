---
"konfeti": minor
---

Inline SVG images: an `image` or `spritesheet` `src` (and `loadImage()`) that starts with `<svg` is used as SVG
markup — no file or URL needed. Worker instances reject it with a clear error, since browsers cannot decode SVG
inside a worker.
