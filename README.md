# konfeti

Zero-dependency, strictly typed, highly customizable canvas confetti — with first-class emoji, text, image and
spritesheet particles, composable physics and a typed plugin API.

**[Playground](https://konfeti.mbattaloglu.com/)** · **[Docs](https://konfeti.mbattaloglu.com/docs/)** ·
**[API reference](https://konfeti.mbattaloglu.com/docs/api/)**

```sh
npm install konfeti
```

```ts
import { Konfeti, KonfetiFactory, KonfetiPresets } from "konfeti";

Konfeti.fire(); // shared fullscreen canvas
Konfeti.fire(KonfetiPresets.FIREWORKS);

const stage = KonfetiFactory.create(canvas, { maxParticles: 800 }); // your own canvas
stage.fire({ paper: { form: ["rect", "circle"], colors: ["#d6ff3f", "#ffffff"] } });
```

The full guide lives in [`packages/konfeti/README.md`](packages/konfeti/README.md) (also rendered as the docs
site).

## Workspace

| Path               | What                                                         |
| ------------------ | ------------------------------------------------------------ |
| `packages/konfeti` | The library (published to npm as `konfeti`)                  |
| `playground/`      | Site: playground (`/`), guide (`/docs/`), API (`/docs/api/`) |
| `docs/PLAN.md`     | Roadmap and design notes                                     |
| `vercel.json`      | Vercel static-site config (konfeti.mbattaloglu.com)          |

## Scripts

```sh
pnpm install
pnpm dev          # site dev server on http://localhost:5199 (generates the API reference first)
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit in every package
pnpm lint         # eslint
pnpm build        # library → ESM + CJS + IIFE + .d.ts
pnpm size         # size-limit budgets
pnpm site:build   # static site → playground/dist
```

## License

[MIT](LICENSE)
