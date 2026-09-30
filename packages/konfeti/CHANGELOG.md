# konfeti

## 0.3.0

### Minor Changes

- e65ce13: Attractor / repulsor physics: `physics.attract` pulls particles toward the pointer, an element or a point
  (`{ target, strength, radius, falloff }`); a negative `strength` pushes them away. The target is located once per
  frame, and pointer tracking stops when the burst ends. Works in worker instances too: the main thread follows the
  pointer or element and sends it over.
- 931863d: Color themes: `KonfetiPalettes` offers eleven ready-made color lists (`CLASSIC`, `PASTEL`, `GOLD`, `NEON`,
  `RAINBOW`, `WINTER`, `AUTUMN`, `OCEAN`, `CANDY`, `FOREST`, `MONOCHROME`) for any `colors` option. Plain data —
  bundles that don't use them don't carry them.
- e16d4cb: Inline SVG images: an `image` or `spritesheet` `src` (and `loadImage()`) that starts with `<svg` is used as SVG
  markup — no file or URL needed. Worker instances reject it with a clear error, since browsers cannot decode SVG
  inside a worker.
- 9eaa748: Motion trails: the `trail` style option (`true` or `{ length, width, opacity, color }`) draws a streak behind
  each particle that thins and fades toward its tail and fades with the particle. Works on every shape; the
  position buffer is allocated once per pooled particle, so trails add no per-frame allocations.

### Patch Changes

- bf352e1: Types for `konfeti/lite` and `konfeti/worker` now resolve in projects using the older
  `moduleResolution: "node"` (common with webpack + ts-loader), which ignores `exports`: the package adds a
  `typesVersions` map.

## 0.2.0

### Minor Changes

- Continuous emitter: `emit({ rate, follow })` streams particles from an element, the pointer or a point
  until `stop()` (live particles finish, the handle resolves); `moveTo()`, `clear()`, `pause()` / `resume()`.
  Works on worker instances too.
- **Breaking:** worker rendering moved to its own entry — `import { createWorker } from "konfeti/worker"`
  replaces `KonfetiFactory.createWorker()`, so other bundles carry no worker code; the self-hosted script is
  `konfeti/konfeti.worker.js`.

- `pause()` / `resume()` / `isPaused()` on `Konfeti` and every instance (e.g. for MRAID `viewableChange`).
- `onClick(target, options, { trigger, onFire })`: fire on `pointerdown` (works when touch events are
  cancelled) and receive every click burst's handle.
- Worker instances: `getStats()` returns `{ live, spawned, died, completed }` (hooks cannot run in a worker);
  the particle count drops as soon as a burst completes.
- Text and emoji drawn before their web font loaded are redrawn once it arrives.
- The console banner lives in the full entry only; `konfeti/lite` bundles no longer carry it.

- **Breaking:** `presets.snow()` style functions are replaced by the `KonfetiPresets` constant with
  enum-style members (`Konfeti.fire(KonfetiPresets.SNOW)`). Overrides move to
  `extendPreset(KonfetiPresets.SNOW, { … })`; the `Preset` / `PresetName` types become `KonfetiPresetName`.
- Console banner on the first instance (turn off with `disableBanner()`); homepage links point to
  konfeti.mbattaloglu.com.

- Worker rendering: `createWorker()` from the new `konfeti/worker` entry runs simulation and drawing in a Web Worker through an
  `OffscreenCanvas`, with typed worker-safe options (`WorkerFireOptions`), a lazily loaded inlined worker script,
  a self-hostable `konfeti/konfeti.worker.js` for strict CSP, and an automatic main-thread fallback.
