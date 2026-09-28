import { describe, expectTypeOf, it } from "vitest";

import "../helpers/augment";
import type { FireOptions, PhysicsOptions, ShapeOptions, ShapeType } from "../../src/index";
import { definePhysics, defineShape } from "../../src/index";

describe("registry augmentation", () => {
  it("adds typed custom shape entries", () => {
    expectTypeOf<"diamond" | "ring">().toExtend<ShapeType>();
    expectTypeOf<{ type: "diamond"; sharpness: 0.5; colors: "red" }>().toExtend<ShapeOptions>();
    expectTypeOf<{ type: "diamond"; sharpness: "sharp" }>().not.toExtend<ShapeOptions>();
    expectTypeOf<{ type: "hexagram" }>().not.toExtend<ShapeOptions>();
  });

  it("adds typed custom physics keys", () => {
    expectTypeOf<{ magnet: { strength: 5 } }>().toExtend<PhysicsOptions>();
    expectTypeOf<{ magnet: true }>().toExtend<PhysicsOptions>();
    expectTypeOf<{ magnet: { strength: "5" } }>().not.toExtend<PhysicsOptions>();
    expectTypeOf<{ physics: { magnet: false } }>().toExtend<FireOptions>();
  });

  it("types define* arguments from the registry", () => {
    expectTypeOf(defineShape).parameter(0).toEqualTypeOf<"diamond" | "ring">();
    expectTypeOf(definePhysics).parameter(0).toEqualTypeOf<"magnet">();
  });
});
