import { afterEach, describe, expect, it, vi } from "vitest";

import "../helpers/augment";
import { definePhysics, defineShape } from "../../src/index";
import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import { OptionResolver } from "../../src/core/resolve/OptionResolver";
import { PhysicsDefinitions } from "../../src/registry/PhysicsDefinitions";
import { ShapeHandlers } from "../../src/registry/ShapeHandlers";
import { shapeAt } from "../helpers/resolveHelpers";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }

  ShapeHandlers.remove("diamond");
  ShapeHandlers.remove("ring");
  PhysicsDefinitions.remove("magnet");
});

/**
 * Create Test Instance with Manual Scheduler.
 *
 * @returns Instance and Scheduler
 */
function setup(): { konfeti: KonfetiInstance; scheduler: ManualScheduler } {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

describe("defineShape", () => {
  it("turns path definitions into vector shapes built from entry options", () => {
    const path = vi.fn(
      ({ sharpness = 0.5 }: { sharpness?: number }) => `M12 0L${24 - sharpness * 12} 12L12 24Z`,
    );
    defineShape("diamond", { path, viewBox: [24, 24], defaultSize: 20 });

    const shape = shapeAt(
      OptionResolver.resolveFire([{ shapes: [{ type: "diamond", sharpness: 0.8 }] }]),
    );

    expect(shape.kind).toBe("vector");
    expect(shape.kind === "vector" && shape.size).toEqual([20, 20]);
    expect(path).toHaveBeenCalledWith(expect.objectContaining({ sharpness: 0.8 }));
  });

  it("calls draw definitions with a centered particle view", () => {
    const { konfeti, scheduler } = setup();
    const draw = vi.fn();
    defineShape("ring", { draw, aspectRatio: 0.5 });

    const burst = konfeti.fire({
      particleCount: 3,
      shapes: [{ type: "ring", thickness: 4, size: 10, colors: "red" }],
    }) as Burst;
    scheduler.step();

    expect(burst.getParticles().every((particle) => particle.height === particle.width * 0.5)).toBe(
      true,
    );
    expect(draw).toHaveBeenCalledTimes(3);
    const [, view, options] = draw.mock.calls[0] as [
      unknown,
      { width: number; fill: string },
      { thickness: number },
    ];
    expect(view.width).toBe(10);
    expect(options.thickness).toBe(4);
  });

  it("inherits paper style like built-in shapes", () => {
    defineShape("diamond", { path: () => "M0 0L24 24" });
    const shape = shapeAt(
      OptionResolver.resolveFire([{ paper: { colors: "lime" }, shapes: [{ type: "diamond" }] }]),
    );

    expect(shape.style.palette.colors).toEqual(["rgb(0,255,0)"]);
  });

  it("rejects built-in names and unknown types", () => {
    expect(() => {
      ShapeHandlers.registerCustom({
        type: "star",
        resolve: () => {
          throw new Error("unreachable");
        },
      });
    }).toThrow(/built-in/);
    expect(() => OptionResolver.resolveFire([{ shapes: [{ type: "ring" }] }])).toThrow(
      /defineShape/,
    );
  });
});

describe("definePhysics", () => {
  it("is off unless enabled, then merges options over defaults", () => {
    definePhysics("magnet", {
      defaults: { x: 0.5, y: 0.5, strength: 600 },
      apply: () => undefined,
    });

    expect(OptionResolver.resolveFire([{}]).physics.custom).toHaveLength(0);
    expect(
      OptionResolver.resolveFire([{ physics: { magnet: true } }]).physics.custom[0]?.options,
    ).toEqual({
      x: 0.5,
      y: 0.5,
      strength: 600,
    });
    expect(
      OptionResolver.resolveFire([{ physics: { magnet: { strength: 10 } } }]).physics.custom[0]
        ?.options,
    ).toEqual({ x: 0.5, y: 0.5, strength: 10 });
  });

  it("runs every frame for every particle", () => {
    const { konfeti, scheduler } = setup();
    const apply = vi.fn((particle: { vx: number }) => {
      particle.vx = 0;
    });
    definePhysics("magnet", { defaults: { x: 0, y: 0, strength: 1 }, apply });

    const burst = konfeti.fire({
      particleCount: 4,
      angle: 0,
      spread: 0,
      physics: { magnet: true },
    }) as Burst;
    scheduler.step(2);

    expect(apply).toHaveBeenCalledTimes(8);
    expect(burst.getParticles().every((particle) => particle.vx === 0)).toBe(true);
  });

  it("rejects built-in keys", () => {
    expect(() => {
      PhysicsDefinitions.define("gravity", { defaults: {}, apply: () => undefined });
    }).toThrow(/built-in/);
  });
});

describe("lite registration", () => {
  it("explains how to register a built-in that is not registered", async () => {
    const { starShape } = await import("../../src/shapes/handlers/starShape");
    const { registerShapes } = await import("../../src/api/registerShapes");
    ShapeHandlers.remove("star");

    try {
      expect(() => OptionResolver.resolveFire([{ shapes: [{ type: "star" }] }])).toThrow(
        /registerShapes\(starShape\)/,
      );
    } finally {
      registerShapes(starShape);
    }

    expect(() => OptionResolver.resolveFire([{ shapes: [{ type: "star" }] }])).not.toThrow();
  });
});
