import { describe, expect, it } from "vitest";

import { DEFAULT_FIRE_OPTIONS } from "../../src/config/FireDefaults";
import { DEFAULT_PALETTE } from "../../src/config/PaperDefaults";
import { OptionResolver } from "../../src/core/resolve/OptionResolver";
import { paperOf } from "../helpers/resolveHelpers";

describe("OptionResolver.resolveFire", () => {
  it("fills every option from defaults", () => {
    const resolved = OptionResolver.resolveFire([{}]);
    const paper = paperOf(resolved);

    expect(resolved.particleCount).toBe(DEFAULT_FIRE_OPTIONS.particleCount);
    expect(resolved.origin).toEqual({ kind: "point", x: [0.5, 0.5], y: [0.6, 0.6] });
    expect(resolved.emission).toEqual({ mode: "burst" });
    expect(resolved.shapes.items).toHaveLength(1);
    expect(paper.style.palette.colors).toHaveLength(DEFAULT_PALETTE.length);
    expect(paper.style.flip).not.toBeNull();
    expect(paper.style.wobble).not.toBeNull();
    expect(paper.style.stroke).toBeNull();
    expect(paper.style.backPalette).toBeNull();
    expect(paper.style.shadow).toBeNull();
    expect(paper.forms.items).toEqual(["rect"]);
    expect(resolved.physics.floor).toBeNull();
    expect(resolved.physics.swirl).toBeNull();
    expect(Number.isInteger(resolved.seed)).toBe(true);
  });

  it("lets later layers win and merges nested groups key by key", () => {
    const resolved = OptionResolver.resolveFire([
      { particleCount: 10, paper: { colors: "red", width: 4 }, physics: { gravity: 100 } },
      { particleCount: 20, paper: { width: 8 } },
    ]);
    const paper = paperOf(resolved);

    expect(resolved.particleCount).toBe(20);
    expect(paper.width).toEqual([8, 8]);
    expect(paper.style.palette.colors).toEqual(["rgb(255,0,0)"]);
    expect(resolved.physics.gravity).toEqual([100, 100]);
  });

  it("merges boolean-or-object toggles", () => {
    const disabled = paperOf(OptionResolver.resolveFire([{ paper: { flip: false } }]));
    const custom = paperOf(OptionResolver.resolveFire([{ paper: { flip: { axis: "both" } } }]));
    const reenabled = paperOf(
      OptionResolver.resolveFire([
        { paper: { flip: { axis: "y" } } },
        { paper: { flip: false } },
        { paper: { flip: true } },
      ]),
    );

    expect(disabled.style.flip).toBeNull();
    expect(custom.style.flip).toEqual({ axis: "both", frequency: [0.6, 1.8] });
    expect(reenabled.style.flip?.axis).toBe("x");
  });

  it("resolves corner radius forms", () => {
    const all = paperOf(OptionResolver.resolveFire([{ paper: { cornerRadius: [1, 2] } }]));
    const some = paperOf(
      OptionResolver.resolveFire([{ paper: { cornerRadius: { tl: 3, br: 4 } } }]),
    );

    expect(all.cornerRadius).toEqual([
      [1, 2],
      [1, 2],
      [1, 2],
      [1, 2],
    ]);
    expect(some.cornerRadius).toEqual([
      [3, 3],
      [0, 0],
      [4, 4],
      [0, 0],
    ]);
  });

  it("supports several weighted paper forms", () => {
    const paper = paperOf(
      OptionResolver.resolveFire([
        { paper: { form: ["rect", { value: "circle", weight: 3 }, "leaf"] } },
      ]),
    );

    expect(paper.forms.items).toEqual(["rect", "circle", "leaf"]);
    expect(paper.forms.cumulativeWeights).toEqual([1, 4, 5]);
  });

  it("builds weighted palettes and auto back colors", () => {
    const paper = paperOf(
      OptionResolver.resolveFire([
        { paper: { colors: [{ color: "#ffffff", weight: 3 }, "#000000"], backShade: 0.5 } },
      ]),
    );

    expect(paper.style.palette.cumulativeWeights).toEqual([3, 4]);
    expect(paper.style.palette.totalWeight).toBe(4);
    expect(paper.style.palette.shadedColors[0]).toBe("rgb(128,128,128)");
  });

  it("clamps opacity, skew, backShade and shine", () => {
    const paper = paperOf(
      OptionResolver.resolveFire([
        { paper: { opacity: [-1, 2], skew: 500, backShade: 3, shine: 4 } },
      ]),
    );

    expect(paper.style.opacity).toEqual([0, 1]);
    expect(paper.skew).toEqual([60, 60]);
    expect(paper.style.palette.shadedColors[0]).toBe("rgb(0,0,0)");
    expect(paper.style.shine).toBe(1);
  });

  it("resolves M3 visual options", () => {
    const style = paperOf(
      OptionResolver.resolveFire([
        {
          paper: {
            colors: ["#000000"],
            gradient: { colors: ["red", "blue"] },
            colorOverLife: { to: "#ffffff" },
            scaleOverLife: { to: 0 },
            shadow: { blur: 8 },
            tilt: -20,
            fadeIn: 0.2,
          },
        },
      ]),
    ).style;

    expect(style.gradient).toEqual({ colors: ["rgb(255,0,0)", "rgb(0,0,255)"], angle: 90 });
    expect(style.colorOverLife?.tables[0]?.[0]).toBe("rgb(0,0,0)");
    expect(style.colorOverLife?.tables[0]?.[23]).toBe("rgb(255,255,255)");
    expect(style.scaleOverLife?.to).toBe(0);
    expect(style.shadow).toEqual({ color: "rgba(0,0,0,0.25)", blur: 8, offsetX: 0, offsetY: 2 });
    expect(style.tilt).toEqual([20, 20]);
    expect(style.fadeIn).toBe(0.2);
  });

  it("resolves element and client-point origins", () => {
    const element = document.createElement("button");

    expect(OptionResolver.resolveFire([{ origin: element }]).origin).toEqual({
      kind: "element",
      element,
    });
    expect(OptionResolver.resolveFire([{ origin: { clientX: 10, clientY: 20 } }]).origin).toEqual({
      kind: "client",
      clientX: 10,
      clientY: 20,
    });
  });

  it("resolves emission modes and physics toggles", () => {
    const stream = OptionResolver.resolveFire([{ emission: { mode: "stream", duration: 500 } }]);
    const interval = OptionResolver.resolveFire([
      { emission: { mode: "interval", every: 100, times: 3.7 } },
    ]);
    const physics = OptionResolver.resolveFire([
      { physics: { floor: { bounce: 0.8 }, swirl: true, terminalVelocity: 300 } },
    ]).physics;

    expect(stream.emission).toEqual({ mode: "stream", duration: 500 });
    expect(interval.emission).toEqual({ mode: "interval", every: 100, times: 3 });
    expect(physics.floor).toEqual({ y: 1, bounce: 0.8, friction: 0.4 });
    expect(physics.swirl).toEqual({ strength: [80, 200], frequency: [0.3, 0.8] });
    expect(physics.terminalVelocity).toBe(300);
  });

  it("merges hooks with the highest layer winning", () => {
    const low = (): void => undefined;
    const high = (): void => undefined;
    const hooks = OptionResolver.resolveFire([
      { onStart: low, onComplete: low },
      { onStart: high },
    ]).hooks;

    expect(hooks.onStart).toBe(high);
    expect(hooks.onComplete).toBe(low);
  });

  it("rejects invalid input with descriptive errors", () => {
    expect(() => OptionResolver.resolveFire([{ particleCount: Number.NaN }])).toThrow(
      /particleCount/,
    );
    expect(() => OptionResolver.resolveFire([{ paper: { colors: [] } }])).toThrow(
      /at least one color/,
    );
    expect(() =>
      OptionResolver.resolveFire([{ paper: { colors: [{ color: "red", weight: 0 }] } }]),
    ).toThrow(/weight/);
    expect(() => OptionResolver.resolveFire([{ paper: { aspectRatio: 0 } }])).toThrow(
      /aspectRatio/,
    );
    expect(() =>
      OptionResolver.resolveFire([{ emission: { mode: "stream", duration: 0 } }]),
    ).toThrow(/duration/);
    expect(() => OptionResolver.resolveFire([{ physics: { terminalVelocity: -1 } }])).toThrow(
      /terminalVelocity/,
    );
    expect(() => OptionResolver.resolveFire([{ shapes: [] }])).toThrow(/shapes/);
  });
});

describe("OptionResolver.resolveCreate", () => {
  it("applies defaults and sanitizes numbers", () => {
    const resolved = OptionResolver.resolveCreate({ maxParticles: 10.7, maxDevicePixelRatio: 0.5 });

    expect(resolved.maxParticles).toBe(10);
    expect(resolved.maxDevicePixelRatio).toBe(1);
    expect(resolved.resize).toBe(true);
    expect(resolved.frameScheduler).toBeNull();
  });
});
