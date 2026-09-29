# konfeti

Zero-dependency, strictly typed, highly customizable canvas confetti — with first-class **emoji, text, image
and spritesheet** particles, composable physics and a typed plugin API.

**English** · [Türkçe](./README.tr.md)

```sh
npm install konfeti
```

```ts run
import { Konfeti } from "konfeti";

Konfeti.fire(); // classic confetti pop
```

## API at a glance

```ts
import { Konfeti, KonfetiFactory, KonfetiPresets, type FireOptions } from "konfeti";

Konfeti.fire(); // shared fullscreen canvas
Konfeti.fire(KonfetiPresets.SNOW);
Konfeti.onClick(button, { particleCount: 30 });
Konfeti.reset();

const stage = KonfetiFactory.create(canvas, { maxParticles: 800 }); // your own canvas
stage.fire();
stage.destroy();

const options: FireOptions = { particleCount: 80 };
```

## Contents

- [API at a glance](#api-at-a-glance)
- [Basics](#basics)
- [The paper particle](#the-paper-particle)
- [Shapes](#shapes)
- [Physics](#physics)
- [Emission](#emission)
- [Presets](#presets)
- [Hooks](#hooks)
- [Instances & canvases](#instances--canvases)
- [Worker rendering](#worker-rendering)
- [Custom shapes & physics](#custom-shapes--physics)
- [Bundle size & `konfeti/lite`](#bundle-size--konfetilite)
- [Units & ranges](#units--ranges)

## Basics

```ts run
import { Konfeti } from "konfeti";

const burst = Konfeti.fire({
  particleCount: 120,
  angle: 60, // 90 = up, 0 = right
  spread: 55,
  origin: { x: 0, y: 0.7 }, // normalized canvas position
});

burst.pause();
burst.resume();
await burst; // resolves when every particle is gone
```

`origin` can also be an **element** (particles start from its center) or a **click event**:

```ts
button.addEventListener("click", (event) => Konfeti.fire({ origin: event }));
Konfeti.fire({ origin: document.querySelector("#buy")! });
```

Every numeric option accepts a fixed value or a random **range**: `10`, `[8, 14]` or `{ min: 8, max: 14 }`.

## The paper particle

The default confetti piece is fully configurable through `paper`:

```ts run
Konfeti.fire({
  paper: {
    form: ["rect", "circle", { value: "strip", weight: 2 }], // weighted mix of silhouettes
    width: [6, 10],
    height: [12, 18],
    cornerRadius: 2, // or { tl: 6, br: 6 }
    skew: [-15, 15],
    colors: ["#ff0a54", "#ffd000", { color: "#00c2ff", weight: 3 }],
    backColor: "auto", // darkened front color while flipped
    stroke: { color: "white", width: 0.5 },
    gradient: { colors: ["gold", "orange"], angle: 45 },
    flip: { axis: "both", frequency: [0.5, 1.5] },
    wobble: { amplitude: [2, 8] },
    fadeOut: { start: 0.6, easing: "easeInQuad" },
    scaleOverLife: { to: 0.4 },
    shine: 0.5,
  },
});
```

Forms: `rect`, `square`, `circle`, `strip`, `leaf`. Other style keys: `scale`, `colorMode`, `backShade`,
`colorOverLife`, `opacity`, `fadeIn`, `rotation`, `rotationSpeed`, `tilt`, `shadow`, `blendMode`.
Every option is documented in the type definitions — hover it in your editor.

## Shapes

Mix any shapes with weights. Style keys set in `paper` are the base for every shape; each entry can override
them.

```ts run
Konfeti.fire({
  paper: { colors: ["#ff0a54", "#ffd000"] },
  shapes: [
    { type: "paper", weight: 4 },
    { type: "star", points: [5, 6], shine: 0.6 },
    { type: "heart", colors: "#ff4d6d" },
    { type: "emoji", emoji: ["🎉", "🥳", { value: "✨", weight: 3 }], size: [22, 32] },
    { type: "text", text: ["YAY", "WOW"], fontWeight: 900 },
    { type: "image", src: "/coin.png", size: [20, 30] },
    { type: "spritesheet", src: "/coin-spin.png", frames: { cols: 8, rows: 1 }, fps: 14 },
  ],
});
```

| Type          | Specific options                                           |
| ------------- | ---------------------------------------------------------- |
| `paper`       | paper geometry (see above)                                 |
| `star`        | `size`, `points`, `innerRatio`                             |
| `triangle`    | `size`                                                     |
| `polygon`     | `size`, `sides`                                            |
| `heart`       | `size`                                                     |
| `ribbon`      | `length`, `thickness`, `waves`                             |
| `path`        | `path` (SVG `d` or `Path2D`), `viewBox`, `size`            |
| `emoji`       | `emoji`, `size` (font size), `fontFamily`                  |
| `text`        | `text`, `size` (font size), `fontFamily`, `fontWeight`     |
| `image`       | `src` (URL or any canvas image source), `size` (width)     |
| `spritesheet` | `src`, `frames`, `fps`, `loop`, `randomStartFrame`, `size` |

Emoji and text are rasterized once and cached. Preload URL images with `loadImage(url)`.

## Physics

```ts run
Konfeti.fire({
  physics: {
    gravity: 700, // px/s², negative floats upward
    drag: 3.5, // 1/s
    wind: [-40, 40], // px/s²
    terminalVelocity: 900, // px/s
    swirl: { strength: [80, 200], frequency: [0.3, 0.8] },
    floor: { y: 1, bounce: 0.35, friction: 0.4 }, // particles bounce and rest
  },
});
```

## Emission

```ts run
Konfeti.fire({ emission: { mode: "burst" } }); // default: everything at once
Konfeti.fire({ particleCount: 200, emission: { mode: "stream", duration: 3000 } }); // fountain
Konfeti.fire({
  particleCount: 50,
  emission: { mode: "interval", every: 350, times: 8 },
  origin: { x: [0.2, 0.8] },
});
```

Interval shots sample the origin once per shot — ranged origins produce fireworks at different spots.

## Presets

```ts run
import { Konfeti, KonfetiPresets, extendPreset } from "konfeti";

Konfeti.fire(KonfetiPresets.FIREWORKS);
Konfeti.fire(extendPreset(KonfetiPresets.SNOW, { emission: { mode: "stream", duration: 10000 } })); // your settings win
```

`BASIC`, `REALISTIC`, `CANNON`, `SIDE_SHOTS`, `SCHOOL_PRIDE`, `FIREWORKS`, `SNOW`, `STARS`, `EMOJI_RAIN`,
`HEART_BURST`. Presets are plain, read-only options (`SIDE_SHOTS` and `SCHOOL_PRIDE` are two bursts). `extendPreset`
merges your settings into every burst without changing the preset; `paper` and `physics` merge key by key.

## Hooks

```ts run
Konfeti.fire({
  onStart: () => {},
  onParticleSpawn: (p) => {},
  onParticleUpdate: (p, dt) => {}, // hot path, may mutate p.x / p.vx …
  onParticleDeath: (p) => {},
  onComplete: () => {},
});
```

## Instances & canvases

`Konfeti` is a shared fullscreen instance. Use `KonfetiFactory.create()` for your own canvas, separate defaults or a separate particle budget:

```ts
import { KonfetiFactory } from "konfeti";

const stage = KonfetiFactory.create(document.querySelector("canvas"), {
  maxParticles: 800,
  disableForReducedMotion: true,
  defaults: { paper: { colors: ["gold", "white"] } },
});

stage.fire({ particleCount: 80 });
const off = stage.onClick(document.querySelector("#like")!, { particleCount: 30 });
off(); // stop listening
stage.reset();
stage.destroy(); // also removes its click listeners
```

The first instance on a page logs a one-line banner with the version and renderer to the console. Call
`disableBanner()` before firing to keep the console silent.

## Worker rendering

`KonfetiFactory.createWorker()` moves simulation and drawing into a Web Worker through an `OffscreenCanvas`, so
large bursts keep animating while the main thread is busy (heavy React renders, long tasks, scrolling):

```ts
import { KonfetiFactory } from "konfeti";

const stage = KonfetiFactory.createWorker(document.querySelector("canvas"), { maxParticles: 3000 });

await stage.fire({
  particleCount: 1500,
  shapes: [{ type: "paper" }, { type: "emoji", emoji: "🎉" }],
});
stage.isWorker(); // false when the browser cannot render offscreen — it then runs on the main thread
stage.destroy(); // terminates the worker
```

Pass `null` (or nothing) for the canvas to get a fullscreen overlay, like `Konfeti`.

Options travel to the worker by `postMessage`, so they must be structured-cloneable. The types
(`WorkerFireOptions`) enforce this:

| Works in a worker                                      | Main thread only                                     |
| ------------------------------------------------------ | ---------------------------------------------------- |
| every paper, style, physics and emission option        | hooks (`onStart`, `onParticleSpawn`, `onComplete` …) |
| built-in shapes, emoji and text                        | custom `defineShape` / `definePhysics` modules       |
| `image` / `spritesheet` with a URL or an `ImageBitmap` | `HTMLImageElement`, `Path2D` and other DOM sources   |
| `origin` as a point, an element or a click event       | —                                                    |

Element and click origins are measured on the main thread before sending. Use `await` on the handle instead
of `onComplete`.

The worker script itself (~13.7 kB brotli) is loaded only when the first worker instance is created. With a
bundler it is inlined as a `blob:` URL; the `<script>` build loads `konfeti.worker.js` from its own folder. For a
strict Content-Security-Policy without `worker-src blob:`, host `konfeti/worker.js` yourself:

```ts
KonfetiFactory.createWorker(canvas, { workerUrl: "/vendor/konfeti.worker.js" });
```

If the script cannot load, every burst rejects with a clear error instead of hanging.

## Custom shapes & physics

Register your own shapes and physics modules — declare their options once and they are fully typed
everywhere.

```ts
import { Konfeti, defineShape, definePhysics } from "konfeti";

declare module "konfeti" {
  interface ShapeRegistry {
    diamond: { sharpness?: number };
  }
  interface PhysicsRegistry {
    magnet: { x: number; y: number; strength: number };
  }
}

// path-based: gradients, stroke, shine and flip work automatically
defineShape("diamond", {
  viewBox: [24, 24],
  path: ({ sharpness = 0.5 }) => `M12 0L${24 - sharpness * 12} 12L12 24L${sharpness * 12} 12Z`,
});

definePhysics("magnet", {
  defaults: { x: 0.5, y: 0.5, strength: 600 },
  apply: (p, dt, world, { x, y, strength }) => {
    p.vx += (x * world.width - p.x) * strength * dt * 0.001;
    p.vy += (y * world.height - p.y) * strength * dt * 0.001;
  },
});

Konfeti.fire({
  shapes: [{ type: "diamond", sharpness: 0.8 }],
  physics: { magnet: { strength: 900 } },
});
```

Draw-based shapes (`defineShape(name, { draw(ctx, particle, options) { … } })`) get full canvas control
with the transform already applied.

## Bundle size & `konfeti/lite`

| Usage                                           | Size (min + brotli) |
| ----------------------------------------------- | ------------------- |
| `Konfeti` from `konfeti`                        | ~14.3 kB            |
| everything from `konfeti`                       | ~17.2 kB            |
| `Konfeti` from `konfeti/lite`                   | ~11.4 kB            |
| worker script (loaded by `createWorker()` only) | ~13.7 kB            |

`konfeti` registers every built-in shape for you. `konfeti/lite` starts with **paper only** — register just the
shapes you use and your bundler drops the rest:

```ts run
import { Konfeti, registerShapes, starShape, emojiShape } from "konfeti/lite";

registerShapes(starShape, emojiShape);
Konfeti.fire({ shapes: [{ type: "star" }, { type: "emoji", emoji: "🎉" }] });
```

Presets live in the full entry only (they use several shapes).

## Units & ranges

| Alias                      | Meaning                         |
| -------------------------- | ------------------------------- |
| `Pixels`                   | CSS pixels (before DPR scaling) |
| `Degrees`                  | 0 = right, 90 = up              |
| `Milliseconds`             | time                            |
| `Ratio`                    | 0–1 (clamped)                   |
| `Hertz`                    | cycles per second               |
| `PixelsPerSecond(Squared)` | speed / acceleration            |

Invalid options throw a `TypeError` that names the option (`"paper.width" must be a finite number`).

## License

[MIT](../../LICENSE)
