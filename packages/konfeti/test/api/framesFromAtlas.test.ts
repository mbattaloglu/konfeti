import { afterEach, describe, expect, it } from "vitest";

import { framesFromAtlas } from "../../src/api/framesFromAtlas";
import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import type { SpriteAtlas } from "../../src/types/SpriteAtlas";
import { ManualScheduler } from "../helpers/ManualScheduler";

/**
 * TexturePacker "JSON Hash" Atlas with Two Animations.
 */
const HASH: SpriteAtlas = {
  frames: {
    "coin_0.png": { frame: { x: 0, y: 0, w: 32, h: 32 } },
    "coin_1.png": { frame: { x: 32, y: 0, w: 32, h: 32 }, trimmed: false },
    "gem_0.png": { frame: { x: 0, y: 32, w: 24, h: 30 } },
  },
};

const instances: KonfetiInstance[] = [];

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
});

describe("framesFromAtlas", () => {
  it("reads a JSON Hash atlas in atlas order", () => {
    expect(framesFromAtlas(HASH)).toEqual([
      { x: 0, y: 0, width: 32, height: 32 },
      { x: 32, y: 0, width: 32, height: 32 },
      { x: 0, y: 32, width: 24, height: 30 },
    ]);
  });

  it("picks one animation by name prefix", () => {
    expect(framesFromAtlas(HASH, "gem_")).toEqual([{ x: 0, y: 32, width: 24, height: 30 }]);
  });

  it("reads a JSON Array atlas (Aseprite) by filename", () => {
    const atlas: SpriteAtlas = {
      frames: [
        { filename: "run 0", frame: { x: 0, y: 0, w: 16, h: 16 } },
        { filename: "run 1", frame: { x: 16, y: 0, w: 16, h: 16 } },
        { filename: "idle 0", frame: { x: 32, y: 0, w: 16, h: 16 } },
      ],
    };

    expect(framesFromAtlas(atlas, "run")).toHaveLength(2);
  });

  it("refuses what it cannot draw as given", () => {
    const rotated: SpriteAtlas = {
      frames: { a: { frame: { x: 0, y: 0, w: 8, h: 8 }, rotated: true } },
    };

    expect(() => framesFromAtlas(rotated)).toThrow(/"a" is rotated/);
    expect(() => framesFromAtlas(HASH, "star_")).toThrow(/no frames named "star_…"/);
    expect(() =>
      framesFromAtlas(JSON.parse('{"frames":{"a":{"frame":{"x":0}}}}') as SpriteAtlas),
    ).toThrow(/needs a frame \{ x, y, w, h \}/);
    expect(() => framesFromAtlas(JSON.parse("{}") as SpriteAtlas)).toThrow(/needs a "frames"/);
  });

  it("feeds a spritesheet shape", () => {
    const sheet = document.createElement("canvas");
    sheet.width = 64;
    sheet.height = 64;
    const konfeti = new KonfetiInstance(null, { frameScheduler: new ManualScheduler() });
    instances.push(konfeti);
    const burst = konfeti.fire({
      particleCount: 5,
      shapes: [{ type: "spritesheet", src: sheet, frames: framesFromAtlas(HASH, "coin_") }],
    }) as Burst;

    expect(burst.getParticles().every((particle) => particle.frameCount === 2)).toBe(true);
  });
});
