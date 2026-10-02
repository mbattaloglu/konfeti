import type { FireOptions } from "konfeti";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OptionResolver } from "../../packages/konfeti/src/core/resolve/OptionResolver";
import { buildBurst, buildInput } from "../src/buildOptions";
import type { BuildMode } from "../src/buildOptions";
import type { ControlState, ControlValue } from "../src/controlTypes";
import { initialBurst } from "../src/editor/burstState";
import { createComparer, resolveBursts } from "./helpers/comparable";
import { createFakeAssets } from "./helpers/fakeAssets";

/**
 * Demo Asset Stand-Ins Shared by Every Case.
 */
const assets = createFakeAssets();

/**
 * Both Builder Modes.
 */
const MODES: readonly BuildMode[] = ["minimal", "explicit"];

/**
 * Cards Whose Handlers Have Their Own Style Defaults.
 */
const HANDLER_CARDS = {
  "emoji.enabled": true,
  "text.enabled": true,
  "image.enabled": true,
  "sprite.enabled": true,
  "ribbon.enabled": true,
} as const;

/**
 * Initial Path Data of the SVG Path Card.
 */
const PATH_D = "M13 2 3 14h9l-1 8 10-12h-9l1-8z";

/**
 * The Demo Sprite Sheet as Every Sprite Entry Sends It.
 */
const SHEET = { src: assets.sheetCanvas, frames: { cols: 8, rows: 1 } } as const;

/**
 * Builder Keys No Other Case Moves Off Its Default: [label, changed values, exact minimal build].
 * The expectations are typed `FireOptions`, so a misspelled key or a wrong value form cannot hide in them.
 */
const OTHER_KEYS: readonly (readonly [
  string,
  Readonly<Record<string, ControlValue>>,
  FireOptions,
])[] = [
  [
    "star inner ratio",
    { "star.enabled": true, "star.innerRatio": 0.3 },
    { shapes: [{ type: "star", innerRatio: 0.3 }] },
  ],
  [
    "star points",
    { "star.enabled": true, "star.points": [6, 8] },
    { shapes: [{ type: "star", points: [6, 8] }] },
  ],
  [
    "ribbon length",
    { "ribbon.enabled": true, "ribbon.length": [20, 40] },
    { shapes: [{ type: "ribbon", length: [20, 40] }] },
  ],
  [
    "ribbon thickness",
    { "ribbon.enabled": true, "ribbon.thickness": 0.3 },
    { shapes: [{ type: "ribbon", thickness: 0.3 }] },
  ],
  [
    "ribbon waves",
    { "ribbon.enabled": true, "ribbon.waves": 4 },
    { shapes: [{ type: "ribbon", waves: 4 }] },
  ],
  [
    "path view box",
    { "path.enabled": true, "path.viewBox": 32, "path.viewBoxHeight": 16 },
    { shapes: [{ type: "path", path: PATH_D, viewBox: [32, 16] }] },
  ],
  [
    "sprite frame rate",
    { "sprite.enabled": true, "sprite.fps": [6, 24] },
    { shapes: [{ type: "spritesheet", ...SHEET, fps: [6, 24] }] },
  ],
  [
    "sprite loop",
    { "sprite.enabled": true, "sprite.loop": false },
    { shapes: [{ type: "spritesheet", ...SHEET, loop: false }] },
  ],
  [
    "sprite start frame",
    { "sprite.enabled": true, "sprite.randomStart": false },
    { shapes: [{ type: "spritesheet", ...SHEET, randomStartFrame: false }] },
  ],
  [
    "emoji font family",
    { "emoji.enabled": true, "emoji.fontFamily": "serif" },
    { shapes: [{ type: "emoji", emoji: ["🎉", "✨", "🥳", "🎊"], fontFamily: "serif" }] },
  ],
  [
    "text font family",
    { "text.enabled": true, "text.fontFamily": "serif" },
    { shapes: [{ type: "text", text: ["YAY", "WOW", "+1"], fontFamily: "serif" }] },
  ],
  ["floor height", { floor: true, floorY: 0.8 }, { physics: { floor: { y: 0.8 } } }],
  ["floor bounce", { floor: true, floorBounce: 0.6 }, { physics: { floor: { bounce: 0.6 } } }],
  [
    "floor friction",
    { floor: true, floorFriction: 0.1 },
    { physics: { floor: { friction: 0.1 } } },
  ],
  [
    "swirl strength",
    { swirl: true, swirlStrength: [100, 300] },
    { physics: { swirl: { strength: [100, 300] } } },
  ],
  [
    "swirl frequency",
    { swirl: true, swirlFrequency: [1, 1] },
    { physics: { swirl: { frequency: 1 } } },
  ],
  [
    "formation hold",
    { formation: true, formationHold: 500 },
    { formation: { text: "TEBRİKLER", hold: 500 } },
  ],
  [
    "formation spacing",
    { formation: true, formationSpacing: 12 },
    { formation: { text: "TEBRİKLER", spacing: 12 } },
  ],
  [
    "formation fit",
    { formation: true, formationFit: 0.5 },
    { formation: { text: "TEBRİKLER", fit: 0.5 } },
  ],
  [
    "formation fly-in",
    { formation: true, formationAssemble: 400 },
    { formation: { text: "TEBRİKLER", assemble: 400 } },
  ],
  [
    "formation image colors",
    { formation: true, formationSource: "image", formationImageColors: false },
    { formation: { image: assets.logoCanvas, imageColors: false } },
  ],
];

/**
 * Build the Initial State with Some Values Changed.
 *
 * @param changes - Changed Values
 * @param mode - Builder Mode
 * @returns Fire Options
 */
function build(
  changes: Readonly<Record<string, ControlValue>>,
  mode: BuildMode = "minimal",
): FireOptions {
  return buildBurst({ ...initialBurst(), ...changes }, assets, { mode });
}

beforeEach(() => {
  // the seed of a burst without one comes from Math.random
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("minimal forms", () => {
  it("turns effects on with the shortest value", () => {
    expect(build({ trail: true }).paper).toStrictEqual({ trail: true });
    expect(build({ shadow: true }).paper).toStrictEqual({ shadow: {} });
    expect(build({ flipFrequency: [0.8, 1.6] }).paper).toStrictEqual({
      flip: { frequency: [0.8, 1.6] },
    });
  });

  it("leaves out sub-keys at the values the resolver falls back to", () => {
    expect(build({ stroke: true, strokeWidth: [1, 1] }).paper).toStrictEqual({
      stroke: { color: "#1c1c22" },
    });
    expect(build({ stroke: true, strokeWidth: [2, 3] }).paper).toStrictEqual({
      stroke: { color: "#1c1c22", width: [2, 3] },
    });
    expect(build({ gradient: true, gradientAngle: 90 }).paper).toStrictEqual({
      gradient: { colors: ["#ff5e7e", "#26ccff"] },
    });
    expect(build({ gradient: true, gradientAngle: 45 }).paper).toStrictEqual({
      gradient: { colors: ["#ff5e7e", "#26ccff"], angle: 45 },
    });
  });

  it("sends no attract radius for 0 (no limit)", () => {
    expect(
      build({ attract: true, attractStrength: [500, 500], attractRadius: 0 }).physics,
    ).toStrictEqual({
      attract: { strength: 500 },
    });
    expect(build({ attract: true, attractRadius: 300 }).physics).toStrictEqual({
      attract: { radius: 300 },
    });
  });

  it("sends only the origin axes that differ, and a span as a number when min === max", () => {
    expect(build({ originY: [0.7, 0.7] }).origin).toStrictEqual({ y: 0.7 });
    expect(build({ originX: [0, 1] }).origin).toStrictEqual({ x: [0, 1] });
    expect(build({ angle: [45, 45] }).angle).toBe(45);
    expect(build({ originY: [0.7, 0.7] }, "explicit").origin).toStrictEqual({ x: 0.5, y: 0.7 });
  });

  it("sends only the non-zero corners of a per-corner radius", () => {
    expect(
      build({ cornerPerCorner: true, cornerTL: [2, 2], cornerBR: [1, 4] }).paper,
    ).toStrictEqual({
      cornerRadius: { tl: 2, br: [1, 4] },
    });
    expect(build({ cornerRadius: [3, 3] }).paper).toStrictEqual({ cornerRadius: 3 });
  });

  it("keeps the selection order of several paper forms", () => {
    expect(build({ form: ["leaf", "circle"] }).paper).toStrictEqual({ form: ["leaf", "circle"] });
    expect(build({ form: ["circle"] }).paper).toStrictEqual({ form: "circle" });
    expect(build({ form: [] }).paper).toBeUndefined();
  });
});

describe("every other key", () => {
  it.each(OTHER_KEYS)("writes the %s in its option form", (_label, changes, expected) => {
    expect(build(changes)).toStrictEqual(expected);
  });
});

describe("formations", () => {
  it("send no particle count and no emission", () => {
    const options = build({ formation: true, particleCount: 77, emissionMode: "stream" });

    expect(options).not.toHaveProperty("particleCount");
    expect(options).not.toHaveProperty("emission");
  });

  it.each(MODES)("send a capped particle count, 60 included, in %s mode", (mode) => {
    expect(
      build({ formation: true, useFormationCap: true, particleCount: 60 }, mode).particleCount,
    ).toBe(60);
  });

  it("send the easing in appear mode, but no fly-in time", () => {
    const options = build({ formation: true, formationMode: "appear", formationEasing: "linear" });

    expect(options.formation).toStrictEqual({
      text: "TEBRİKLER",
      mode: "appear",
      easing: "linear",
    });
  });

  it("use the release speed instead of the start velocity", () => {
    expect(
      build({ formation: true, formationVelocity: [100, 200], velocity: [5, 5] }).startVelocity,
    ).toEqual([100, 200]);
  });
});

describe("strings are sent exactly as typed", () => {
  it("never trims the formation font and text", () => {
    expect(
      build({ formation: true, formationFont: " 900 96px sans-serif" }).formation,
    ).toStrictEqual({
      text: "TEBRİKLER",
      font: " 900 96px sans-serif",
    });
    expect(build({ formation: true, formationFont: "   " }).formation).toStrictEqual({
      text: "TEBRİKLER",
    });
    expect(build({ formation: true, formationText: " HI " }).formation).toStrictEqual({
      text: " HI ",
    });
    expect(build({ formation: true, formationText: "A\\nB" }).formation).toStrictEqual({
      text: "A\nB",
    });
    expect(build({ formation: true, formationText: "  " }).formation).toStrictEqual({
      text: "KONFETI",
    });
  });

  it("drops a path card with a blank path and an emoji card with no emoji", () => {
    expect(build({ "path.enabled": true, "path.d": "   " })).toStrictEqual({});
    expect(
      build({ "path.enabled": true, "star.enabled": true, "path.d": "" }).shapes,
    ).toStrictEqual([{ type: "star" }]);
    expect(build({ "emoji.enabled": true, "emoji.list": " , " })).toStrictEqual({});
    expect(build({ "emoji.enabled": true, "emoji.list": "🎉" }).shapes).toStrictEqual([
      { type: "emoji", emoji: "🎉" },
    ]);
  });

  it("sends the text font weight as a number or a CSS keyword", () => {
    const weightOf = (fontWeight: string): unknown =>
      (
        build({ "text.enabled": true, "text.fontWeight": fontWeight }).shapes?.[0] as Record<
          string,
          unknown
        >
      )["fontWeight"];

    expect(weightOf("bold")).toBe("bold");
    expect(weightOf("400")).toBe(400);
    expect(weightOf("700")).toBeUndefined();
  });
});

describe("shape cards", () => {
  it("keep their handler style defaults in minimal mode", () => {
    const built = build({ "emoji.enabled": true });
    const [emoji] = OptionResolver.resolveFire([{}, built]).shapes.items;

    expect(emoji?.style.rotation).toEqual([-20, 20]);
    expect(emoji?.style.flip).toBeNull();
  });

  it("write the handler defaults onto their entries in explicit mode", () => {
    const [emoji] = build({ "emoji.enabled": true }, "explicit").shapes ?? [];

    expect(emoji).toMatchObject({ rotation: [-20, 20], rotationSpeed: [-90, 90], flip: false });
  });

  it("resolve equal in minimal and explicit mode", () => {
    const compare = createComparer();
    const state = { ...initialBurst(), ...HANDLER_CARDS, "paper.enabled": true };

    expect(resolveBursts(buildBurst(state, assets, { mode: "explicit" }), compare)).toEqual(
      resolveBursts(buildBurst(state, assets), compare),
    );
  });

  it("resolve equal in both modes when the base paper changes a handler default", () => {
    const compare = createComparer();
    const state: ControlState = {
      ...initialBurst(),
      ...HANDLER_CARDS,
      flipAxis: "both",
      rotation: [-90, 90],
      wobble: false,
    };

    expect(resolveBursts(buildBurst(state, assets, { mode: "explicit" }), compare)).toEqual(
      resolveBursts(buildBurst(state, assets), compare),
    );
  });

  it("send the star and heart palettes only when they hold colors", () => {
    expect(
      build({ "star.enabled": true, "heart.enabled": true, "heart.colors": ["#ff0000"] }).shapes,
    ).toStrictEqual([{ type: "star" }, { type: "heart", colors: ["#ff0000"] }]);
  });

  it("follow the card order with their sources", () => {
    expect(
      build({
        "sprite.enabled": true,
        "image.enabled": true,
        "image.src": "inline svg",
        "sprite.src": "demo url",
      }).shapes,
    ).toMatchObject([
      { type: "image", src: expect.stringMatching(/^<svg/) as unknown },
      { type: "spritesheet", src: "blob:sheet", frames: { cols: 8, rows: 1 } },
    ]);
  });
});

describe("explicit mode", () => {
  it("writes the top-level keys in the documented order", () => {
    const options = build({ useSeed: true, "star.enabled": true }, "explicit");

    expect(Object.keys(options)).toEqual([
      "particleCount",
      "angle",
      "spread",
      "startVelocity",
      "lifetime",
      "origin",
      "emission",
      "delay",
      "seed",
      "paper",
      "shapes",
      "physics",
    ]);
    expect(options.physics).toStrictEqual({
      gravity: 700,
      drag: 3.5,
      wind: 0,
      terminalVelocity: Infinity,
      swirl: false,
      floor: false,
      attract: false,
    });
  });

  it("writes every key of an effect that is on", () => {
    expect(build({ attract: true }, "explicit").physics?.attract).toStrictEqual({
      target: "pointer",
      strength: 900,
      radius: Infinity,
      falloff: "constant",
    });
    expect(build({ trail: true }, "explicit").paper?.trail).toStrictEqual({
      length: 10,
      width: 3,
      opacity: 0.5,
      color: "particle",
    });
  });
});

describe("build switches", () => {
  it("leave out the origin and the formation on request", () => {
    const state = { ...initialBurst(), formation: true, originX: [0, 1] as const };
    const options = buildBurst(state, assets, { includeOrigin: false, includeFormation: false });

    expect(options).not.toHaveProperty("origin");
    expect(options).not.toHaveProperty("formation");
  });

  it("give one burst as options and several as a list", () => {
    const one = buildInput([initialBurst()], assets);
    const two = buildInput([initialBurst(), { ...initialBurst(), particleCount: 33 }], assets);

    expect(one).toStrictEqual({});
    expect(two).toStrictEqual([{}, { particleCount: 33 }]);
  });
});
