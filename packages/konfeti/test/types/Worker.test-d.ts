import { describe, expectTypeOf, it } from "vitest";

import type { ClickOptions, KonfetiInstance } from "../../src/index";
import type {
  createWorker,
  WorkerFireOptions,
  WorkerKonfetiInstance,
  WorkerStats,
} from "../../src/workerEntry";

describe("worker option types", () => {
  it("accepts worker-safe options", () => {
    expectTypeOf<{
      particleCount: 5;
      paper: { fadeOut: { easing: "easeInQuad" } };
    }>().toExtend<WorkerFireOptions>();
    expectTypeOf<{ shapes: [{ type: "path"; path: "M0 0L1 1" }] }>().toExtend<WorkerFireOptions>();
    expectTypeOf<{ shapes: [{ type: "image"; src: "/coin.png" }] }>().toExtend<WorkerFireOptions>();
  });

  it("rejects what cannot cross into a worker", () => {
    expectTypeOf<{ onStart: () => void }>().not.toExtend<WorkerFireOptions>();
    expectTypeOf<{
      paper: { fadeOut: { easing: (t: number) => number } };
    }>().not.toExtend<WorkerFireOptions>();
    expectTypeOf<{
      shapes: [{ type: "image"; src: HTMLImageElement }];
    }>().not.toExtend<WorkerFireOptions>();
    expectTypeOf<{ shapes: [{ type: "path"; path: Path2D }] }>().not.toExtend<WorkerFireOptions>();
  });

  it("creates worker instances from the factory", () => {
    expectTypeOf<ReturnType<typeof createWorker>>().toEqualTypeOf<WorkerKonfetiInstance>();
  });
});

describe("worker stats and click settings", () => {
  it("getStats returns the counter record", () => {
    expectTypeOf<WorkerKonfetiInstance["getStats"]>().returns.toEqualTypeOf<WorkerStats>();
  });

  it("onClick takes trigger / onFire settings on both instance kinds", () => {
    expectTypeOf<WorkerKonfetiInstance["onClick"]>()
      .parameter(2)
      .toEqualTypeOf<ClickOptions | undefined>();
    expectTypeOf<KonfetiInstance["onClick"]>()
      .parameter(2)
      .toEqualTypeOf<ClickOptions | undefined>();
    expectTypeOf<{ trigger: "hover" }>().not.toExtend<ClickOptions>();
  });
});
