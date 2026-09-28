import { describe, expectTypeOf, it } from "vitest";

import type { FireInput, KonfetiHandle, KonfetiInstance, SharedKonfeti } from "../../src/index";
import type { KonfetiFactory } from "../../src/index";
import { Konfeti } from "../../src/index";

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
