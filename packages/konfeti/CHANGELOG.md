# konfeti

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
