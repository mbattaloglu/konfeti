import { describe, expectTypeOf, it } from "vitest";

import type { KonfetiFactory, WorkerFireOptions, WorkerKonfetiInstance } from "../../src/index";

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
    expectTypeOf<
      ReturnType<typeof KonfetiFactory.createWorker>
    >().toEqualTypeOf<WorkerKonfetiInstance>();
  });
});
