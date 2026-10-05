import { describe, expectTypeOf, it } from "vitest";

import type {
  CreateOptions,
  EmitOptions,
  FireInput,
  FireOptions,
  KonfetiEmitter,
  KonfetiHandle,
  KonfetiPaletteName,
  KonfetiInstance,
  KonfetiPresetName,
  SharedKonfeti,
  SpriteAtlas,
} from "../../src/index";
import type { KonfetiFactory } from "../../src/index";
import { Konfeti, KonfetiPresets, extendPreset, framesFromAtlas } from "../../src/index";
import type { KonfetiPalettes } from "../../src/index";

describe("public API shape", () => {
  it("types the shared Konfeti object", () => {
    expectTypeOf(Konfeti).toEqualTypeOf<SharedKonfeti>();
    expectTypeOf(Konfeti.fire).parameter(0).toEqualTypeOf<FireInput | undefined>();
    expectTypeOf(Konfeti.fire).returns.toEqualTypeOf<KonfetiHandle>();
    expectTypeOf(Konfeti.onClick).returns.toEqualTypeOf<() => void>();
    // instance-only methods are not on the shared object
    expectTypeOf(Konfeti).not.toHaveProperty("destroy");
  });

  it("creates instances through the factory", () => {
    expectTypeOf<ReturnType<typeof KonfetiFactory.create>>().toEqualTypeOf<KonfetiInstance>();
    expectTypeOf<KonfetiInstance>().toHaveProperty("destroy");
    expectTypeOf<KonfetiInstance>().toHaveProperty("onClick");
  });
});

describe("KonfetiPresets", () => {
  it("members are fire inputs and names are the enum-style keys", () => {
    expectTypeOf(KonfetiPresets.SNOW).toExtend<FireInput>();
    expectTypeOf(KonfetiPresets.SIDE_SHOTS).toExtend<FireInput>();
    expectTypeOf<KonfetiPresetName>().toExtend<string>();
    expectTypeOf<"SNOW">().toExtend<KonfetiPresetName>();
    expectTypeOf<"snow">().not.toExtend<KonfetiPresetName>();
  });

  it("extendPreset takes a preset plus overrides and returns a fire input", () => {
    expectTypeOf(extendPreset).parameters.toEqualTypeOf<[FireInput, FireOptions]>();
    expectTypeOf(extendPreset).returns.toEqualTypeOf<FireInput>();
  });
});

describe("continuous emitter", () => {
  it("emit takes EmitOptions and returns a KonfetiEmitter", () => {
    expectTypeOf(Konfeti.emit).parameter(0).toEqualTypeOf<EmitOptions>();
    expectTypeOf(Konfeti.emit).returns.toEqualTypeOf<KonfetiEmitter>();
  });

  it("follows an element, the pointer or a point — and requires a rate", () => {
    expectTypeOf<{ rate: 30; follow: "pointer" }>().toExtend<EmitOptions>();
    expectTypeOf<{ rate: 30; follow: HTMLButtonElement }>().toExtend<EmitOptions>();
    expectTypeOf<{ rate: 30; follow: { x: [0, 1]; y: 0 } }>().toExtend<EmitOptions>();
    expectTypeOf<{ rate: 30; follow: "mouse" }>().not.toExtend<EmitOptions>();
    expectTypeOf<{ follow: "pointer" }>().not.toExtend<EmitOptions>();
    // a stream has no particleCount / origin / emission (rate and follow replace them)
    expectTypeOf<EmitOptions>().not.toHaveProperty("particleCount");
    expectTypeOf<EmitOptions>().not.toHaveProperty("origin");
    expectTypeOf<EmitOptions>().not.toHaveProperty("emission");
  });
});

describe("physics.attract", () => {
  it("takes a target, a (negative) strength range, radius and falloff", () => {
    expectTypeOf<{
      physics: {
        attract: { target: "pointer"; strength: [-500, 500]; radius: 200; falloff: "linear" };
      };
    }>().toExtend<FireOptions>();
    expectTypeOf<{ physics: { attract: true } }>().toExtend<FireOptions>();
    expectTypeOf<{
      physics: { attract: { falloff: "exponential" } };
    }>().not.toExtend<FireOptions>();
    expectTypeOf<{ physics: { attract: { target: "mouse" } } }>().not.toExtend<FireOptions>();
  });
});

describe("trail", () => {
  it("is a style option on paper and on every shape", () => {
    expectTypeOf<{ paper: { trail: true } }>().toExtend<FireOptions>();
    expectTypeOf<{
      shapes: [{ type: "star"; trail: { length: 16; width: [2, 4]; opacity: 0.8; color: "gold" } }];
    }>().toExtend<FireOptions>();
    expectTypeOf<{ paper: { trail: { color: "particle" } } }>().toExtend<FireOptions>();
    expectTypeOf<{ paper: { trail: { length: "long" } } }>().not.toExtend<FireOptions>();
  });
});

describe("KonfetiPalettes", () => {
  it("members are color lists that fit every colors option", () => {
    expectTypeOf<{ paper: { colors: typeof KonfetiPalettes.PASTEL } }>().toExtend<FireOptions>();
    expectTypeOf<{
      shapes: [{ type: "star"; colors: typeof KonfetiPalettes.NEON }];
    }>().toExtend<FireOptions>();
    expectTypeOf<"GOLD">().toExtend<KonfetiPaletteName>();
    expectTypeOf<"gold">().not.toExtend<KonfetiPaletteName>();
  });
});

describe("formation", () => {
  it("takes text or an image, and each only with its own settings", () => {
    expectTypeOf<{ formation: { text: "HI"; font: "900 80px Inter" } }>().toExtend<FireOptions>();
    expectTypeOf<{
      formation: { image: "/logo.png"; width: 240; imageColors: false; mode: "appear" };
    }>().toExtend<FireOptions>();
    expectTypeOf<{
      formation: { text: "GO"; assemble: 600; hold: 800; easing: "easeOutQuad"; spacing: 6 };
    }>().toExtend<FireOptions>();
    // neither, both, or the other source's settings
    expectTypeOf<{ formation: { mode: "appear" } }>().not.toExtend<FireOptions>();
    expectTypeOf<{ formation: { text: "HI"; image: "/a.png" } }>().not.toExtend<FireOptions>();
    expectTypeOf<{ formation: { text: "HI"; width: 100 } }>().not.toExtend<FireOptions>();
    expectTypeOf<{
      formation: { image: "/a.png"; font: "bold 9px x" };
    }>().not.toExtend<FireOptions>();
    expectTypeOf<{ formation: { text: "HI"; mode: "spin" } }>().not.toExtend<FireOptions>();
  });

  it("is not an emitter option", () => {
    expectTypeOf<EmitOptions>().not.toHaveProperty("formation");
  });
});

describe("replays", () => {
  it("handles report their seed and instances take fixedTimestep", () => {
    expectTypeOf<KonfetiHandle["getSeed"]>().returns.toEqualTypeOf<number>();
    expectTypeOf<{ fixedTimestep: true }>().toExtend<CreateOptions>();
    expectTypeOf<{ fixedTimestep: "yes" }>().not.toExtend<CreateOptions>();
  });
});

describe("adaptive quality", () => {
  it("is an instance option with a readable level", () => {
    expectTypeOf<{ adaptiveQuality: true }>().toExtend<CreateOptions>();
    expectTypeOf<KonfetiInstance["getQualityLevel"]>().returns.toEqualTypeOf<number>();
    expectTypeOf(Konfeti).not.toHaveProperty("getQualityLevel");
  });
});

describe("delay", () => {
  it("is a burst option in milliseconds", () => {
    expectTypeOf<{ delay: 250 }>().toExtend<FireOptions>();
    expectTypeOf<{ delay: "soon" }>().not.toExtend<FireOptions>();
  });

  it("reads atlas JSON into spritesheet frames", () => {
    expectTypeOf(framesFromAtlas).parameter(0).toEqualTypeOf<SpriteAtlas>();
    expectTypeOf<ReturnType<typeof framesFromAtlas>>().toExtend<
      Extract<NonNullable<FireOptions["shapes"]>[number], { type: "spritesheet" }>["frames"]
    >();
  });
});
