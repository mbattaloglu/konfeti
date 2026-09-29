import { describe, expectTypeOf, it } from "vitest";

import type {
  EmitOptions,
  FireInput,
  FireOptions,
  KonfetiEmitter,
  KonfetiHandle,
  KonfetiInstance,
  KonfetiPresetName,
  SharedKonfeti,
} from "../../src/index";
import type { KonfetiFactory } from "../../src/index";
import { Konfeti, KonfetiPresets, extendPreset } from "../../src/index";

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
