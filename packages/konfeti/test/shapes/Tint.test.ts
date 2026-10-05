import { afterEach, describe, expect, it } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import { HandlerUtils } from "../../src/shapes/handlers/HandlerUtils";
import { ImageSource } from "../../src/utils/ImageSource";
import { TintedImageSource } from "../../src/utils/TintedImageSource";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

/**
 * Create a Loaded Canvas Image of a Given Size.
 *
 * @param width - Width in Pixels
 * @param height - Height in Pixels
 * @returns Canvas Element
 */
function image(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  return canvas;
}

/**
 * Fire Shapes on a Stepped Instance and Return the Burst.
 *
 * @param options - Fire Options
 * @returns Burst
 */
function fire(options: Parameters<KonfetiInstance["fire"]>[0]): Burst {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler });
  instances.push(konfeti);

  return konfeti.fire(options) as Burst;
}

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
});

describe("tint option", () => {
  it("reads true as multiply, keeps the modes, and is off by default", () => {
    expect(HandlerUtils.tintMode(undefined, "tint")).toBeNull();
    expect(HandlerUtils.tintMode(false, "tint")).toBeNull();
    expect(HandlerUtils.tintMode(true, "tint")).toBe("multiply");
    expect(HandlerUtils.tintMode("fill", "tint")).toBe("fill");
    expect(() => HandlerUtils.tintMode("screen", "shapes[0].tint")).toThrow(
      /"shapes\[0\]\.tint" must be true, false, "multiply" or "fill"/,
    );
  });

  it("gives every particle a copy in its own color", () => {
    const burst = fire({
      particleCount: 40,
      shapes: [{ type: "image", src: image(10, 10), tint: true, colors: ["#ff0000", "#00ff00"] }],
    });
    const images = burst.getParticles().map((particle) => particle.image);

    expect(images.every((source) => source instanceof TintedImageSource)).toBe(true);
    // one copy per palette color, shared by the particles of that color
    expect(new Set(images).size).toBe(2);
  });

  it("draws the image itself without a tint", () => {
    const burst = fire({ particleCount: 5, shapes: [{ type: "image", src: image(10, 10) }] });

    expect(
      burst.getParticles().some((particle) => particle.image instanceof TintedImageSource),
    ).toBe(false);
  });

  it("tints spritesheets too", () => {
    const burst = fire({
      particleCount: 10,
      shapes: [
        { type: "spritesheet", src: image(80, 10), frames: { cols: 8, rows: 1 }, tint: "fill" },
      ],
    });

    expect(
      burst.getParticles().every((particle) => particle.image instanceof TintedImageSource),
    ).toBe(true);
  });
});

describe("TintedImageSource", () => {
  it("paints each copy once and shares it", () => {
    const base = new ImageSource(image(40, 20));
    const red = new TintedImageSource(base, "#ff0000", "fill");

    expect(red.getImage()).toBe(new TintedImageSource(base, "#ff0000", "fill").getImage());
    expect(red.getImage()).not.toBe(new TintedImageSource(base, "#0000ff", "fill").getImage());
    expect(red.getImage()).not.toBe(new TintedImageSource(base, "#ff0000", "multiply").getImage());
  });

  it("keeps the image's size and aspect, scaled down to the longest side asked for", () => {
    const base = new ImageSource(image(400, 200));
    const copy = new ImageSource(
      new TintedImageSource(base, "#ff0000", "multiply", 100).getImage(),
    );

    expect(new TintedImageSource(base, "#ff0000", "multiply").getWidth()).toBe(400);
    expect([copy.getWidth(), copy.getHeight()]).toEqual([100, 50]);
  });

  it("waits for the base image to load", () => {
    const pending = new ImageSource({ width: 0, height: 0 } as unknown as CanvasImageSource);
    const tinted = new TintedImageSource(pending, "#ff0000", "fill");

    expect(tinted.isReady()).toBe(false);
    pending.setImage(image(8, 8));
    expect(tinted.isReady()).toBe(true);
    expect(tinted.getImage()).not.toBe(pending.getImage());
  });
});
