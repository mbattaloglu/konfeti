# CLAUDE.md — Konfeti

> Name: **Konfeti** (npm `konfeti`, unscoped). License: **MIT**.

A zero-dependency, strictly typed, highly customizable **canvas confetti / particle-burst library** for the browser.
Positioning: as tiny and "one-call" as [canvas-confetti](https://github.com/catdad/canvas-confetti), but with first-class
**emoji, text, image and spritesheet** particles, a **typed plugin system** for shapes/physics, and none of the weight of
[tsParticles](https://github.com/tsparticles/tsparticles).

Full roadmap, feature list and API sketch: **`docs/PLAN.md`**. Read it before starting any feature work.

---

## 1. Hard Rules (from the developer's global instructions)

- **Builds are allowed in this repo** (developer granted 2026-09-28, this project only): `pnpm build` (tsdown), `pnpm size` (size-limit) and bundle analysis may be run without asking. The global no-build rule still applies to every other project.
- **NEVER start a dev / watch / preview server** (`pnpm dev`, `vite`, playground, docs server). The developer runs these.
- Other allowed checks: `pnpm typecheck` (`tsc --noEmit`), `pnpm lint`, `pnpm format`, `pnpm test` (Vitest, single run — never `--watch`), `pnpm e2e` (build + Playwright in the installed Chrome; pages are served by request interception, no server).
- **No "done" without proof.** "Fixed / works / verified" only with the test output, type-check output, or screenshot in the same message. Otherwise say "I expect X — not yet verified".
- Before guessing, read `llms/` and `docs/`. Measure before tuning (particle counts, frame times, bundle size).
- Every new function / class / field / type / enum member gets a TSDoc comment (use the `tsdoc` skill).

---

## 2. Tech Stack

| Concern         | Choice                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language        | TypeScript **6.0** (`~6.0.3`; TS 7 not yet supported by typescript-eslint/TypeDoc), `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride`                                                                                                                                                                                                                                        |
| Runtime deps    | **None.** Core must stay dependency-free                                                                                                                                                                                                                                                                                                                                                                               |
| Package manager | pnpm monorepo (workspace: `packages/*`, `playground/`)                                                                                                                                                                                                                                                                                                                                                                 |
| Bundler         | tsdown (rolldown) → ESM + CJS + IIFE (`window.konfeti`) + `.d.ts`                                                                                                                                                                                                                                                                                                                                                      |
| Tests           | Vitest + happy-dom, canvas via `vitest-canvas-mock` (unit, library + playground editor); Playwright in real Chrome against the built `dist` (`e2e/`, `pnpm e2e`)                                                                                                                                                                                                                                                       |
| Lint / format   | ESLint flat config + `typescript-eslint` `strict-type-checked` + Prettier                                                                                                                                                                                                                                                                                                                                              |
| Size budget     | `size-limit` (brotli), see **Size policy** in §4: `Konfeti` full ≤ 19.7 kB, everything ≤ 23.5 kB, `konfeti/lite` `Konfeti` ≤ 14.3 kB, `konfeti/worker` `createWorker` ≤ 21.9 kB (+ lazily loaded worker script ≤ 40.6 kB total), worker script ≤ 19.1 kB — measured 19.29 / 23.11 / 13.94 / 21.53 (40.33) / 18.65 kB (2026-09-30, 0.4.0: formations, replays, adaptive quality, feature presets + firefly glow sprite) |
| Docs            | TypeDoc (API) + playground (Vite) for live option tuning                                                                                                                                                                                                                                                                                                                                                               |
| Release         | Changesets + `.github/workflows/release.yml`: pending changesets open a "Version Packages" PR (`pnpm run version-packages` also syncs `src/Version.ts`); merging it runs `scripts/release.mjs` — npm trusted publishing (OIDC, no token, provenance), tag `vX.Y.Z`, GitHub release from the CHANGELOG. Add a changeset (`pnpm changeset`) with every user-facing change                                                |

Targets: evergreen browsers (**ES2022** — native static class fields keep classes tree-shakeable). `OffscreenCanvas` / Web Worker path is optional and feature-detected.

---

## 3. Repository Layout

pnpm monorepo. **No framework adapters** (React/Vue/Svelte/Web Component are out of scope).

```
packages/
  konfeti/              # published as `konfeti` — engine, renderer, built-in shapes, presets
    src/
      index.ts          # full entry: everything in lite.ts + presets + registers every built-in shape
      lite.ts           # lite entry: Konfeti, KonfetiFactory, KonfetiInstance, define*/registerShapes, loadImage, handlers, types
      api/              # Konfeti (shared object), KonfetiFactory, DefaultInstance, defineShape, definePhysics, registerShapes, loadImage
      core/             # KonfetiInstance, Engine (rAF loop; fixedTimestep mode; adaptive quality via QualityMonitor), Burst (emission + hooks; "continuous" mode for emit()), GroupHandle, Emitter, EmitterHandle, OriginTracker (emit follow target), ParticlePool, CanvasSurface
        resolve/        # OptionResolver → StyleResolver / ShapeResolver / PhysicsResolver (public → Resolved*)
      particles/        # Particle (pooled data record), SpriteAnimator
      shapes/
        abstracts/      # IShape, BaseShape (fade, flip, wobble, tilt, shine, life scale/color)
        concretes/      # PaperShape, VectorShape, BitmapShape, SpriteShape, CustomShape (renderers)
        handlers/       # one ShapeHandler per shape type (resolve + spawn), BuiltinShapes list
        spawn/          # Paper/Vector/Bitmap/Sprite/CustomSpawner
      registry/         # ShapeHandlers, PhysicsDefinitions
      physics/          # PhysicsPipeline + abstracts/IPhysicsModule + concretes/{Force,Swirl,Drag,TerminalVelocity,Floor}Module
      renderers/        # Canvas2DRenderer (blend/shadow state) — draws to any RenderSurface (DOM or offscreen)
      presets/          # KonfetiPresets (21 built-ins, enum-style UPPER_SNAKE members, plain data), extendPreset, PresetUtils
      palettes/         # KonfetiPalettes (color themes, literal data only — same tree-shaking rule as presets)
      formation/        # formations (text / image made of particles): FormationResolver, Formation, text/image sources,
                        # FormationSampler — installed by enableFormations() (full + worker entries), never imported by core
      types/            # public option types (types/shapes/* per shape), types/resolved/* internal
      config/           # PaperDefaults, ShapeDefaults, FireDefaults, CreateDefaults, EasingFunctions
      utils/            # MathUtils, ColorUtils, ColorMix, Random, RangeUtils, WeightedListUtils, ImageSource, GlyphRasterizer, VectorPaths, EnvUtils, CanvasFactory
      worker/           # WorkerKonfetiInstance (main thread), WorkerRuntime + worker.ts (worker side), WorkerProtocol, OffscreenSurface, BitmapLoader
        generated/      # WorkerSource.ts + konfeti.worker.js — written by scripts/build-worker.mjs, git-ignored, never edit
      workerEntry.ts    # `konfeti/worker` entry: createWorker, WorkerKonfetiInstance, worker types (+ registers built-ins for the fallback)
      iife.ts           # <script> build entry: index + workerEntry; points the worker at konfeti.worker.js next to the script
    test/
playground/             # site (playground `/`, guide `/docs/`, API `/docs/api/`) on http://localhost:5199 — developer runs `pnpm dev`, never Claude
                        # i18n EN/TR: UI strings in src/i18n/messages.ts (both languages, TR type-checked for every key),
                        # control text in src/i18n/controlsTr.ts; the guide renders README.md / README.tr.md; API reference stays English
                        # src/editor: control model — initial values come from the library's config/ (a fresh editor builds `{}`),
                        # spans (min–max) for every Range option, Basic/Advanced mode; buildOptions.ts builds "minimal" (Fire, JSON, share)
                        # or "explicit" (Copy Code All Settings) options
                        # src/share: share link v2 (?s= base64url JSON { v: 2, b: [burst diffs], g? }; old v1 links migrate via
                        # migrateV1.ts) and Copy Code (only settings that differ from the defaults)
                        # test/: vitest + happy-dom (pnpm test runs it; resolved-equality comparer in test/helpers)
                        # src/analytics.ts (+ packages/konfeti/typedoc/analytics.js for the API pages via TypeDoc customJs): Vercel Web
                        # Analytics, root-relative /_vercel/insights/script.js, skipped on localhost; e2e answers that path with an empty stub
e2e/                    # Playwright browser tests: pages/ (esm, iife), support/site.ts (disk routing on http://konfeti.test), tests/
vercel.json             # Vercel static site: `pnpm site:build` → playground/dist, base path /tools/konfeti/ rewritten to /
docs/PLAN.md
llms/guides/            # style guides (scripting-logic.md) — local only, git-ignored
```

Folder for implementations is spelled **`concretes/`** (deliberately NOT the playable guide's `concreates`).

## 4. Code Conventions

Adapted from `llms/guides/scripting-logic.md` (that guide is written for Gearbox playables — engine-specific parts such as
`Script2D`, `EventSystem`, GSAP, scenes **do not apply** here; the structural/naming rules do).

- **Files:** PascalCase, filename === exported symbol, one class/type/enum per file. Group by feature, then `enums/`, `types/`, `config/`, `abstracts/`, `concretes/`.
- **No magic numbers in logic.** Tuning values are `private static readonly UPPER_SNAKE` or live in `config/` tables (`DEFAULT_FIRE_OPTIONS`, `PRESET_VALUES`).
- **Public API uses string-literal unions**, not enums (`shape: "star"` is nicer than `Shape.STAR` for users). Internal enums are string enums, namespaced (`"Konfeti::RUNNING"`).
- **Discriminated unions** for shape options (`{ type: "emoji"; emoji: string | string[] }`). No `any`; `unknown` + narrowing at boundaries.
- **Extensibility via declaration merging**: custom shapes register into `interface ShapeRegistry {}` so `fire({ shapes: [{ type: "myShape", ... }] })` is fully typed.
- **Booleans:** `_isRunning` backing field + `isRunning()` getter. Never expose raw fields as `public`.
  - Exception: `Particle` is a hot-path data record — its fields are public and mutable on purpose.
- **Type files:** one type per file, except tightly related aliases that only document intent (`types/Units.ts`, `types/ColorInput.ts`, `types/Range.ts`).
- Types are declared with `type`, not `interface` (lint-enforced). Only registries meant for declaration merging (`ShapeRegistry`, M5) use `interface` with a disable comment.
- **Setup/teardown symmetry:** every `register*` / `attach*` (resize observer, visibility listener, worker) has a matching `unregister*` / `detach*` called from `destroy()`. The loop must stop itself when no particles remain.
- **Imports order:** external → relative. **No path aliases** in library source (they leak into emitted `.d.ts`).
- Inline comments lowercase, explain _why_. Intent goes in TSDoc.
- **Two languages on the site:** every README change is mirrored into its Turkish twin (`packages/konfeti/README.tr.md` for the guide, root `README.tr.md` for the GitHub page); every new playground string/control gets its Turkish text (`messages.ts`, `controlsTr.ts`).

### Tree-shaking rules

- Shape code lives in `shapes/handlers/*` and is only reached through the `ShapeHandlers` registry — never import a handler (or its spawner/renderer) from core modules.
- Worker-only code (bitmap URL loading, offscreen scratch canvases) is installed from `worker/worker.ts` via setters (`ImageSource.setUrlLoader`, `CanvasFactory.setFallback`) so main-thread bundles don't carry it. The inlined worker script is only reachable through the dynamic `import("./spawnWorker")`.
- Formations are installed by `enableFormations()` into `registry/FormationSupport`; core modules may only import
  the `IFormation` / `IFormationSource` **types** (the lite entry then carries no formation code, measured +0.33 kB for
  the core hooks). The full entry, `workerEntry.ts` and `worker/worker.ts` call `enableFormations()`.
- `KonfetiPresets` is **literal data only** — no function calls (`.map`) and no object spreads at module level: `dist/index.*` is marked side-effectful, so either keeps every preset in bundles that never use them (measured +170 B on `Konfeti.fire()`).
- `package.json` `sideEffects` must list the full-entry files: `dist/index.*` registers the built-ins at import time, and `./src/index.ts` too — the playground aliases `konfeti` to the source, and without it the production site drops the registration (only paper works; dev hides it). Guarded by `test/Package.test.ts` and `e2e/tests/site.spec.ts`.
- Check `pnpm build && pnpm size` after any change that adds imports to core modules.
- **Public API shape:** `Konfeti` is the shared fullscreen instance object (`fire`, `onClick`, `reset`, `getParticleCount`). `KonfetiFactory.create()` builds dedicated `KonfetiInstance`s. Worker rendering is its own entry: `import { createWorker } from "konfeti/worker"` (so main-thread bundles carry no worker code; the entry also registers the built-in shapes for its fallback). Global tools stay named exports: types, `KonfetiPresets` (+ `extendPreset`), `defineShape`, `definePhysics`, `registerShapes`, `loadImage`, shape handlers. Don't add standalone `fire`/`create` exports back.

### Size policy (agreed 2026-09-29)

At ~15 kB brotli a few hundred bytes don't matter to users; the budgets exist to **catch accidents**
(tree-shaking regressions such as presets leaking into bundles, worker code inside `create()`, the IIFE
carrying the worker twice), not to fight every byte.

- Budgets sit **~0.3–0.5 kB above the measured size**. A new feature may grow a bundle: raise the budget to the
  new measurement + margin and mention it in one sentence — no need to ask.
- **Investigate** (build + inspect the bundle) when a bundle grows unexpectedly: an import that didn't change
  got bigger, or a jump of ~1 kB+ from a small change. That is almost always a tree-shaking mistake.
- Don't micro-optimize (20–50 B hunts) unless a budget is tight for a real reason.
- Keep README size tables roughly current (`~x.y kB`), measured with `pnpm build && pnpm size`.

### Hot-path performance rules (the frame loop)

- **Object pooling** (like tsParticles): dead `Particle` instances return to `ParticlePool` and are re-initialised via `reset()`; never `new Particle()` in the loop once the pool is warm.
- **Zero allocations per frame**: pooled particles, no closures/arrays/objects created inside `update`/`draw`.
- Use `ctx.setTransform(...)` per particle instead of `save()/restore()`.
- Emoji / text / tinted sprites are **pre-rendered once** into a `BitmapCache` keyed by `(glyph, font, size, color)` and drawn with `drawImage`.
- Spritesheets draw with source-rect `drawImage(img, sx, sy, sw, sh, …)`; never slice into separate images at runtime.
- Respect `devicePixelRatio`, `prefers-reduced-motion`, and pause on `document.hidden`.
- Cap `maxParticles`; drop oldest when exceeded.

---

## 5. Types — Rules

Types are a product feature. A user should be able to discover every option through autocomplete alone.

- `strict` everything; **no `any`**, no non-null `!` in library code (validate instead), no `as` except at DOM boundaries.
- **Public options are `Readonly`** and all-optional (`FireOptions`); internally they are normalised into all-required `Resolved*` types (`ResolvedFireOptions`) — the hot path never sees `undefined`.
- With `exactOptionalPropertyTypes`, optional means "may be omitted", not "may be `undefined`". Only add `| undefined` when passing `undefined` is meaningful.
- **Shared value types** (in `types/`, reused everywhere, never re-declared inline):
  - `Range<T extends number> = T | readonly [min: T, max: T] | { readonly min: T; readonly max: T }`
  - `ColorInput` = `HexColor` (`` `#${string}` ``) | `RgbColor` | `HslColor` | `CssColorName` (literal union)
  - `ColorSource` = `ColorInput | readonly ColorInput[] | WeightedColor[] | ColorGradient`
  - `Easing` = named easing literal union | `(t: number) => number`
  - `CornerRadius` = `number | { tl, tr, br, bl }` (partial allowed)
  - Units via **type aliases** that document intent: `Pixels`, `Degrees`, `Milliseconds`, `Ratio` (0–1), `Multiplier`.
- **Discriminated unions** on `type` for shapes; exhaustive `switch` with a `never` check.
- **`ShapeRegistry` / `PhysicsRegistry`** interfaces are the single source of truth for shape/physics option types and are open to declaration merging.
- Prefer `satisfies` for config tables (`DEFAULT_PAPER_STYLE satisfies ResolvedPaperStyle`) so defaults are checked against the type without widening.
- Type-level tests with `expectTypeOf` (Vitest) for public API types — wrong options must fail to compile.

---

## 6. TSDoc — Rules

Base style: the `tsdoc` skill (always multiline, PascalCase imperative/noun-phrase first line).
**Extension for the public API** — the skill's "max 2 lines" rule applies to _internal_ code only. Every **public option field** must let a user understand the setting without reading source:

1. First line: short noun phrase (skill style).
2. One or two sentences on **what it changes visually / behaviourally**.
3. **Unit and valid range** (`Pixels`, `0–1`, degrees, ms…) and what out-of-range values do (clamped? error?).
4. `@defaultValue` — always, matching the value in `config/`.
5. `@example` — for anything non-trivial (ranges, colours, callbacks, shapes).
6. `@remarks` for performance cost or interaction with other options; `@see` to related options.

````ts
export type PaperStyle = {
  /**
   * Corner Radius.
   * Rounds the corners of the paper rectangle. A single number rounds all corners;
   * an object sets each corner separately. Clamped to half of the shorter side.
   *
   * @defaultValue `0` (sharp corners)
   * @example
   * ```ts
   * fire({ paper: { cornerRadius: 3 } });
   * fire({ paper: { cornerRadius: { tl: 6, br: 6 } } }); // leaf-like
   * ```
   * @remarks Unit: pixels (CSS px, before DPR scaling).
   */
  readonly cornerRadius?: Range<Pixels> | CornerRadius;
};
````

Internal classes, fields and helpers follow the `tsdoc` skill exactly (short, 1–2 lines).

---

## 7. Definition of Done (per feature)

- [ ] Public types exported and documented per §6 (description, unit/range, `@defaultValue`, `@example`)
- [ ] Type-level tests (`expectTypeOf`) for new public options
- [ ] Defaults in `config/`, no inline tuning numbers
- [ ] Unit tests for math/physics/option-normalisation; `pnpm test` output shown
- [ ] `pnpm typecheck` + `pnpm lint` clean (output shown)
- [ ] Bundle-size impact measured (`pnpm build && pnpm size`) and noted
- [ ] Playground example added (developer verifies visually)
