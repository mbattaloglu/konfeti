import { afterEach, describe, expect, it, vi } from "vitest";

import type { Burst } from "../../src/core/Burst";
import type { RenderSurface } from "../../src/core/RenderSurface";
import { Particle } from "../../src/particles/Particle";
import { Canvas2DRenderer } from "../../src/renderers/Canvas2DRenderer";
import { TrailPainter } from "../../src/renderers/TrailPainter";

/**
 * What One Render Did.
 */
type RenderLog = {
  /**
   * `detail` Argument the Shape Was Drawn With.
   */
  readonly detail: unknown;
  /**
   * Trail Painter Called Flag.
   */
  readonly hasTrail: boolean;
  /**
   * Shadow Colors Set on the Context, in Order.
   */
  readonly shadows: readonly string[];
  /**
   * Shadow Color the Context Held While the Trail Was Drawn.
   */
  readonly trailShadow: string | undefined;
  /**
   * Shadow Color the Context Held While the Shape Was Drawn.
   */
  readonly shapeShadow: string | undefined;
};

/**
 * Render One Particle that Has a Shadow and a Trail.
 *
 * @param effects - Effects Flag
 * @returns What the Render Did
 */
function renderOne(effects: boolean): RenderLog {
  const context = document.createElement("canvas").getContext("2d")!;
  const shadows: string[] = [];
  vi.spyOn(context, "shadowColor", "set").mockImplementation((value: string) => {
    shadows.push(value);
  });
  const surface = {
    getContext: () => context,
    getPixelRatio: () => 1,
    getBackingWidth: () => 100,
    getBackingHeight: () => 100,
  } as unknown as RenderSurface;
  let shapeShadow: string | undefined;
  let trailShadow: string | undefined;
  const draw = vi.fn<(...args: unknown[]) => void>(() => {
    shapeShadow = shadows.at(-1);
  });
  const particle = new Particle();
  particle.shadowColor = "rgba(0,0,0,0.5)";
  particle.shadowBlur = 4;
  particle.trailCount = 4;
  particle.shape = { draw, createGradient: () => null };
  const trail = vi.spyOn(TrailPainter, "draw").mockImplementation(() => {
    trailShadow = shadows.at(-1);
  });
  const renderer = new Canvas2DRenderer();

  renderer.setEffects(effects);
  renderer.render(surface, [{ getParticles: () => [particle] } as unknown as Burst]);
  return {
    detail: draw.mock.calls[0]?.[3],
    hasTrail: trail.mock.calls.length > 0,
    shadows,
    trailShadow,
    shapeShadow,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Canvas2DRenderer effects", () => {
  it("draws shadows, trails and shine by default", () => {
    const log = renderOne(true);

    expect(log.shadows).toContain("rgba(0,0,0,0.5)");
    expect(log.hasTrail).toBe(true);
    expect(log.detail).toBe(true);
  });

  it("draws trails without the shadow, then the particle with it", () => {
    const log = renderOne(true);

    expect(log.trailShadow).toBe("transparent");
    expect(log.shapeShadow).toBe("rgba(0,0,0,0.5)");
  });

  it("skips them at reduced quality", () => {
    const log = renderOne(false);

    expect(log.shadows).not.toContain("rgba(0,0,0,0.5)");
    expect(log.hasTrail).toBe(false);
    expect(log.detail).toBe(false);
  });
});
