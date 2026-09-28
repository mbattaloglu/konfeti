import { describe, expect, it } from "vitest";

import { ParticlePool } from "../../src/core/ParticlePool";

describe("ParticlePool", () => {
  it("reuses released particles after resetting them", () => {
    const pool = new ParticlePool();
    const particle = pool.acquire();
    particle.x = 100;
    particle.frontColor = "red";

    pool.release(particle);
    const reused = pool.acquire();

    expect(reused).toBe(particle);
    expect(reused.x).toBe(0);
    expect(reused.frontColor).toBe("");
    expect(pool.getCreatedCount()).toBe(1);
  });

  it("pre-warms idle particles", () => {
    const pool = new ParticlePool();
    pool.warm(50);

    expect(pool.getIdleCount()).toBe(50);
    expect(pool.getCreatedCount()).toBe(50);
  });
});
