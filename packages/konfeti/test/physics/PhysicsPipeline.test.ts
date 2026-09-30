import { describe, expect, it } from "vitest";

import { PhysicsResolver } from "../../src/core/resolve/PhysicsResolver";
import { Particle } from "../../src/particles/Particle";
import { PhysicsPipeline } from "../../src/physics/PhysicsPipeline";

const world = { width: 800, height: 600, surface: null };

describe("PhysicsPipeline", () => {
  it("integrates gravity and drag frame-rate independently", () => {
    const pipeline = new PhysicsPipeline(PhysicsResolver.resolve([{ gravity: 0, drag: 2 }]));
    const coarse = new Particle();
    const fine = new Particle();
    coarse.vx = fine.vx = 1000;
    coarse.drag = fine.drag = 2;
    coarse.lifetime = fine.lifetime = 10000;

    for (let step = 0; step < 10; step++) {
      pipeline.step(coarse, 0.05, world);
    }

    for (let step = 0; step < 50; step++) {
      pipeline.step(fine, 0.01, world);
    }

    expect(coarse.vx).toBeCloseTo(fine.vx, 6);
    expect(coarse.vx).toBeCloseTo(1000 * Math.exp(-1), 6);
  });

  it("caps speed with terminalVelocity", () => {
    const pipeline = new PhysicsPipeline(PhysicsResolver.resolve([{ terminalVelocity: 100 }]));
    const particle = new Particle();
    particle.vx = 300;
    particle.vy = 400;

    pipeline.step(particle, 0.016, world);
    expect(Math.hypot(particle.vx, particle.vy)).toBeCloseTo(100, 5);
  });

  it("bounces off the floor and comes to rest", () => {
    const pipeline = new PhysicsPipeline(PhysicsResolver.resolve([{ floor: { bounce: 0.5 } }]));
    const particle = new Particle();
    particle.width = particle.height = 10;
    particle.y = 594;
    particle.vy = 400;
    particle.gravity = 700;

    pipeline.step(particle, 0.016, world);
    expect(particle.vy).toBeLessThan(0);
    expect(particle.y).toBe(595);

    for (let step = 0; step < 300; step++) {
      pipeline.step(particle, 0.016, world);
    }

    expect(particle.isResting).toBe(true);
    expect(particle.y).toBe(595);
  });

  it("pushes particles along a rotating direction with swirl", () => {
    const pipeline = new PhysicsPipeline(
      PhysicsResolver.resolve([{ swirl: true, drag: 0, gravity: 0 }]),
    );
    const particle = new Particle();
    particle.swirlStrength = 100;
    particle.swirlSpeed = Math.PI;

    pipeline.step(particle, 0.1, world);
    expect(particle.vx).toBeCloseTo(10, 5);
    expect(particle.swirlPhase).toBeCloseTo(Math.PI * 0.1, 5);
  });
});
