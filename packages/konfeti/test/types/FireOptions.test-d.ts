import { describe, expectTypeOf, it } from "vitest";

import type { ColorInput, FireOptions, KonfetiHandle, PaperStyle } from "../../src/index";
import { Konfeti } from "../../src/index";

describe("public types", () => {
  it("accepts every range form", () => {
    expectTypeOf<{ width: 5 }>().toExtend<PaperStyle>();
    expectTypeOf<{ width: readonly [5, 9] }>().toExtend<PaperStyle>();
    expectTypeOf<{ width: { min: 5; max: 9 } }>().toExtend<PaperStyle>();
  });

  it("accepts known color syntaxes", () => {
    expectTypeOf<"#fff">().toExtend<ColorInput>();
    expectTypeOf<"rgb(1 2 3)">().toExtend<ColorInput>();
    expectTypeOf<"hsl(0 100% 50%)">().toExtend<ColorInput>();
    expectTypeOf<"oklch(70% 0.2 30)">().toExtend<ColorInput>();
    expectTypeOf<"hotpink">().toExtend<ColorInput>();
  });

  it("rejects typos and wrong shapes", () => {
    expectTypeOf<"hotpinkk">().not.toExtend<ColorInput>();
    expectTypeOf<{ form: "triangle" }>().not.toExtend<PaperStyle>();
    expectTypeOf<{ width: readonly [1, 2, 3] }>().not.toExtend<PaperStyle>();
    expectTypeOf<{ flip: { axis: "z" } }>().not.toExtend<PaperStyle>();
    expectTypeOf<{ particleCount: "10" }>().not.toExtend<FireOptions>();
  });

  it("returns an awaitable handle", () => {
    expectTypeOf(Konfeti.fire).returns.toEqualTypeOf<KonfetiHandle>();
    expectTypeOf<KonfetiHandle>().toExtend<PromiseLike<void>>();
  });
});
