# Konfeti — Project Plan

_Last updated: 2026-09-28_

---

## 1. Decisions

| Topic      | Decision                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| Name       | **`konfeti`** — unscoped npm package (free on npm, checked 2026-09-28)                                |
| License    | **MIT**                                                                                               |
| Repo shape | **pnpm monorepo**: `packages/konfeti` (the library) + `playground/` (private). No framework adapters. |
| Folders    | Implementations live in **`concretes/`**                                                              |
| Particles  | **Object pool** of `Particle` class instances (tsParticles approach), re-initialised with `reset()`   |

---

## 2. Positioning

|                          | canvas-confetti         | tsParticles       | **Konfeti (goal)**               |
| ------------------------ | ----------------------- | ----------------- | -------------------------------- |
| Size (core, gz)          | ~4 kB                   | 30 kB+ (bundle)   | **≤ 6 kB**, tree-shakable        |
| Types                    | community `@types`      | TS                | **strict, native, generic**      |
| Emoji / text             | `shapeFromText` (basic) | yes               | **first-class, cached**          |
| Image / sprite           | limited                 | yes               | **image + animated spritesheet** |
| Custom shapes            | path / bitmap           | plugins (heavy)   | **typed `defineShape()` plugin** |
| Physics customisation    | fixed params            | very large        | **composable modules**           |
| Worker / OffscreenCanvas | yes                     | partial           | yes (optional)                   |
| API                      | one call                | big config object | **one call + fluent handle**     |

In one line: _canvas-confetti's simplicity + tsParticles' flexibility, without the weight._

---

## 3. Feature List

### 3.0 Default particle ("paper") — fully customisable

The default confetti piece is a small rectangle of paper that flips in 3D. **Every** visual property is configurable through
`fire({ paper: { … } })` (or instance-level defaults via `create(canvas, { defaults: { paper: … } })`).
Every numeric field accepts a `Range` (`number | [min, max] | { min, max }`), sampled per particle.

| Group   | Option               | Type                                                      | Default (draft)  | What it does                                                    |
| ------- | -------------------- | --------------------------------------------------------- | ---------------- | --------------------------------------------------------------- |
| Size    | `width`              | `Range<Pixels>`                                           | `[6, 10]`        | Paper width                                                     |
|         | `height`             | `Range<Pixels>`                                           | `[10, 16]`       | Paper height                                                    |
|         | `aspectRatio`        | `Range<Ratio>`                                            | —                | Alternative to `height` (height = width × ratio)                |
|         | `scale`              | `Range<Multiplier>`                                       | `1`              | Uniform size multiplier                                         |
| Form    | `form`               | `"rect" \| "square" \| "circle" \| "strip" \| "leaf"`     | `"rect"`         | Silhouette of the paper                                         |
|         | `cornerRadius`       | `Range<Pixels> \| CornerRadius`                           | `0`              | Rounds corners; per-corner object allowed; clamped to half side |
|         | `skew`               | `Range<Degrees>`                                          | `0`              | Parallelogram skew for a "cut paper" look                       |
| Colour  | `colors`             | `ColorSource`                                             | 7-colour palette | Front colour(s); array = random pick, weights supported         |
|         | `colorMode`          | `"random" \| "sequence"`                                  | `"random"`       | How colours are picked from the list                            |
|         | `backColor`          | `ColorSource \| "auto"`                                   | `"auto"`         | Back side colour when flipped; `"auto"` = darkened front        |
|         | `backShade`          | `Ratio`                                                   | `0.25`           | Darkening amount used by `backColor: "auto"`                    |
|         | `gradient` (M3)      | `ColorGradient`                                           | none             | Linear gradient fill instead of a flat colour                   |
|         | `colorOverLife` (M3) | `ColorGradient`                                           | none             | Colour animates from start → end during lifetime                |
| Stroke  | `stroke`             | `{ color, width, dash? }`                                 | none             | Outline around the paper                                        |
| Opacity | `opacity`            | `Range<Ratio>`                                            | `1`              | Starting opacity                                                |
|         | `fadeOut`            | `boolean \| { start: Ratio; easing }`                     | `true`           | Fade near end of life                                           |
| Motion  | `rotation`           | `Range<Degrees>`                                          | `[0, 360]`       | Initial 2D rotation                                             |
|         | `rotationSpeed`      | `Range<Degrees>` (per second)                             | `[-180, 180]`    | Spin speed                                                      |
|         | `flip`               | `boolean \| { speed: Range; axis: "x" \| "y" \| "both" }` | `true`           | 3D flip (the paper "turning over")                              |
|         | `wobble`             | `boolean \| { amplitude; speed }`                         | `true`           | Side-to-side flutter                                            |
|         | `tilt` (M3)          | `Range<Degrees>`                                          | `[-30, 30]`      | Perspective tilt                                                |
| Effects | `shadow` (M3)        | `{ color, blur, offsetX, offsetY }`                       | none             | Drop shadow (⚠ costly, documented in `@remarks`)                |
|         | `shine` (M3)         | `boolean \| Ratio`                                        | `false`          | Specular highlight when paper faces the viewer                  |
|         | `blendMode`          | `GlobalCompositeOperation`                                | `"source-over"`  | Canvas blend mode                                               |

Notes

- All defaults live in `packages/konfeti/src/config/PaperDefaults.ts` (checked with `satisfies`). M1 implemented every row except those marked (M3); exact defaults are the TSDoc `@defaultValue`s in `types/PaperStyle.ts` and still need visual tuning.
- `flip.frequency` and `wobble.frequency` are in Hz (cycles/second); `rotationSpeed` is °/s.
- Every option gets full TSDoc: description, unit, range, `@defaultValue`, `@example` (see `CLAUDE.md` §6).
- The same style keys (`colors`, `opacity`, `rotation`, `stroke`, `shadow`, …) are shared by other shapes via a common `BaseParticleStyle` type, so users learn one vocabulary.

### 3.1 Core (MVP)

- `fire(options?)` → `KonfetiHandle` (awaitable Promise, plus `stop()`, `pause()`, `resume()`)
- `create(canvas | options)` → an instance tied to its own canvas; the default is an auto-created fullscreen overlay canvas
- `reset()` / `destroy()`, automatic loop stop when no particles remain
- DPR support, ResizeObserver, pause while tab is hidden
- `prefers-reduced-motion` support (`disableForReducedMotion`, or a reduced mode)
- Object pool of `Particle` instances (no per-frame allocation), `maxParticles` limit
- Seedable RNG (`seed`) → deterministic animations and tests

### 3.2 Emission / origin

- `origin: { x, y }` (0–1 normalised) **or** `origin: HTMLElement` (from the element's centre)
- `angle`, `spread`, `startVelocity`, `particleCount`
- **Ranges** everywhere: `number | [min, max] | { min, max }`
- Emission modes: `burst` (one shot), `stream` (rate/duration), `interval`
- Helpers: `fromElement(el)`, `onClick(el, options)`, `fromPointer(event)`

### 3.3 Shapes

- Built-in: `paper` (default, §3.0), `square`, `circle`, `star`, `triangle`, `heart`, `ribbon` (streamer), `line`
- `path` — SVG path string / `Path2D`
- **`emoji`** — `"🎉"`, or an array for random picks; font, size, pre-rendered bitmap cache
- **`text`** — any string, custom font, colour
- **`image`** — `HTMLImageElement | ImageBitmap | url`, optional tint
- **`spritesheet`** — frame grid or atlas JSON, `fps`, `loop`, `randomStartFrame`
- Weighted shape mix: `shapes: [{ type: "star", weight: 3 }, { type: "emoji", emoji: "🎊", weight: 1 }]`
- **`defineShape<TOptions>()`** — custom shapes with type-safe options via module augmentation

### 3.4 Visual

- `colors` (hex/rgb/hsl/CSS names), palette presets, per-particle random pick, gradient over lifetime
- `opacity` curve, `scale` curve (easing functions)
- 3D flip / tilt / wobble (the "paper" look), `rotation` + `rotationSpeed`
- Optional trail/glow (plugin, outside core)
- Blend mode (`globalCompositeOperation`)

### 3.5 Physics (composable modules)

- `gravity`, `drag`/`decay`, `wind`, `terminalVelocity`
- `wobble`, `tilt`, `flip`, `swirl`
- Lifetime: `ticks` or `duration(ms)`, fade-out
- Optional: floor bounce/collision, attractor/repeller (plugin)
- Custom physics module interface: `definePhysics()`

### 3.6 Presets

`basic`, `realistic`, `cannon`, `fireworks`, `schoolPride` (side cannons), `snow`, `stars`, `emojiRain`, `heartBurst`, `sideShots`
— each one plain data (`config/PRESET_VALUES`), overridable by the user.

### 3.7 Events / hooks

`onStart`, `onParticleSpawn`, `onParticleUpdate` (opt-in, hot path), `onParticleDeath`, `onComplete`

### 3.8 Advanced (post-MVP)

- `OffscreenCanvas` + Web Worker renderer (`useWorker: true`)
- SSR-safe import (no `window` access at import time)
- Playground: live option editor + "copy config" button

---

## 4. API Sketch

```ts
import { fire, create, defineShape, presets } from "konfeti";

// 1) one call
await fire();

// 2) customised
fire({
  particleCount: 150,
  origin: document.querySelector("#buy")!,
  spread: [60, 90],
  paper: {
    colors: ["#ff0a54", "#ffd000", "#00c2ff"],
    width: [6, 10],
    height: [12, 18],
    cornerRadius: 2,
    backColor: "auto",
    stroke: { color: "#ffffff", width: 0.5 },
  },
  shapes: [
    { type: "paper", weight: 4 },
    { type: "star", weight: 2 },
    { type: "emoji", emoji: ["🎉", "🥳", "✨"], size: [20, 32] },
    { type: "spritesheet", src: coinSheet, frames: { cols: 8, rows: 1 }, fps: 24 },
  ],
  physics: { gravity: 0.9, drag: 0.02, wind: 0.1 },
  seed: 42,
});

// 3) preset + override
fire(presets.fireworks({ duration: 3000 }));

// 4) instance on its own canvas
const k = create(myCanvas, { resize: true, useWorker: true });
const handle = k.fire({ preset: "snow" });
handle.pause();

// 5) type-safe custom shape
declare module "konfeti" {
  interface ShapeRegistry {
    diamond: { sharpness?: number };
  }
}
defineShape("diamond", {
  draw(ctx, particle, opts) {
    /* ... */
  },
});
fire({ shapes: [{ type: "diamond", sharpness: 0.7 }] }); // ✅ typed
```

---

## 5. Architecture

```
fire(options)
  └─ normalizeOptions()          # Range → sampler, defaults merged, validated
      └─ Emitter.emit()           # pulls particles from ParticlePool
          └─ Engine (rAF loop)
              ├─ physics modules  # update(particle, dt) — pure, no allocations
              ├─ lifecycle        # age, death → back to pool
              └─ Renderer.draw()  # Canvas2D | Offscreen (worker)
                   └─ Shape.draw()  ← BitmapCache (emoji/text/sprite)
```

- **Engine**: one rAF loop per instance, delta-time based (framerate independent), stops itself when idle.
- **ParticlePool**: object pool of `Particle` instances; `acquire()` → `reset(resolvedOptions)`, death → `release()`. Pool can be pre-warmed (`poolSize`).
- **Renderer interface**: `begin()`, `drawParticle()`, `end()` — Canvas2D and Worker use the same contract.
- **Shape contract**: `prepare(opts) → ShapeInstance` (cache warm-up) + `draw(ctx, p)`.

---

## 6. Milestones

| #     | Milestone         | Content                                                                                                                                                 |
| ----- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0    | Scaffolding ✅    | pnpm workspace, tsconfig (strict), ESLint/Prettier, Vitest, tsdown config, CI, size-limit                                                               |
| M1    | Core engine ✅    | Engine, ParticlePool, Emitter, Canvas2DRenderer, **fully customisable default paper particle** (§3.0), `fire()`                                         |
| M2 ✅ | Shapes            | star/triangle/heart/ribbon/path, **emoji/text + BitmapCache**, **image, spritesheet**                                                                   |
| M3 ✅ | Physics + visual  | composable physics, flip/wobble/tilt, opacity/scale curves, colour utilities                                                                            |
| M4 ✅ | Presets + helpers | presets, `fromElement`, `onClick`, emission modes (stream/interval), hooks                                                                              |
| M5 🟡 | Advanced          | ✅ `defineShape` / `definePhysics` (typed registries) · ✅ tree-shakeable shape handlers + `konfeti/lite` · ⏸ Worker/OffscreenCanvas (decision pending) |
| M6    | Docs & playground | playground with live option editor, TypeDoc site, README examples · ✅ package README                                                                   |
| M7    | 1.0               | API freeze, benchmarks (1k/5k/10k particles), visual regression tests, release                                                                          |

---

## 7. Open Questions

- **Bundle size** (measured 2026-09-28, min+brotli): `konfeti` fire 13.77 kB, everything 15.24 kB, `konfeti/lite` fire 10.9 kB. The original 6 kB goal was dropped; the core engine alone is ~10.4 kB. Further candidates: canvas-only color parsing (~0.8 kB), lazy physics modules (~0.5 kB).
- Canvas `shadow` and `shine` costs should be benchmarked with 1500 particles.

- Default palette: canvas-confetti's classic 7 colours, or our own signature palette? (decide while tuning in M1)
- SoA typed-array pool: only if M7 benchmarks show the object pool as a bottleneck at 5k–10k particles.
