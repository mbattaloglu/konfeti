# konfeti

## 0.5.0

### Minor Changes

- d38420c: `framesFromAtlas(atlas, prefix?)` turns the atlas JSON of a packed sprite sheet (TexturePacker, Aseprite, Free
  Texture Packer, Phaser; "JSON Hash" or "JSON Array") into the `frames` of a `spritesheet` shape, in atlas order. A name
  prefix picks one animation out of an atlas that holds several; a rotated frame or a malformed atlas throws a readable
  error. New types: `SpriteAtlas`, `SpriteAtlasFrame`.
- 4bf466e: `tint` for `image` and `spritesheet` shapes: paints the artwork in the particle colors (`colors`, or the `paper`
  colors), so one white logo or coin gives a whole palette. `true` (or `"multiply"`) keeps the shading, `"fill"` draws
  flat silhouettes. Each color is painted once when the image has loaded (images at the size they are drawn, sheets at
  their own size so frames stay in place), so drawing costs the same as without a tint; it works in worker instances
  too.

### Patch Changes

- ab15fc3: Draw trails without the particle's shadow. The shadow was blurred again for every trail segment on every frame: a
  sparkler with `shadow` and `trail` together ran at 1 fps, and now runs as fast as with the shadow alone.

## 0.4.0

### Minor Changes

- e1c72c4: Adaptive quality: `adaptiveQuality: true` (instance option) watches the frame rate while particles animate. When
  frames stay slow and konfeti's own drawing is a real part of the cost, it renders at CSS resolution first, then
  drops shadows, shine and trails, then spawns 60% of the particles, and steps back up once frames are smooth;
  `getQualityLevel()` reports the level. A busy page or a 30 Hz screen does not lower it, and with `fixedTimestep`
  the particle step is skipped so replays stay exact.
- cb8bd15: `delay` starts a burst later (milliseconds, paused time does not count), so the entries of a `fire([...])` list can
  be choreographed: a cannon shot, then a message, then a finale.
- 2968d0c: Replays: every burst handle has `getSeed()` (worker handles too, the seed is picked on the main thread), so
  `fire({ seed })` fires the same burst again. The new `fixedTimestep: true` instance option simulates in fixed
  1/60 s steps, which makes such replays exact, motion included, on any display and at any frame rate.
- d6e04dd: New presets that show off the newer options: `SHOOTING_STARS` (trails), `MAGNET` (attractor that follows the
  pointer), `FORCE_FIELD` (the pointer pushes a falling rain away), `GOLDEN` (gold palette with glints), `SPARKLER`
  and `FIREFLIES` (additive glow), `JACKPOT` (coins bounce and settle on the floor), `CONGRATS`, `SUCCESS` and
  `LEVEL_UP` (text formations, `LEVEL_UP` choreographed with `delay`) and `LOGO_REVEAL` (image formation; its badge is
  a PNG data URL, so it works in worker instances too). `SNOW` flakes are round now (they were stretched into ovals)
  and fall together with six-armed snow crystals.
- 060f50f: Formations: `formation: { text }` or `formation: { image }` makes the particles form a text or an image, hold
  it, then burst apart. `mode: "assemble"` flies them in from beyond the canvas edges, `"appear"` shows the shape
  at once; every shape type can take part, image formations paint the particles in the image's colors, and `fit`
  scales the whole formation down on small screens. Works in worker instances; with `konfeti/lite`, call
  `enableFormations()` once.

### Patch Changes

- 53fc413: Export the `TrailOptions` type, so the settings of `paper.trail` (and a shape's own `trail`) can be typed without
  reaching into the package's internals; the API reference now links it too.

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
