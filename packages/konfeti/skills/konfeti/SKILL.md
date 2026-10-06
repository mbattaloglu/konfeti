---
name: konfeti
description: Add confetti and celebration particle effects to browser apps with the konfeti library (canvas, zero dependencies, fully typed). Use when the user wants confetti, fireworks, snow, emoji/text/image/spritesheet particle bursts, a pointer trail, a "You win!" text or logo formation, or any celebration effect on a web page, or when the code already imports "konfeti". Covers the one-call API, presets, shapes, physics, emitters, formations, own canvases, Web Worker rendering, the lite entry and playable ads.
license: MIT
---

# konfeti

konfeti draws particle bursts on a canvas: `Konfeti.fire()` is a complete confetti pop, and every option is
optional, typed and validated. It has no dependencies and runs in any modern browser (ES2022).

## Before writing code

- Install: `npm install konfeti` (or `pnpm add konfeti` / `yarn add konfeti`). Without a bundler, load
  `https://cdn.jsdelivr.net/npm/konfeti/dist/konfeti.iife.js`; it defines `window.konfeti`
  (`konfeti.Konfeti.fire()`).
- The installed version is the source of truth. Every option is documented (meaning, unit, range, default,
  example) in the type definitions: `node_modules/konfeti/dist/*.d.ts`. The guide is
  `node_modules/konfeti/README.md`. Online: https://konfeti.mbattaloglu.com/llms.txt (Markdown index) and
  https://konfeti.mbattaloglu.com/llms-full.txt (guide + API reference in one file).
- Do not invent option names; look them up in `FireOptions`. A wrong option fails to compile, and an invalid
  value throws a `TypeError` that names it (`"paper.width" must be a finite number`).
- Users can tune a look visually in the playground (https://konfeti.mbattaloglu.com/) and copy the code from
  there.

## Pick the entry

| Import                            | Use for                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| `konfeti`                         | the default: every shape registered, presets, formations                   |
| `konfeti/lite`                    | smallest bundle: paper only until `registerShapes(...)`; no presets        |
| `konfeti/worker`                  | `createWorker()`: simulation and drawing in a Web Worker (OffscreenCanvas) |
| `<script>` `dist/konfeti.iife.js` | no bundler: `window.konfeti` with everything, `createWorker` included      |

## Core API

```ts
import { Konfeti, KonfetiFactory, KonfetiPresets, extendPreset } from "konfeti";
import type { FireOptions } from "konfeti";

Konfeti.fire(); // the shared fullscreen instance: nothing to set up or clean up
Konfeti.fire({ particleCount: 120, spread: 90, origin: { x: 0.5, y: 0.3 } });
Konfeti.fire(KonfetiPresets.FIREWORKS);
Konfeti.fire(extendPreset(KonfetiPresets.SNOW, { particleCount: 60 })); // your settings win

const burst = Konfeti.fire(); // every fire() returns a handle
burst.pause();
burst.resume();
await burst; // resolves when its last particle is gone
const seed = burst.getSeed(); // fire the same options with { seed } to get the same burst again

Konfeti.pause(); // everything (e.g. while an ad is hidden)
Konfeti.resume();
Konfeti.reset(); // remove every particle

const canvas = document.querySelector("canvas");
const stage = KonfetiFactory.create(canvas, { maxParticles: 800 }); // own canvas, defaults, particle budget
stage.fire({ particleCount: 80, seed });
stage.destroy(); // always destroy instances you create

const options: FireOptions = { particleCount: 80, paper: { colors: ["#d6ff3f", "#ffffff"] } };
Konfeti.fire(options);
```

## Options at a glance

`fire()` takes one `FireOptions` object or a list of them (several bursts, e.g. with different `delay`s):

| Option          | Meaning                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `particleCount` | pieces per burst (default 60)                                                                                                                       |
| `origin`        | `{ x, y }` normalized 0–1 (default `{ x: 0.5, y: 0.6 }`), an element (its center) or a click/pointer event                                          |
| `angle`         | launch direction in degrees: 90 = up, 0 = right                                                                                                     |
| `spread`        | cone width in degrees (360 = every direction)                                                                                                       |
| `startVelocity` | launch speed in px/s                                                                                                                                |
| `lifetime`      | ms each particle lives                                                                                                                              |
| `emission`      | `{ mode: "burst" }` (default), `{ mode: "stream", duration }`, `{ mode: "interval", every, times }`                                                 |
| `delay`         | ms before the burst starts                                                                                                                          |
| `paper`         | the default piece and the base style of every shape: `colors`, `form`, `width`, `height`, `flip`, `wobble`, `fadeOut`, `trail`, `shine`, `shadow` … |
| `shapes`        | weighted mix of shapes (see below); each entry can override `paper` style keys                                                                      |
| `physics`       | `gravity`, `drag`, `wind`, `terminalVelocity`, `swirl`, `floor`, `attract`                                                                          |
| `formation`     | particles form a `text` or an `image`, hold it, then burst apart                                                                                    |
| `seed`          | random seed for an identical replay                                                                                                                 |
| hooks           | `onStart`, `onParticleSpawn`, `onParticleUpdate`, `onParticleDeath`, `onComplete`                                                                   |

Every numeric option that varies per particle takes a value or a random range: `10`, `[8, 14]` or
`{ min: 8, max: 14 }`. Units: CSS pixels, degrees (0 = right, 90 = up), milliseconds, ratios 0–1.
`KonfetiPalettes` has ready color lists (`PASTEL`, `GOLD`, `NEON`, `RAINBOW` …): `paper: { colors: KonfetiPalettes.GOLD }`.

## Recipes

Burst from a button, at the click position:

```ts
import { Konfeti } from "konfeti";

const button = document.querySelector("#buy");

if (button) {
  const off = Konfeti.onClick(button, { particleCount: 40, spread: 70 });
  // off() stops listening; with a game engine that cancels touch events, pass { trigger: "pointerdown" }
  void off;
}
```

Mix shapes (emoji and text are rasterized once and cached; `tint` paints one white image in every color):

```ts
import { Konfeti, loadImage } from "konfeti";

const coin = await loadImage("/coin.png"); // preload, so the first burst has its image

Konfeti.fire({
  paper: { colors: ["#ff0a54", "#ffd000"] },
  shapes: [
    { type: "paper", weight: 4 },
    { type: "star", points: [5, 6], shine: 0.6 },
    { type: "emoji", emoji: ["🎉", "🥳", { value: "✨", weight: 3 }], size: [22, 32] },
    { type: "text", text: ["YAY", "WOW"], fontWeight: 900 },
    { type: "image", src: coin, size: [20, 30], tint: true, colors: ["#26ccff", "#ffd000"] },
    { type: "spritesheet", src: "/coin-spin.png", frames: { cols: 8, rows: 1 }, fps: 14 },
  ],
});
```

Choreography, a fountain and a pointer trail:

```ts
import { Konfeti } from "konfeti";

Konfeti.fire([
  { origin: { x: 0, y: 0.8 }, angle: 60 },
  { origin: { x: 1, y: 0.8 }, angle: 120, delay: 250 },
  { origin: { x: 0.5, y: 0.5 }, spread: 360, startVelocity: [500, 1000], delay: 700 },
]);

Konfeti.fire({ particleCount: 200, emission: { mode: "stream", duration: 3000 } });

const trail = Konfeti.emit({ rate: 60, follow: "pointer", spread: 360, lifetime: 800 });
setTimeout(() => {
  trail.stop(); // particles already out finish their lives
}, 3000);
```

A "You win!" end card (text formation), and physics:

```ts
import { Konfeti } from "konfeti";

Konfeti.fire({
  origin: { x: 0.5, y: 0.45 },
  formation: { text: "YOU WIN!", font: "900 110px sans-serif", mode: "assemble", hold: 1200 },
  shapes: [{ type: "paper", weight: 3 }, { type: "star" }],
});

Konfeti.fire({
  physics: {
    gravity: 700, // px/s², negative floats upward
    wind: [-40, 40],
    floor: { y: 1, bounce: 0.35, friction: 0.4 },
    attract: { target: "pointer", strength: 900 },
  },
});
```

Own canvas inside a component (create on mount, destroy on unmount; React `useEffect`, Vue
`onMounted`/`onUnmounted` and Svelte `onMount` all follow this shape):

```ts
import { KonfetiFactory } from "konfeti";
import type { KonfetiInstance } from "konfeti";

let stage: KonfetiInstance | null = null;

function mount(canvas: HTMLCanvasElement): void {
  stage = KonfetiFactory.create(canvas, {
    disableForReducedMotion: true,
    defaults: { paper: { colors: ["gold", "white"] } },
  });
}

function celebrate(): void {
  stage?.fire({ particleCount: 80 });
}

function unmount(): void {
  stage?.destroy(); // stops the loop, clears the canvas, removes listeners
  stage = null;
}
```

Large bursts off the main thread (options must be structured-cloneable: no hooks, no DOM image elements;
`await` the handle instead of `onComplete`):

```ts
import { createWorker } from "konfeti/worker";

const stage = createWorker(null, { maxParticles: 3000 }); // null = fullscreen overlay
await stage.fire({
  particleCount: 1500,
  shapes: [{ type: "paper" }, { type: "emoji", emoji: "🎉" }],
});
stage.destroy(); // terminates the worker
```

Smallest bundle:

```ts
import { Konfeti, registerShapes, starShape, emojiShape } from "konfeti/lite";

registerShapes(starShape, emojiShape);
Konfeti.fire({ shapes: [{ type: "star" }, { type: "emoji", emoji: "🎉" }] });
```

## Presets

`KonfetiPresets.<NAME>` is plain, read-only options; pass it to `fire()` as is or through `extendPreset`.

| Preset           | Look                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| `BASIC`          | the defaults: one classic pop, upward from just below the center                      |
| `REALISTIC`      | five overlapping bursts (200 pieces) for a natural, layered pop                       |
| `CANNON`         | a fast, narrow shot from the bottom-left corner toward the upper right                |
| `SIDE_SHOTS`     | two bursts at once, from the left and right edges toward the center                   |
| `SCHOOL_PRIDE`   | red and white streams from both sides for three seconds                               |
| `FIREWORKS`      | eight round explosions at random spots in the upper half                              |
| `SNOW`           | flakes and snow crystals drifting down for six seconds                                |
| `STARS`          | a golden, shiny star burst in every direction from the center                         |
| `EMOJI_RAIN`     | party emoji falling from the top for three seconds                                    |
| `HEART_BURST`    | pink hearts popping out in every direction                                            |
| `SHOOTING_STARS` | golden stars streaking down with long trails                                          |
| `MAGNET`         | a floating cloud that follows the pointer (`physics.attract`)                         |
| `FORCE_FIELD`    | a rain the pointer pushes away (negative `attract`)                                   |
| `GOLDEN`         | gold paper with strong glints                                                         |
| `SPARKLER`       | glowing sparks with short trails from the center (additive; best on dark backgrounds) |
| `FIREFLIES`      | glowing dots that drift and fade (for dark backgrounds)                               |
| `JACKPOT`        | gold coins that pour down, bounce and settle on the bottom edge (`floor`)             |
| `CONGRATS`       | paper and stars spell "CONGRATS!", hold it, then burst apart (text formation)         |
| `LEVEL_UP`       | "LEVEL UP!" assembles while stars shoot up, then a star burst (bursts with `delay`)   |
| `SUCCESS`        | a green check mark made of confetti that bursts apart (image formation)               |
| `LOGO_REVEAL`    | a star badge made of confetti in its own colors that bursts apart (image formation)   |

## Shapes

| Type          | Specific options                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `paper`       | `form` (`rect`, `square`, `circle`, `strip`, `leaf`), `width`, `height`, `cornerRadius`, `skew`              |
| `star`        | `size`, `points`, `innerRatio`                                                                               |
| `triangle`    | `size`                                                                                                       |
| `polygon`     | `size`, `sides`                                                                                              |
| `heart`       | `size`                                                                                                       |
| `ribbon`      | `length`, `thickness`, `waves`                                                                               |
| `path`        | `path` (SVG `d` or `Path2D`), `viewBox`, `size`                                                              |
| `emoji`       | `emoji`, `size` (font size), `fontFamily`                                                                    |
| `text`        | `text`, `size` (font size), `fontFamily`, `fontWeight`                                                       |
| `image`       | `src` (URL, inline `<svg …>` or any canvas image), `size`, `tint`                                            |
| `spritesheet` | `src`, `frames` (grid, rects or `framesFromAtlas(atlas)`), `fps`, `loop`, `randomStartFrame`, `size`, `tint` |

Every shape also takes `weight` and any `paper` style key (`colors`, `scale`, `opacity`, `fadeOut`, `trail` …).
Custom shapes and physics: `defineShape` / `definePhysics`, typed through `declare module "konfeti"` on
`ShapeRegistry` / `PhysicsRegistry` (see the guide).

## Rules and pitfalls

- **Lifecycle:** the shared `Konfeti` needs no cleanup. Every `KonfetiFactory.create()` / `createWorker()`
  instance must be `destroy()`ed when its view goes away; `onClick` returns an unsubscribe function.
- **SSR:** importing konfeti on the server is safe (no `window` access at import). Call `fire()` only in the
  browser: in event handlers or client-side effects.
- **Accessibility:** pass `disableForReducedMotion: true` to `create()` to respect `prefers-reduced-motion`
  (off by default).
- **Images:** preload URLs with `loadImage(url)`. A formation from a cross-origin image needs CORS headers.
  In single-file playable ads use `data:` URIs or images the engine already loaded (a URL is a network
  request), call `Konfeti.pause()` / `resume()` on visibility changes, and avoid `konfeti/worker`.
- **Performance:** `paper.shadow` (canvas blur) is the one expensive option: keep it to a few hundred
  particles. `maxParticles` caps the total (oldest particles go first); `adaptiveQuality: true` on `create()`
  lowers quality on slow devices.
- **Lite entry:** shapes other than paper throw until registered with `registerShapes`; presets are only in
  `konfeti`; formations need `enableFormations()` once.
- **Console:** the first instance logs a one-line banner; call `disableBanner()` before firing in production.
- **Strict TypeScript:** with `exactOptionalPropertyTypes`, leave an option out instead of passing `undefined`.
