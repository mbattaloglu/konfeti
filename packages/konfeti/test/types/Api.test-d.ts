import { describe, expectTypeOf, it } from "vitest";

import type {
  FireInput,
  FireOptions,
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
