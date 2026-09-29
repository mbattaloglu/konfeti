# konfeti

## 0.2.0

### Minor Changes

- **Breaking:** `presets.snow()` style functions are replaced by the `KonfetiPresets` constant with
  enum-style members (`Konfeti.fire(KonfetiPresets.SNOW)`). Overrides move to
  `extendPreset(KonfetiPresets.SNOW, { … })`; the `Preset` / `PresetName` types become `KonfetiPresetName`.
- Console banner on the first instance (turn off with `disableBanner()`); homepage links point to
  konfeti.mbattaloglu.com.

- Worker rendering: `KonfetiFactory.createWorker()` runs simulation and drawing in a Web Worker through an
  `OffscreenCanvas`, with typed worker-safe options (`WorkerFireOptions`), a lazily loaded inlined worker script,
  a self-hostable `konfeti/worker.js` for strict CSP, and an automatic main-thread fallback.
