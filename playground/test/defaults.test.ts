import type { FireInput } from "konfeti";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildInput } from "../src/buildOptions";
import { CONTROL_SECTIONS } from "../src/controls";
import type { Control, ControlValue } from "../src/controlTypes";
import { initialBurst } from "../src/editor/burstState";
import { inDomain, isNumberPair } from "../src/editor/optionValues";
import { createComparer, resolveBursts } from "./helpers/comparable";
import { createFakeAssets } from "./helpers/fakeAssets";

/**
 * Demo Asset Stand-Ins Shared by Every Case.
 */
const assets = createFakeAssets();

/**
 * Every Static Control, Card Controls Included.
 */
const CONTROLS: readonly Control[] = CONTROL_SECTIONS.flatMap((section) => [
  ...section.controls,
  ...(section.cards ?? []).flatMap((card) => card.controls),
]);

/**
 * One Switch-at-a-Time Case: [label, changed values, exact minimal build].
 */
type SwitchCase = readonly [string, Readonly<Record<string, ControlValue>>, FireInput];

/**
 * The Initial State with One Default-Off Toggle, Mode or Card Changed, and What It Must Build.
 * Pins every sub-control initial to its library default: those controls are inactive in the initial state.
 */
const SWITCH_CASES: readonly SwitchCase[] = [
  ["shadow", { shadow: true }, { paper: { shadow: {} } }],
  ["trail", { trail: true }, { paper: { trail: true } }],
  [
    "trail + custom color",
    { trail: true, trailCustomColor: true },
    { paper: { trail: { color: "#ffd000" } } },
  ],
  ["swirl", { swirl: true }, { physics: { swirl: true } }],
  ["floor", { floor: true }, { physics: { floor: true } }],
  ["attract", { attract: true }, { physics: { attract: true } }],
  [
    "attract + point target",
    { attract: true, attractTarget: "point" },
    { physics: { attract: { target: { x: 0.5, y: 0.5 } } } },
  ],
  ["stroke", { stroke: true }, { paper: { stroke: { color: "#1c1c22" } } }],
  ["gradient", { gradient: true }, { paper: { gradient: { colors: ["#ff5e7e", "#26ccff"] } } }],
  ["color over life", { colorOverLife: true }, { paper: { colorOverLife: { to: "#ffffff" } } }],
  ["scale over life", { scaleOverLife: true }, { paper: { scaleOverLife: { to: 0 } } }],
  ["terminal velocity", { useTerminal: true }, { physics: { terminalVelocity: 600 } }],
  ["aspect ratio", { useAspect: true }, { paper: { aspectRatio: 1.6 } }],
  ["per-corner radius", { cornerPerCorner: true }, {}],
  ["seed", { useSeed: true }, { seed: 42 }],
  ["stream emission", { emissionMode: "stream" }, { emission: { mode: "stream", duration: 2000 } }],
  [
    "interval emission",
    { emissionMode: "interval" },
    { emission: { mode: "interval", every: 400, times: 5 } },
  ],
  ["formation", { formation: true }, { formation: { text: "TEBRİKLER" } }],
  [
    "formation + particle cap",
    { formation: true, useFormationCap: true },
    { particleCount: 60, formation: { text: "TEBRİKLER" } },
  ],
  [
    "image formation",
    { formation: true, formationSource: "image" },
    { formation: { image: assets.logoCanvas } },
  ],
  [
    "image formation + fixed width",
    { formation: true, formationSource: "image", useFormationWidth: true },
    { formation: { image: assets.logoCanvas, width: 420 } },
  ],
  ["fade out off", { fadeOut: false }, { paper: { fadeOut: false } }],
  ["flip off", { flip: false }, { paper: { flip: false } }],
  ["wobble off", { wobble: false }, { paper: { wobble: false } }],
  ["paper card", { "paper.enabled": true }, { shapes: [{ type: "paper" }] }],
  ["star card", { "star.enabled": true }, { shapes: [{ type: "star" }] }],
  ["triangle card", { "triangle.enabled": true }, { shapes: [{ type: "triangle" }] }],
  ["polygon card", { "polygon.enabled": true }, { shapes: [{ type: "polygon" }] }],
  ["heart card", { "heart.enabled": true }, { shapes: [{ type: "heart" }] }],
  ["ribbon card", { "ribbon.enabled": true }, { shapes: [{ type: "ribbon" }] }],
  [
    "path card",
    { "path.enabled": true },
    { shapes: [{ type: "path", path: "M13 2 3 14h9l-1 8 10-12h-9l1-8z" }] },
  ],
  [
    "emoji card",
    { "emoji.enabled": true },
    { shapes: [{ type: "emoji", emoji: ["🎉", "✨", "🥳", "🎊"] }] },
  ],
  [
    "text card",
    { "text.enabled": true },
    { shapes: [{ type: "text", text: ["YAY", "WOW", "+1"] }] },
  ],
  [
    "image card",
    { "image.enabled": true },
    { shapes: [{ type: "image", src: assets.coinCanvas }] },
  ],
  [
    "sprite card",
    { "sprite.enabled": true },
    { shapes: [{ type: "spritesheet", src: assets.sheetCanvas, frames: { cols: 8, rows: 1 } }] },
  ],
];

beforeEach(() => {
  // the seed of a burst without one comes from Math.random
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a fresh editor", () => {
  it("(a) builds {} in minimal mode", () => {
    expect(buildInput([initialBurst()], assets)).toStrictEqual({});
  });

  it.each(["minimal", "explicit"] as const)(
    "(b, c) resolves like Konfeti.fire({}) in %s mode",
    (mode) => {
      const compare = createComparer();
      const built = buildInput([initialBurst()], assets, { mode });

      expect(resolveBursts(built, compare)).toEqual(resolveBursts({}, compare));
    },
  );

  it("(d) writes the particle count and the 7-color palette in explicit mode", () => {
    const built = buildInput([initialBurst()], assets, { mode: "explicit" });

    expect(built).toMatchObject({ particleCount: 60 });
    expect(built).toHaveProperty("paper.colors");
    expect((built as { paper: { colors: readonly string[] } }).paper.colors).toHaveLength(7);
  });

  it("(e) starts every span at a sorted pair and every slider at a finite number", () => {
    for (const control of CONTROLS) {
      if (control.kind === "span") {
        expect(isNumberPair(control.initial), control.key).toBe(true);
        expect(control.initial[0], control.key).toBeLessThanOrEqual(control.initial[1]);
      }

      if (control.kind === "range") {
        expect(Number.isFinite(control.initial), control.key).toBe(true);
      }
    }
  });
});

describe("(f) one switch at a time", () => {
  it.each(SWITCH_CASES)("%s builds exactly its library default", (_label, changes, expected) => {
    expect(buildInput([{ ...initialBurst(), ...changes }], assets)).toStrictEqual(expected);
  });

  it.each(SWITCH_CASES)("%s resolves equal in both modes", (_label, changes) => {
    const compare = createComparer();
    const state = { ...initialBurst(), ...changes };

    expect(resolveBursts(buildInput([state], assets, { mode: "explicit" }), compare)).toEqual(
      resolveBursts(buildInput([state], assets), compare),
    );
  });
});

describe("(g) value domains", () => {
  it("hold the slider bounds and the initial of every control that has one", () => {
    const withDomain = CONTROLS.filter(
      (control) =>
        (control.kind === "range" || control.kind === "span") && control.domain !== undefined,
    );

    expect(withDomain.length).toBeGreaterThan(0);

    for (const control of withDomain) {
      if (control.kind !== "range" && control.kind !== "span") {
        continue;
      }

      expect(inDomain(control.domain, control.min), `${control.key} min`).toBe(true);
      expect(inDomain(control.domain, control.max), `${control.key} max`).toBe(true);
      expect(inDomain(control.domain, control.initial), `${control.key} initial`).toBe(true);
    }
  });
});
