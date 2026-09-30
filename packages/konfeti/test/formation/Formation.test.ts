import { describe, expect, it } from "vitest";

import type { RenderSurface } from "../../src/core/RenderSurface";
import type { IFormationSource } from "../../src/formation/abstracts/IFormationSource";
import { Formation } from "../../src/formation/concretes/Formation";
import type { FormationMask } from "../../src/formation/types/FormationMask";
import type { FormationSettings } from "../../src/formation/types/FormationSettings";
import { Particle } from "../../src/particles/Particle";
import type { PlacedOrigin } from "../../src/types/resolved/PlacedOrigin";
import type { ResolvedStyle } from "../../src/types/resolved/ResolvedStyle";
import { Random } from "../../src/utils/Random";

/**
 * Canvas Size Used by Every Test.
 */
const CANVAS = { width: 400, height: 300 };

/**
 * Origin at the Canvas Center.
 */
const CENTER: PlacedOrigin = { kind: "point", x: [0.5, 0.5], y: [0.5, 0.5] };

/**
 * Minimal Surface: only the size is read.
 */
const surface = {
  getWidth: () => CANVAS.width,
  getHeight: () => CANVAS.height,
} as unknown as RenderSurface;

/**
 * Style without an Explicit Back Color.
 */
const style = { backPalette: null } as unknown as ResolvedStyle;

/**
 * Build a Source Returning a Solid Mask.
 *
 * @param width - Mask Width
 * @param height - Mask Height
 * @param rgb - Pixel Color
 * @returns Formation Source
 */
function solid(
  width: number,
  height: number,
  rgb: readonly [number, number, number] = [0, 0, 0],
): IFormationSource {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let offset = 0; offset < data.length; offset += 4) {
    data.set([...rgb, 255], offset);
  }

  const mask: FormationMask = { width, height, data, scale: 1 };
  return { isReady: () => true, hasFailed: () => false, getMask: () => mask };
}

/**
 * Build Formation Settings.
 *
 * @param overrides - Settings to Change
 * @returns Settings
 */
function settings(overrides: Partial<FormationSettings> = {}): FormationSettings {
  return {
    mode: "appear",
    assemble: 0,
    hold: 1000,
    easing: (t) => t,
    spacing: 10,
    fit: 0.9,
    imageColors: false,
    limit: Infinity,
    ...overrides,
  };
}

/**
 * Spawn a Particle the Way the Emitter Does (launch speed straight up), then Place It.
 *
 * @param formation - Prepared Formation
 * @param index - Spawn Index
 * @param random - Random Generator
 * @returns Placed Particle
 */
function spawn(formation: Formation, index: number, random: Random): Particle {
  const particle = new Particle();
  particle.vy = -1000;
  formation.place(particle, index, random, style);
  return particle;
}

describe("Formation", () => {
  it("centers the shape on the origin and keeps the spacing", () => {
    const formation = new Formation(solid(100, 40), settings());
    const random = new Random(1);
    const count = formation.prepare(surface, CENTER, random);
    const particles = Array.from({ length: count }, (_, index) => spawn(formation, index, random));
    const xs = particles.map((particle) => particle.formationToX);
    const ys = particles.map((particle) => particle.formationToY);

    expect(count).toBe(10 * 4);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(150);
    expect(Math.max(...xs)).toBeLessThanOrEqual(250);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(130);
    expect(Math.max(...ys)).toBeLessThanOrEqual(170);
  });

  it("scales a shape that does not fit down as a whole: same particles, smaller picture", () => {
    const formation = new Formation(solid(1000, 100), settings());
    const random = new Random(2);
    const count = formation.prepare(surface, CENTER, random);
    const xs = Array.from(
      { length: count },
      (_, index) => spawn(formation, index, random).formationToX,
    );

    // 0.9 of the 400 px canvas: the 1000 px shape (sampled at its own 10 px spacing) shrinks to 360 px
    expect(count).toBe(100 * 10);
    expect(formation.getScale()).toBeCloseTo(0.36, 5);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(360);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(340);
  });

  it("keeps the particles at full size when the shape fits", () => {
    const formation = new Formation(solid(100, 40), settings());
    formation.prepare(surface, CENTER, new Random(8));

    expect(formation.getScale()).toBe(1);
  });

  it("caps the particle count", () => {
    const formation = new Formation(solid(100, 100), settings({ limit: 12 }));

    expect(formation.prepare(surface, CENTER, new Random(3))).toBe(12);
  });

  it("appear: starts in place, holds without moving, then bursts outward", () => {
    const formation = new Formation(solid(100, 100), settings({ hold: 500 }));
    const random = new Random(4);
    formation.prepare(surface, CENTER, random);
    const particle = spawn(formation, 0, random);
    const target = { x: particle.formationToX, y: particle.formationToY };

    expect(particle.isForming).toBe(true);
    expect({ x: particle.x, y: particle.y }).toEqual(target);
    expect(formation.step(particle, 0.4)).toBe(true);
    expect({ x: particle.x, y: particle.y }).toEqual(target);

    expect(formation.step(particle, 0.2)).toBe(false);
    expect(particle.isForming).toBe(false);
    // the launch speed is kept, but it now points away from the center (within the release spread)
    expect(Math.hypot(particle.vx, particle.vy)).toBeCloseTo(1000, 3);
    const outward = Math.atan2(target.y - 150, target.x - 200);
    const released = Math.atan2(particle.vy, particle.vx);
    const gap = Math.abs(Math.atan2(Math.sin(released - outward), Math.cos(released - outward)));
    expect(gap).toBeLessThan((25 * Math.PI) / 180);
  });

  it("assemble: starts beyond the canvas edges and arrives when the fly-in ends", () => {
    const formation = new Formation(
      solid(100, 100),
      settings({ mode: "assemble", assemble: 800, hold: 200 }),
    );
    const random = new Random(5);
    const count = formation.prepare(surface, CENTER, random);

    for (let index = 0; index < count; index++) {
      const particle = spawn(formation, index, random);
      const isOutside =
        particle.x < 0 || particle.x > CANVAS.width || particle.y < 0 || particle.y > CANVAS.height;

      expect(isOutside).toBe(true);
      formation.step(particle, 0.8);
      expect(particle.x).toBeCloseTo(particle.formationToX, 5);
      expect(particle.y).toBeCloseTo(particle.formationToY, 5);
      expect(particle.isForming).toBe(true);
    }
  });

  it("paints particles with the image's colors", () => {
    const formation = new Formation(solid(40, 40, [0, 128, 255]), settings({ imageColors: true }));
    const random = new Random(6);
    formation.prepare(surface, CENTER, random);
    const particle = spawn(formation, 0, random);

    expect(particle.frontColor).toBe("rgb(0,128,255)");
    expect(particle.backColor).toBe("rgb(0,90,179)");
  });

  it("starts the sway from zero and skips the fade-in", () => {
    const formation = new Formation(solid(40, 40), settings());
    const random = new Random(7);
    formation.prepare(surface, CENTER, random);
    const particle = new Particle();
    particle.wobblePhase = 2;
    particle.fadeIn = 0.3;
    formation.place(particle, 0, random, style);

    expect(particle.wobblePhase).toBe(0);
    expect(particle.fadeIn).toBe(0);
  });
});
